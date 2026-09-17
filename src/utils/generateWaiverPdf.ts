import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { WAIVER_SECTIONS, WAIVER_VERSION, MINOR_CLAUSE } from "../data/waiverTerms";

export interface WaiverPdfData {
  submissionId: string;
  activityName: string;
  clubName?: string;
  participantName: string;
  dob: string;
  phoneEmail?: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  isMinor: boolean;
  guardianName?: string;
  relationship?: string;
  signedDate: string;
  signedTimestamp: string;
  timezone: string;
  participantSignatureBase64: string;
  guardianSignatureBase64?: string;
  clientIp?: string;
  userAgent?: string;
}

// Helper to sanitize ASCII for standard Helvetica
function sanitizeAscii(str: string, fallback = "N/A"): string {
  if (!str) return fallback;
  // Replace smart quotes and dashes with standard ASCII
  let s = str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...");
  
  // Filter any non-ASCII characters for standard font safety
  const filtered = s.replace(/[^\x20-\x7E\n\r\t]/g, "").replace(/\s+/g, " ").trim();
  return filtered || fallback;
}

// Render dynamic metadata card to PNG data URL using browser canvas
function renderMetaCardCanvas(data: WaiverPdfData): string | null {
  if (typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    const width = 1064; // 532pt * 2 (Retina 2x)
    const height = data.isMinor ? 230 : 180;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Left accent stripe
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, 8, height);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
    
    let y = 38;
    const clubLabel = data.clubName ? ` [${data.clubName}]` : "";
    ctx.fillText(`Activity / 活动: ${data.activityName}${clubLabel}`, 24, y);

    y += 34;
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(`Participant / 参加者: ${data.participantName}       DOB: ${data.dob || "N/A"}       Date: ${data.signedDate}`, 24, y);

    y += 32;
    ctx.font = "normal 19px -apple-system, BlinkMacSystemFont, \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
    ctx.fillStyle = "#475569";
    const contact = data.email || data.phoneEmail || "N/A";
    const phone = data.phone ? ` | Tel: ${data.phone}` : "";
    const emerg = data.emergencyContact ? ` | Emergency: ${data.emergencyContact}` : "";
    ctx.fillText(`Contact: ${contact}${phone}${emerg}`, 24, y);

    if (data.isMinor) {
      y += 32;
      ctx.font = "bold 19px -apple-system, BlinkMacSystemFont, \"PingFang SC\", \"Microsoft YaHei\", sans-serif";
      ctx.fillStyle = "#b45309";
      ctx.fillText(`Minor Status: YES (未成年)   Parent/Guardian: ${data.guardianName || "N/A"} (${data.relationship || "监护人"})`, 24, y);
    }

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Canvas meta card error:", e);
    return null;
  }
}

export async function generateWaiverPdf(data: WaiverPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function checkY(needed: number) {
    if (y - needed < margin + 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawText(text: string, size: number, font = fontRegular, color = rgb(0.1, 0.1, 0.1), indent = 0) {
    const cleanText = sanitizeAscii(text, "");
    const lines = wrapText(cleanText, contentWidth - indent, font, size);
    for (const line of lines) {
      checkY(size + 3);
      currentPage.drawText(line, {
        x: margin + indent,
        y: y - size,
        size,
        font,
        color,
      });
      y -= size + 3;
    }
  }

  // Draw Header
  currentPage.drawText("NORTH AMERICA CHINESE UNIVERSITY ALUMNI ALLIANCE", {
    x: margin,
    y: y - 12,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 15;

  currentPage.drawText("Washington State Chapter (NACUAA WA)", {
    x: margin,
    y: y - 10,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 16;

  currentPage.drawText("RELEASE OF LIABILITY AGREEMENT", {
    x: margin,
    y: y - 14,
    size: 14,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });
  y -= 18;

  currentPage.drawText(`Document Version: ${WAIVER_VERSION}   |   English text controls and prevails in all respects`, {
    x: margin,
    y: y - 8,
    size: 8,
    font: fontItalic,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 14;

  // Horizontal divider
  currentPage.drawLine({
    start: { x: margin, y: y },
    end: { x: pageWidth - margin, y: y },
    thickness: 1,
    color: rgb(0.75, 0.8, 0.85),
  });
  y -= 12;

  // Embed Activity & Participant Meta Box (Canvas image for CJK support or vector fallback)
  const metaCardBase64 = renderMetaCardCanvas(data);
  if (metaCardBase64) {
    const cardHeight = data.isMinor ? 115 : 90;
    checkY(cardHeight + 10);
    try {
      const cleanImg = metaCardBase64.replace(/^data:image\/\w+;base64,/, "");
      const imgBytes = Uint8Array.from(atob(cleanImg), c => c.charCodeAt(0));
      const metaImage = await pdfDoc.embedPng(imgBytes);
      currentPage.drawImage(metaImage, {
        x: margin,
        y: y - cardHeight,
        width: contentWidth,
        height: cardHeight,
      });
      y -= cardHeight + 12;
    } catch(e) {
      console.warn("Failed to embed meta card image, using text fallback", e);
      drawMetaCardText();
    }
  } else {
    drawMetaCardText();
  }

  function drawMetaCardText() {
    checkY(65);
    const metaLines = [
      `Activity / Event: ${sanitizeAscii(data.activityName, "Activity")}${data.clubName ? " (" + sanitizeAscii(data.clubName) + ")" : ""}`,
      `Participant Name: ${sanitizeAscii(data.participantName, "Participant")}     DOB: ${sanitizeAscii(data.dob, "N/A")}     Signing Date: ${sanitizeAscii(data.signedDate)}`,
      `Contact: ${sanitizeAscii(data.email || data.phoneEmail || "N/A")}     Emergency: ${sanitizeAscii(data.emergencyContact, "N/A")}`
    ];
    if (data.isMinor) {
      metaLines.push(`Participant is a Minor: YES     Guardian: ${sanitizeAscii(data.guardianName, "N/A")} (${sanitizeAscii(data.relationship, "Guardian")})`);
    }

    for (const line of metaLines) {
      currentPage.drawText(line, {
        x: margin + 8,
        y: y - 10,
        size: 8.5,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.3),
      });
      y -= 12;
    }
    y -= 8;
  }

  // Language Control Notice
  checkY(35);
  currentPage.drawRectangle({
    x: margin,
    y: y - 28,
    width: contentWidth,
    height: 28,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.8, 0.85, 0.95),
    borderWidth: 0.8,
  });
  currentPage.drawText("LANGUAGE CONTROL CLAUSE:", {
    x: margin + 8,
    y: y - 10,
    size: 8,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.6),
  });
  currentPage.drawText("This Agreement is executed in English. Any translation provided is for convenience only. If any conflict arises, the English version controls.", {
    x: margin + 8,
    y: y - 21,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });
  y -= 38;

  // Legal Sections 1 - 10
  for (const sec of WAIVER_SECTIONS) {
    checkY(25);
    currentPage.drawText(sanitizeAscii(sec.titleEn), {
      x: margin,
      y: y - 10,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    y -= 13;

    drawText(sec.textEn, 8, fontRegular, rgb(0.2, 0.2, 0.2));
    y -= 6;
  }

  // Declaration
  checkY(40);
  drawText("I HAVE FULLY INFORMED MYSELF OF THE CONTENTS OF THIS AGREEMENT BY READING IT BEFORE SIGNING IT. BY SIGNING BELOW, I EXPRESS MY UNDERSTANDING AND INTENT TO ENTER INTO THIS RELEASE OF LIABILITY WILLINGLY AND VOLUNTARILY.", 8, fontBold, rgb(0.05, 0.05, 0.05));
  y -= 10;

  // Minor clause if applicable
  if (data.isMinor) {
    checkY(50);
    currentPage.drawText(sanitizeAscii(MINOR_CLAUSE.titleEn + " - " + MINOR_CLAUSE.subtitleEn), {
      x: margin,
      y: y - 10,
      size: 9,
      font: fontBold,
      color: rgb(0.7, 0.1, 0.1),
    });
    y -= 13;
    drawText(MINOR_CLAUSE.textEn, 8, fontRegular, rgb(0.2, 0.2, 0.2));
    y -= 10;
  }

  // Signatures Box
  checkY(130);
  currentPage.drawLine({
    start: { x: margin, y: y },
    end: { x: pageWidth - margin, y: y },
    thickness: 1,
    color: rgb(0.75, 0.8, 0.85),
  });
  y -= 12;

  const sigColWidth = data.isMinor ? (contentWidth - 20) / 2 : contentWidth;

  // Participant Signature
  const pSigY = y;
  currentPage.drawText("PARTICIPANT SIGNATURE", {
    x: margin,
    y: y - 9,
    size: 8.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  currentPage.drawText(`Name: ${sanitizeAscii(data.participantName, "Participant")}   |   Date: ${sanitizeAscii(data.signedDate)}`, {
    x: margin,
    y: y - 20,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  if (data.participantSignatureBase64) {
    try {
      const sigClean = data.participantSignatureBase64.replace(/^data:image\/\w+;base64,/, "");
      const sigBytes = Uint8Array.from(atob(sigClean), c => c.charCodeAt(0));
      const sigImage = await pdfDoc.embedPng(sigBytes);
      currentPage.drawImage(sigImage, {
        x: margin,
        y: y - 75,
        width: 140,
        height: 50,
      });
    } catch (e) {
      console.warn("Failed to embed participant signature image", e);
    }
  }

  // Guardian Signature if minor
  if (data.isMinor && data.guardianSignatureBase64) {
    const gX = margin + sigColWidth + 20;
    currentPage.drawText("PARENT / LEGAL GUARDIAN SIGNATURE", {
      x: gX,
      y: pSigY - 9,
      size: 8.5,
      font: fontBold,
      color: rgb(0.7, 0.1, 0.1),
    });
    currentPage.drawText(`Guardian: ${sanitizeAscii(data.guardianName, "Guardian")} (${sanitizeAscii(data.relationship, "Guardian")})`, {
      x: gX,
      y: pSigY - 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });

    try {
      const gSigClean = data.guardianSignatureBase64.replace(/^data:image\/\w+;base64,/, "");
      const gSigBytes = Uint8Array.from(atob(gSigClean), c => c.charCodeAt(0));
      const gSigImage = await pdfDoc.embedPng(gSigBytes);
      currentPage.drawImage(gSigImage, {
        x: gX,
        y: pSigY - 75,
        width: 140,
        height: 50,
      });
    } catch (e) {
      console.warn("Failed to embed guardian signature image", e);
    }
  }

  y -= 85;

  // Electronic Signature Attestation & Audit Trail
  checkY(35);
  currentPage.drawRectangle({
    x: margin,
    y: y - 26,
    width: contentWidth,
    height: 26,
    color: rgb(0.96, 0.96, 0.97),
    borderColor: rgb(0.85, 0.85, 0.88),
    borderWidth: 0.5,
  });

  currentPage.drawText(`ELECTRONIC RECORD & AUDIT TRAIL   |   Submission ID: ${sanitizeAscii(data.submissionId)}`, {
    x: margin + 6,
    y: y - 9,
    size: 7.5,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });

  currentPage.drawText(`Signed At: ${sanitizeAscii(data.signedTimestamp)} (${sanitizeAscii(data.timezone, "Local")})   |   Signed via wa.nacuaa.ai/waiver/`, {
    x: margin + 6,
    y: y - 19,
    size: 7,
    font: fontRegular,
    color: rgb(0.35, 0.35, 0.4),
  });

  // Number all pages
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    page.drawText(`Page ${i + 1} of ${totalPages}   -   NACUAA WA Release of Liability (${WAIVER_VERSION})   -   English Controls`, {
      x: margin,
      y: margin - 15,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return await pdfDoc.save();
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}
