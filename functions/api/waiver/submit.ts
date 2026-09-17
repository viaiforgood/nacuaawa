import { sendSmtpEmail } from "./_smtp";

export interface Env {
  DB?: any;
  BUCKET?: any;
  WAIVER_KV?: any;
  WAIVER_ADMIN_KEY?: string;
  ADMIN_KEY?: string;
  RESEND_API_KEY?: string;
  ADMIN_NOTIFY_EMAIL?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string | number;
  SMTP_FROM?: string;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const data = await request.json() as any;
    
    // Validate mandatory fields
    if (!data.participantName || !data.activityName || !data.signedDate) {
      return new Response(JSON.stringify({ error: "Missing required fields: participantName, activityName, signedDate" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!data.participantSignatureBase64) {
      return new Response(JSON.stringify({ error: "Participant signature is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (data.isMinor && (!data.guardianName || !data.guardianSignatureBase64)) {
      return new Response(JSON.stringify({ error: "Minor requires parent/guardian name and signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = data.submissionId || "ROL-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Device";
    const version = data.version || "NACUAAWA-ROL-2026-09";
    const r2Key = `waivers/${new Date().toISOString().slice(0, 7)}/${id}.pdf`;

    const rawEmail = (data.email || data.phoneEmail || "").trim();
    const signerEmail = rawEmail.includes("@") ? rawEmail : "";
    const adminEmail = env.ADMIN_NOTIFY_EMAIL || "ashley@nacuaa.ai";
    const waiverOfficialEmail = "waiver@wa.nacuaa.ai";

    // 1. Save PDF to R2 if available
    if (env.BUCKET && data.pdfBase64) {
      try {
        const cleanBase64 = data.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const binary = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
        await env.BUCKET.put(r2Key, binary, {
          httpMetadata: { contentType: "application/pdf" },
          customMetadata: {
            id,
            participant: data.participantName,
            activity: data.activityName,
            signedDate: data.signedDate,
            version,
            signerEmail
          }
        });
      } catch (e) {
        console.warn("R2 storage error:", e);
      }
    }

    // 2. Save metadata to D1 if available
    if (env.DB) {
      try {
        await env.DB.exec(`
          CREATE TABLE IF NOT EXISTS waivers (
            id TEXT PRIMARY KEY,
            club TEXT,
            activity_name TEXT,
            participant_name TEXT,
            dob TEXT,
            is_minor INTEGER,
            guardian_name TEXT,
            relationship TEXT,
            phone_email TEXT,
            email TEXT,
            phone TEXT,
            emergency_contact TEXT,
            signer_ip TEXT,
            user_agent TEXT,
            version TEXT,
            signed_at TEXT,
            r2_pdf_key TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await env.DB.prepare(`
          INSERT INTO waivers (
            id, club, activity_name, participant_name, dob, is_minor,
            guardian_name, relationship, phone_email, email, phone, emergency_contact,
            signer_ip, user_agent, version, signed_at, r2_pdf_key
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          data.club || "",
          data.activityName,
          data.participantName,
          data.dob || "",
          data.isMinor ? 1 : 0,
          data.guardianName || "",
          data.relationship || "",
          data.phoneEmail || signerEmail || "",
          signerEmail,
          data.phone || "",
          data.emergencyContact || "",
          clientIp,
          userAgent,
          version,
          data.signedTimestamp || new Date().toISOString(),
          env.BUCKET && data.pdfBase64 ? r2Key : ""
        ).run();
      } catch (e) {
        console.warn("D1 storage error:", e);
      }
    }

    // 3. Save to KV if available as fallback/cache
    if (env.WAIVER_KV) {
      try {
        const record = {
          id,
          club: data.club || "",
          activityName: data.activityName,
          participantName: data.participantName,
          dob: data.dob || "",
          isMinor: !!data.isMinor,
          guardianName: data.guardianName || "",
          relationship: data.relationship || "",
          email: signerEmail,
          phone: data.phone || "",
          emergencyContact: data.emergencyContact || "",
          signerIp: clientIp,
          userAgent,
          version,
          signedAt: data.signedTimestamp || new Date().toISOString(),
          r2Key: env.BUCKET && data.pdfBase64 ? r2Key : ""
        };
        await env.WAIVER_KV.put("waiver:" + id, JSON.stringify(record));
      } catch (e) {
        console.warn("KV storage error:", e);
      }
    }

    // 4. Send Email Notification with PDF Attachment (to Signer, Ashley, and waiver@wa.nacuaa.ai)
    let emailSent = false;
    let emailMessage = "";

    const recipients = Array.from(new Set([adminEmail, waiverOfficialEmail, signerEmail].filter(Boolean)));

    if (data.pdfBase64 && recipients.length > 0) {
      const cleanBase64 = data.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
      const emailSubject = `【活动免责签署回执】${data.activityName} - ${data.participantName} (NACUAA WA)`;
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #1e293b; margin: 0 0 6px 0; font-size: 20px;">NACUAA WA 活动免责与责任豁免签署回执</h2>
            <p style="color: #64748b; margin: 0; font-size: 13px;">北美高校联盟华盛顿州分会（西雅图分会，NACUAA WA）· Release of Liability</p>
          </div>
          
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            尊敬的 <strong>${data.participantName}</strong>：
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            您已成功完成 <strong>${data.activityName}</strong> 的活动免责声明与责任豁免协议签署（版本号：${version}）。电子签署副本已随本邮件附件（PDF）发送给您及分会官方备份归档。
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>活动名称：</strong> ${data.activityName}</p>
            ${(data.clubName || data.club) ? `<p style="margin: 4px 0;"><strong>所属俱乐部/组织：</strong> ${data.clubName || data.club}</p>` : ""}
            <p style="margin: 4px 0;"><strong>参加者姓名：</strong> ${data.participantName}</p>
            <p style="margin: 4px 0;"><strong>出生日期：</strong> ${data.dob || "N/A"}</p>
            ${data.isMinor ? `<p style="margin: 4px 0; color: #b45309;"><strong>未成年人监护人：</strong> ${data.guardianName} (${data.relationship || "监护人"})</p>` : ""}
            <p style="margin: 4px 0;"><strong>签署编号：</strong> <code style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px;">${id}</code></p>
            <p style="margin: 4px 0;"><strong>签署时间：</strong> ${data.signedTimestamp || new Date().toISOString()} (${data.timezone || "Local"})</p>
          </div>

          <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px;">
            提示：本免责协议以英文正文为最终法律效力文本（English text controls and prevails）。请妥善保管邮件中的 PDF 附件。<br>
            官方免责联络邮箱：<a href="mailto:waiver@wa.nacuaa.ai" style="color: #2563eb;">waiver@wa.nacuaa.ai</a><br>
            北美高校联盟华盛顿州分会 · <a href="https://wa.nacuaa.ai" style="color: #2563eb; text-decoration: none;">wa.nacuaa.ai</a>
          </p>
        </div>
      `;

      // A. Try Google Workspace SMTP first if credentials provided
      if (env.SMTP_USER && env.SMTP_PASS) {
        try {
          const fromAddr = env.SMTP_FROM || `NACUAA WA Waivers <${env.SMTP_USER}>`;
          await sendSmtpEmail({
            host: env.SMTP_HOST || "smtp.gmail.com",
            port: Number(env.SMTP_PORT) || 465,
            username: env.SMTP_USER,
            password: env.SMTP_PASS,
            from: fromAddr,
            to: recipients,
            replyTo: "waiver@wa.nacuaa.ai"
          }, {
            subject: emailSubject,
            html: emailHtml,
            attachments: [
              {
                filename: `NACUAAWA_Release_${id}.pdf`,
                contentBase64: cleanBase64,
                contentType: "application/pdf"
              }
            ]
          });
          emailSent = true;
          emailMessage = `Sent via Google SMTP to ${recipients.join(", ")}`;
        } catch (smtpErr: any) {
          console.warn("Google SMTP send error:", smtpErr);
          emailMessage = `Google SMTP error: ${smtpErr.message || smtpErr}`;
        }
      }

      // B. Fallback to Resend API if SMTP not configured or failed
      if (!emailSent && env.RESEND_API_KEY) {
        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.RESEND_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "NACUAA WA Waivers <waiver@wa.nacuaa.ai>",
              reply_to: "waiver@wa.nacuaa.ai",
              to: recipients,
              subject: emailSubject,
              html: emailHtml,
              attachments: [
                {
                  filename: `NACUAAWA_Release_${id}.pdf`,
                  content: cleanBase64
                }
              ]
            })
          });

          if (resendRes.ok) {
            emailSent = true;
            emailMessage = `Sent via Resend to ${recipients.join(", ")}`;
          } else {
            const errText = await resendRes.text();
            console.warn("Resend API failed:", errText);
            emailMessage = `Resend error: ${errText}`;
          }
        } catch (resendErr: any) {
          console.warn("Resend email send error:", resendErr);
          emailMessage = resendErr.message || "Failed to dispatch email via Resend";
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      id,
      version,
      clientIp,
      emailSent,
      emailMessage,
      recipients,
      message: "Release of Liability agreement recorded successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Server error processing waiver" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
