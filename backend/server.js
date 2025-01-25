// backend/server.js
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs'); 
const { Readable } = require('stream');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Helper function to convert a buffer to a readable stream
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal the end of data
  return stream;
}

// Function to generate audio from text using ElevenLabs API
const createAudioFileFromText = async (text) => {
  return new Promise(async (resolve, reject) => {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID;
      const modelId = process.env.ELEVENLABS_MODEL_ID;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_XI_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: modelId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `ElevenLabs API error: ${response.status} - ${errorData.detail}`
        );
      }

      const audioBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to Buffer
      const audio = Buffer.from(audioBuffer);

      const fileName = `${uuid()}.mp3`;
      const filePath = path.join(__dirname, 'public', fileName);

      // Create 'public' directory if it doesn't exist
      const publicDir = path.join(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }

      const fileStream = fs.createWriteStream(filePath);

      const audioStream = bufferToStream(audio); // Convert buffer to stream
      audioStream.pipe(fileStream);

      fileStream.on('finish', () => resolve(fileName));
      fileStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send({ success: true, filePath: req.file.path });
});

// Endpoint to generate podcast from transcript
app.post('/api/generate-from-transcript', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res
        .status(400)
        .json({ success: false, message: 'No transcript provided' });
    }

    const fileName = await createAudioFileFromText(transcript);
    res.json({ success: true, audio: `/public/${fileName}` }); // Send the path to the audio file
  } catch (error) {
    console.error('Error generating podcast from transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating podcast from transcript',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.send('Hello, Podcast Generator!');
});

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
