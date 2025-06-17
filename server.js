const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static('public'));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('لا يوجد ملف مرفق');
  }

  const fileMetadata = {
    name: req.file.originalname,
    parents: [process.env.FOLDER_ID],
  };

  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path),
  };

  try {
    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    fs.unlinkSync(req.file.path);
    res.status(200).send('تم رفع الملف بنجاح!');
  } catch (error) {
    console.error('حدث خطأ أثناء الرفع إلى Google Drive:', error);
    res.status(500).send('فشل في رفع الملف');
  }
});

// 🔁 هذا السطر مهم جداً في Render:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
