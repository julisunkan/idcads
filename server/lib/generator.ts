import QRCode from 'qrcode';
import { createCanvas, loadImage, registerFont } from 'canvas';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { type Card, type Settings } from '@shared/schema';

// Helper to ensure directory exists
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export async function generateAssets(card: Card, settings: Settings) {
  const publicDir = path.join(process.cwd(), 'client', 'public'); // Vite serves from client/public? Or we serve 'uploads' statically
  // Actually in Replit templates, 'public' might be in client/public or we create a separate uploads folder served by express.
  // We will assume a specific 'uploads' directory served by express static
  const outputDir = path.join(process.cwd(), 'uploads');
  ensureDir(outputDir);
  ensureDir(path.join(outputDir, 'qr'));
  ensureDir(path.join(outputDir, 'cards'));
  ensureDir(path.join(outputDir, 'pdfs'));

  // 1. Generate QR Code
  const verifyUrl = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000'}/verify/${card.idNumber}`;
  const qrFilename = `qr/qr_${card.id}.png`;
  const qrPath = path.join(outputDir, qrFilename);
  await QRCode.toFile(qrPath, verifyUrl);
  const qrCodeUrl = `/uploads/${qrFilename}`;

  // 2. Generate Card Image
  const width = 600; // ID-1 format ratio roughly 85.60 × 53.98 mm
  const height = 378; 
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = card.theme === 'blue' ? '#e6f0ff' : card.theme === 'green' ? '#e6ffec' : '#fffbeb';
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = card.theme === 'blue' ? '#003366' : card.theme === 'green' ? '#004d00' : '#664d00';
  ctx.fillRect(0, 0, width, 60);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(card.country.toUpperCase(), width / 2, 40);

  // Photo Placeholder (or load actual if URL is valid)
  // For MVP we just draw a rect
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(20, 80, 120, 160);
  ctx.strokeStyle = '#333333';
  ctx.strokeRect(20, 80, 120, 160);
  ctx.fillStyle = '#666666';
  ctx.font = '12px sans-serif';
  ctx.fillText('PHOTO', 80, 160);

  // Info
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Name:', 160, 100);
  ctx.font = '16px sans-serif';
  ctx.fillText(card.fullName, 220, 100);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('DOB:', 160, 140);
  ctx.font = '16px sans-serif';
  ctx.fillText(card.dob, 220, 140);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('ID No:', 160, 180);
  ctx.font = '16px sans-serif';
  ctx.fillText(card.idNumber, 220, 180);

  // QR Code
  const qrImage = await loadImage(qrPath);
  ctx.drawImage(qrImage, 480, 260, 100, 100);

  // Watermark
  if (settings.watermarkEnabled) {
    ctx.save();
    ctx.globalAlpha = (settings.watermarkOpacity || 50) / 255;
    ctx.fillStyle = settings.watermarkColor || '#000000';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(width/2, height/2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(settings.watermarkText || 'WATERMARK', 0, 0);
    ctx.restore();
  }

  const cardFilename = `cards/card_${card.id}.png`;
  const cardPath = path.join(outputDir, cardFilename);
  const out = fs.createWriteStream(cardPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  await new Promise((resolve) => out.on('finish', resolve));
  const generatedImageUrl = `/uploads/${cardFilename}`;

  // 3. Generate PDF
  const pdfFilename = `pdfs/card_${card.id}.pdf`;
  const pdfPath = path.join(outputDir, pdfFilename);
  const doc = new PDFDocument({ size: [width, height] });
  const pdfStream = fs.createWriteStream(pdfPath);
  doc.pipe(pdfStream);
  doc.image(cardPath, 0, 0, { width, height });
  doc.end();
  await new Promise((resolve) => pdfStream.on('finish', resolve));
  const generatedPdfUrl = `/uploads/${pdfFilename}`;

  return { qrCodeUrl, generatedImageUrl, generatedPdfUrl };
}
