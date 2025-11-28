
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mammoth = require('mammoth');
const axios = require('axios');
const dotenv = require('dotenv');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

dotenv.config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('exports')) fs.mkdirSync('exports');
if (!fs.existsSync('fonts')) fs.mkdirSync('fonts');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

const FONT_URDU_SINDHI = path.join(__dirname, 'fonts', 'Amiri-Regular.ttf');
console.log("FONT FOUND?", FONT_URDU_SINDHI, fs.existsSync(FONT_URDU_SINDHI));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

async function freeTranslate(text, targetLang) {
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
    const response = await axios.post(url, {
      q: text,
      target: targetLang
    });
    if (response.data && response.data.data && response.data.data.translations[0]) {
      return response.data.data.translations[0].translatedText;
    }
    return '';
  } catch (err) {
    console.error("Translation error:", err.message);
    return "";
  }
}


app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ error: "No text provided" });

    const sindhi = text;
    const urdu = await freeTranslate(sindhi, "ur");
    const english = await freeTranslate(sindhi, "en");

    res.json({ sindhi, urdu, english });
  } catch (err) {
    console.error("Translate error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const ext = path.extname(file.originalname).toLowerCase();
    let text = "";

    if (ext === '.txt') {
      text = fs.readFileSync(file.path, 'utf8');
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value || '';
    } else {
      return res.status(400).json({ error: "Invalid file type" });
    }

    fs.unlinkSync(file.path);
    res.json({ text });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "File processing failed" });
  }
});

app.post('/api/export', async (req, res) => {
  const { sindhi, urdu, english, type } = req.body;
  const timestamp = Date.now();

  if (!sindhi && !urdu && !english)
    return res.status(400).json({ error: "Nothing to export" });

  try {
    if (type === "pdf") {
      const filename = `export-${timestamp}.pdf`;
      const filepath = path.join(__dirname, 'exports', filename);
      
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        bufferPages: true
      });
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      let usingCustomFont = false;
      try {
        if (fs.existsSync(FONT_URDU_SINDHI)) {
          doc.registerFont("urdu-sindhi", FONT_URDU_SINDHI);
          doc.font("urdu-sindhi");
          usingCustomFont = true;
          console.log("✓ PDF using custom font:", FONT_URDU_SINDHI);
        } else {
          console.log("⚠ Font missing at:", FONT_URDU_SINDHI);
          console.log("⚠ Using default font (text may not display correctly)");
        }
      } catch (fontErr) {
        console.error("FONT ERROR:", fontErr.message);
      }

      doc.fontSize(20).fillColor('#2c3e50')
         .text("Translation Export", { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#3498db').lineWidth(2)
         .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1.5);

      doc.fontSize(16).fillColor('#2980b9')
         .text("Sindhi:", { underline: true, continued: false });
      doc.moveDown(0.3);
      
      if (usingCustomFont) {
        doc.font("urdu-sindhi").fontSize(14).fillColor('#000000')
           .text(sindhi || "(No Sindhi text)", { 
             align: "right",
             width: 495,
             lineGap: 5
           });
      } else {
        doc.fontSize(14).fillColor('#000000')
           .text(sindhi || "(No Sindhi text)", { 
             align: "left",
             width: 495,
             lineGap: 5
           });
      }
      doc.moveDown(1.5);

      doc.fontSize(16).fillColor('#2980b9')
         .text("Urdu:", { underline: true, continued: false });
      doc.moveDown(0.3);
      
      if (usingCustomFont) {
        doc.font("urdu-sindhi").fontSize(14).fillColor('#000000')
           .text(urdu || "(No Urdu translation)", { 
             align: "right",
             width: 495,
             lineGap: 5
           });
      } else {
        doc.fontSize(14).fillColor('#000000')
           .text(urdu || "(No Urdu translation)", { 
             align: "left",
             width: 495,
             lineGap: 5
           });
      }
      doc.moveDown(1.5);

      doc.font("Helvetica").fontSize(16).fillColor('#2980b9')
         .text("English:", { underline: true, continued: false });
      doc.moveDown(0.3);
      doc.fontSize(14).fillColor('#000000')
         .text(english || "(No English translation)", { 
           align: "left",
           width: 495,
           lineGap: 5
         });

      doc.moveDown(2);
      doc.fontSize(10).fillColor('#7f8c8d')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();

      stream.on("finish", () => {
        console.log("✓ PDF created successfully:", filename);
        res.json({ url: `/exports/${filename}` });
      });
      
      stream.on("error", (err) => {
        console.error("PDF STREAM ERROR:", err);
        res.status(500).json({ error: "PDF generation failed" });
      });

      return;
    }

    if (type === "xlsx") {
      const filename = `export-${timestamp}.xlsx`;
      const filepath = path.join(__dirname, 'exports', filename);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Translations");

      sheet.columns = [
        { header: 'Sindhi', key: 'sindhi', width: 40 },
        { header: 'Urdu', key: 'urdu', width: 40 },
        { header: 'English', key: 'english', width: 40 }
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2980B9' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      const dataRow = sheet.addRow({
        sindhi: sindhi || '',
        urdu: urdu || '',
        english: english || ''
      });

      dataRow.height = 60;
      dataRow.alignment = { 
        vertical: 'top', 
        horizontal: 'left',
        wrapText: true,
        readingOrder: 'rtl' 
      };
      dataRow.font = { size: 12 };

      sheet.getCell('A2').alignment = { 
        vertical: 'top', 
        horizontal: 'right',
        wrapText: true,
        readingOrder: 'rtl'
      };
      sheet.getCell('B2').alignment = { 
        vertical: 'top', 
        horizontal: 'right',
        wrapText: true,
        readingOrder: 'rtl'
      };

      ['A1', 'B1', 'C1', 'A2', 'B2', 'C2'].forEach(cellAddress => {
        sheet.getCell(cellAddress).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      await workbook.xlsx.writeFile(filepath);
      console.log("✓ Excel created successfully:", filename);
      return res.json({ url: `/exports/${filename}` });
    }

    if (type === "txt") {
      const filename = `export-${timestamp}.txt`;
      const filepath = path.join(__dirname, 'exports', filename);
      
      const content = 
`===========================================
TRANSLATION EXPORT
===========================================

Sindhi:
${sindhi || '(No Sindhi text)'}

-------------------------------------------

Urdu:
${urdu || '(No Urdu translation)'}

-------------------------------------------

English:
${english || '(No English translation)'}

===========================================
Generated on: ${new Date().toLocaleString()}
===========================================
`;
      fs.writeFileSync(filepath, content, "utf8");
      console.log("✓ TXT created successfully:", filename);
      return res.json({ url: `/exports/${filename}` });
    }

    res.status(400).json({ error: "Invalid export type" });
  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running → http://localhost:${PORT}`);
});
