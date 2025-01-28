// server.js
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const { Readable } = require('stream');
const { v4: uuid } = require('uuid');
const {
  GoogleAIFileManager,
  FileState,
} = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro-latest',
});
const fileManager = new GoogleAIFileManager(
  process.env.GEMINI_API_KEY
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const createAudioFileFromText = async (text) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_XI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVENLABS_MODEL_ID,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `${uuid()}.mp3`;
    const filePath = path.join(__dirname, 'public', fileName);

    if (!fs.existsSync('public')) fs.mkdirSync('public');
    fs.writeFileSync(filePath, Buffer.from(audioBuffer));

    return fileName;
  } catch (error) {
    throw new Error(`Audio generation failed: ${error.message}`);
  }
};

app.post('/api/asr', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ error: 'Audio file is required' });
    const uploadResult = await fileManager.uploadFile(req.file.path, {
      mimeType: req.file.mimetype,
      displayName: req.file.originalname,
    });

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED)
      throw new Error('Audio processing failed.');

    const result = await model.generateContent([
      { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
      { text: 'Generate a transcript of the speech.' },
    ]);
    res.json({ transcript: result.response.text() });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to process audio for ASR' });
  } finally {
    fs.unlink(
      req.file.path,
      (err) => err && console.error('File cleanup error:', err)
    );
  }
});

app.post('/api/generate-from-transcript', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript)
      return res
        .status(400)
        .json({ success: false, message: 'No transcript provided' });
    const fileName = await createAudioFileFromText(transcript);
    res.json({ success: true, audio: `/public/${fileName}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post(
  '/api/generate-from-audio',
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).send('No audio file uploaded.');
      const uploadResult = await fileManager.uploadFile(
        req.file.path,
        {
          mimeType: req.file.mimetype,
          displayName: req.file.originalname,
        }
      );

      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === FileState.PROCESSING) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === FileState.FAILED)
        throw new Error('Audio processing failed.');

      const result = await model.generateContent([
        'Generate a transcript of the speech.',
        { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
      ]);
      const transcript = result.response.text();
      const fileName = await createAudioFileFromText(transcript);
      res.json({ success: true, audio: `/public/${fileName}` });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: error.message });
    } finally {
      fs.unlink(
        req.file.path,
        (err) => err && console.error('File cleanup error:', err)
      );
    }
  }
);

app.use('/public', express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
