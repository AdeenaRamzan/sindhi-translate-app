// FILE: test-pdf.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Use the same font you use in server.js
const FONT_URDU_SINDHI = path.join(
  __dirname,
  'fonts',
  'NotoNastaliqUrdu-Regular.ttf'
);

console.log('Font path:', FONT_URDU_SINDHI, 'exists?', fs.existsSync(FONT_URDU_SINDHI));

const doc = new PDFDocument({ margin: 40 });
const outPath = path.join(__dirname, 'test-direct.pdf');
const stream = fs.createWriteStream(outPath);

doc.pipe(stream);

// Register & use the font
if (fs.existsSync(FONT_URDU_SINDHI)) {
  doc.registerFont('urdu-sindhi', FONT_URDU_SINDHI);
  doc.font('urdu-sindhi');
  console.log('Using urdu-sindhi font in test-direct.pdf');
} else {
  console.log('❌ Font not found, using default.');
}

// Sample text
const sindhiSample = 'توهان جو نالو ڇا آهي؟';
const urduSample = 'آپ کا نام کیا ہے؟';
const englishSample = "What's your name?";

doc.fontSize(16).text('Sindhi:', { underline: true });
doc.moveDown(0.5);
doc.fontSize(14).text(sindhiSample, { align: 'right' });

doc.moveDown(1);

doc.fontSize(16).text('Urdu:', { underline: true });
doc.moveDown(0.5);
doc.fontSize(14).text(urduSample, { align: 'right' });

doc.moveDown(1);

doc.fontSize(16).text('English:', { underline: true });
doc.moveDown(0.5);
doc.fontSize(14).text(englishSample, { align: 'left' });

doc.end();

stream.on('finish', () => {
  console.log('✅ Created test-direct.pdf');
});
