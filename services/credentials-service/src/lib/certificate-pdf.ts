import PDFDocument from 'pdfkit';
import type { Response as ExpressResponse } from 'express';

export interface CertificateData {
  recipientName: string;
  courseName:    string;
  issuerName:    string;
  issuedAt:      Date;
  credentialId:  string;
  issuerUrl:     string;
}

export function streamCertificatePDF(res: ExpressResponse, data: CertificateData): void {
  const doc = new PDFDocument({
    size:    'A4',
    layout:  'landscape',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="certificado-${data.credentialId.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  const W = doc.page.width;   // ~841.89 pts (A4 landscape)
  const H = doc.page.height;  // ~595.28 pts

  // Header bar
  doc.rect(0, 0, W, 108).fill('#16a34a');

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(30)
     .text('Universidad X', 0, 28, { align: 'center', width: W });

  doc.fillColor('#bbf7d0').font('Helvetica').fontSize(12)
     .text('Plataforma de Aprendizaje Adaptativo', 0, 68, { align: 'center', width: W });

  // Content background
  doc.rect(0, 108, W, H - 108 - 50).fill('#f0fdf4');

  // Certificate title
  doc.fillColor('#14532d').font('Helvetica-Bold').fontSize(15)
     .text('CERTIFICADO DE FINALIZACIÓN', 0, 134, {
       align: 'center', width: W, characterSpacing: 2,
     });

  // Preamble
  doc.fillColor('#6b7280').font('Helvetica').fontSize(12)
     .text('Se certifica que', 0, 168, { align: 'center', width: W });

  // Recipient name
  doc.fillColor('#14532d').font('Helvetica-Bold').fontSize(32)
     .text(data.recipientName, 40, 193, { align: 'center', width: W - 80 });

  // Decorative line
  const midX = W / 2;
  const lineY = 246;
  doc.moveTo(midX - 180, lineY).lineTo(midX + 180, lineY)
     .strokeColor('#16a34a').lineWidth(1.5).stroke();

  // Completion text
  doc.fillColor('#6b7280').font('Helvetica').fontSize(12)
     .text('completó satisfactoriamente el curso', 0, 260, { align: 'center', width: W });

  // Course name
  doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(21)
     .text(data.courseName, 60, 286, { align: 'center', width: W - 120 });

  // Issue date
  const dateStr = data.issuedAt.toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.fillColor('#9ca3af').font('Helvetica').fontSize(11)
     .text(`Emitido el ${dateStr}`, 0, 346, { align: 'center', width: W });

  // Credential metadata
  doc.fillColor('#d1d5db').font('Helvetica').fontSize(8)
     .text(`ID de credencial: ${data.credentialId}`, 0, 376, { align: 'center', width: W });

  doc.fillColor('#d1d5db').font('Helvetica').fontSize(8)
     .text(
       `Verificar en: ${data.issuerUrl}/verify/${data.credentialId}`,
       0, 389, { align: 'center', width: W },
     );

  // Footer bar
  doc.rect(0, H - 50, W, 50).fill('#14532d');

  doc.fillColor('#ffffff').font('Helvetica').fontSize(10)
     .text(data.issuerName, 0, H - 30, { align: 'center', width: W });

  doc.end();
}
