export interface SmtpConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
  from: string;
  to: string | string[];
  replyTo?: string;
  secureTransport?: 'auto' | 'off' | 'tls' | 'starttls';
  heloName?: string;
}

export interface SmtpAttachment {
  filename: string;
  contentBase64: string; // Clean base64 string
  contentType?: string;
}

export interface EmailMessage {
  subject: string;
  html: string;
  text?: string;
  attachments?: SmtpAttachment[];
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const bytes = encoder.encode(value);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function chunkBase64(str: string, chunkSize = 76): string {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks.join('\r\n');
}

function buildMultipartMime(config: SmtpConfig, message: EmailMessage): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const recipients = (Array.isArray(config.to) ? config.to : [config.to]).filter(Boolean);
  const now = new Date();
  const domain = config.from.includes('@') ? config.from.split('@').pop()?.replace(/[^a-zA-Z0-9.-]/g, '') : 'nacuaa.ai';
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domain || 'nacuaa.ai'}>`;

  const headers = [
    `From: ${config.from}`,
    `To: ${recipients.join(', ')}`,
    config.replyTo ? `Reply-To: ${config.replyTo}` : `Reply-To: ${config.from}`,
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ];

  let body = `${headers.join('\r\n')}\r\n\r\n`;

  // 1. HTML Body Part (Base64 encoded for safe UTF-8 transfer)
  const htmlBase64 = chunkBase64(btoa(unescape(encodeURIComponent(message.html))));
  body += `--${boundary}\r\n`;
  body += `Content-Type: text/html; charset=UTF-8\r\n`;
  body += `Content-Transfer-Encoding: base64\r\n\r\n`;
  body += `${htmlBase64}\r\n\r\n`;

  // 2. Attachments
  if (message.attachments && message.attachments.length > 0) {
    for (const att of message.attachments) {
      const cleanB64 = att.contentBase64.replace(/^data:.*?;base64,/, '');
      const encodedFilename = encodeHeader(att.filename);
      body += `--${boundary}\r\n`;
      body += `Content-Type: ${att.contentType || 'application/pdf'}; name="${encodedFilename}"\r\n`;
      body += `Content-Disposition: attachment; filename="${encodedFilename}"\r\n`;
      body += `Content-Transfer-Encoding: base64\r\n\r\n`;
      body += `${chunkBase64(cleanB64)}\r\n\r\n`;
    }
  }

  body += `--${boundary}--\r\n`;
  return body;
}

class SmtpSession {
  private socket: any;
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = '';

  constructor(socket: any) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async readResponse(expectedCodes: number[]): Promise<string> {
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) throw new Error('SMTP connection closed unexpectedly');
      this.buffer += decoder.decode(value, { stream: true });

      if (!this.buffer.endsWith('\r\n')) continue;

      const lines = this.buffer.split('\r\n').filter(Boolean);
      const lastLine = lines[lines.length - 1];
      // RFC 5321: final reply line has code followed by space (e.g. "250 OK"), intermediate lines have '-' (e.g. "250-STARTTLS")
      const match = lastLine?.match(/^(\d{3})\s/);
      if (!match) continue;

      const code = Number(match[1]);
      const response = this.buffer.trimEnd();
      this.buffer = '';

      if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP error ${code}: ${response}`);
      }

      return response;
    }
  }

  async command(cmd: string, expectedCodes: number[]): Promise<string> {
    await this.writer.write(encoder.encode(`${cmd}\r\n`));
    return this.readResponse(expectedCodes);
  }

  async writeData(data: string): Promise<void> {
    const chunkSize = 16384;
    const rawBytes = encoder.encode(data);
    for (let offset = 0; offset < rawBytes.length; offset += chunkSize) {
      const chunk = rawBytes.subarray(offset, offset + chunkSize);
      await this.writer.write(chunk);
    }
  }

  async startTls(): Promise<void> {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.socket = this.socket.startTls();
    this.reader = this.socket.readable.getReader();
    this.writer = this.socket.writable.getWriter();
    this.buffer = '';
  }

  async close(): Promise<void> {
    try {
      await this.command('QUIT', [221]);
    } catch {
      // Ignore quit errors during closing
    } finally {
      try {
        this.reader.releaseLock();
      } catch {}
      try {
        this.writer.releaseLock();
      } catch {}
      try {
        this.socket.close();
      } catch {}
    }
  }
}

export async function sendSmtpEmail(config: SmtpConfig, message: EmailMessage): Promise<void> {
  // @ts-ignore - cloudflare:sockets is provided by Cloudflare Workers runtime
  const { connect } = await import('cloudflare:sockets');

  const host = config.host || 'smtp.gmail.com';
  const port = config.port || 465;
  const isTls = port === 465;

  const socket = connect(
    { hostname: host, port },
    { secureTransport: isTls ? 'on' : 'off' }
  );

  const session = new SmtpSession(socket);
  const recipients = (Array.isArray(config.to) ? config.to : [config.to]).filter(Boolean);
  const cleanFrom = config.from.includes('<')
    ? config.from.substring(config.from.indexOf('<') + 1, config.from.indexOf('>'))
    : config.from;

  try {
    // 1. Initial banner
    await session.readResponse([220]);

    // 2. EHLO
    await session.command(`EHLO ${config.heloName || 'wa.nacuaa.ai'}`, [250]);

    // 3. STARTTLS if on port 587
    if (!isTls && (port === 587 || config.secureTransport === 'starttls')) {
      await session.command('STARTTLS', [220]);
      await session.startTls();
      await session.command(`EHLO ${config.heloName || 'wa.nacuaa.ai'}`, [250]);
    }

    // 4. AUTH LOGIN
    await session.command('AUTH LOGIN', [334]);
    await session.command(btoa(config.username), [334]);
    await session.command(btoa(config.password.replace(/\s+/g, '')), [235]);

    // 5. MAIL FROM
    await session.command(`MAIL FROM:<${cleanFrom.trim()}>`, [250]);

    // 6. RCPT TO
    for (const r of recipients) {
      const cleanRecipient = r.includes('<') ? r.substring(r.indexOf('<') + 1, r.indexOf('>')) : r;
      await session.command(`RCPT TO:<${cleanRecipient.trim()}>`, [250, 251]);
    }

    // 7. DATA
    await session.command('DATA', [354]);
    const rawMime = buildMultipartMime(config, message);
    await session.writeData(`${rawMime}\r\n.\r\n`);
    await session.readResponse([250]);

  } finally {
    await session.close();
  }
}
