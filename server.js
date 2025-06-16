const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
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
  const fileMetadata = {
    name: req.file.originalname,
    parents: [process.env.FOLDER_ID],
  };

  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path),
  };

  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    fs.unlinkSync(req.file.path);

    res.status(200).send('تم رفع الملف بنجاح!');
  } catch (error) {
    console.error('Error uploading to Google Drive', error);
    res.status(500).send('فشل في رفع الملف');
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
