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

const createAudioFileFromText = async (text, voice) => {
  try {
    const apiKey = process.env['PLAY.AI_API_SECRET'];
    const userId = process.env['PLAY.AI_USER_ID'];

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-USER-ID': userId,
    };

    const payload = {
      model: 'PlayDialog',
      text: text,
      voice: voice,
      outputFormat: 'mp3',
    };

    const response = await fetch(
      'https://api.play.ai/api/v1/tts/stream',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Play.ai API error: ${
          response.status
        } - ${await response.text()}`
      );
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
    const { transcript, voice } = req.body; // Get voice from request
    if (!transcript)
      return res
        .status(400)
        .json({ success: false, message: 'No transcript provided' });

    const fileName = await createAudioFileFromText(transcript, voice);
    res.json({ success: true, audio: `/public/${fileName}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// --- New Endpoint: /api/generate-from-conversation ---
app.post('/api/generate-from-conversation', async (req, res) => {
  try {
    const { conversation, voice1, voice2 } = req.body; // Get conversation and voices

    if (!conversation) {
      return res.status(400).json({
        success: false,
        message: 'No conversation provided',
      });
    }

    // Split the conversation into turns (assuming "Host 1:" and "Host 2:")
    const turns = conversation
      .split(/(Host 1:|Host 2:)/)
      .filter(Boolean);
    let audioFiles = [];

    // Loop through turns, generating audio for each speaker
    for (let i = 0; i < turns.length; i += 2) {
      const speaker = turns[i].trim(); // "Host 1:" or "Host 2:"
      const text = turns[i + 1].trim(); // The actual text

      const voice = speaker === 'Host 1:' ? voice1 : voice2;
      const fileName = await createAudioFileFromText(text, voice);
      audioFiles.push(path.join(__dirname, 'public', fileName)); // Store the file path
    }

    // Concatenate the audio files (you'll need to implement this function)
    const concatenatedFile = await concatenateAudio(audioFiles);

    // Clean up the individual audio files
    audioFiles.forEach((file) => fs.unlinkSync(file));

    res.json({
      success: true,
      audio: `/public/${path.basename(concatenatedFile)}`,
    }); // Send the concatenated file path
  } catch (error) {
    console.error('Conversation generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating audio from conversation',
      error: error.message,
    });
  }
});

app.post(
  '/api/generate-from-audio',
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('No audio file uploaded.');
      }

      // Upload the audio file using the File API
      const uploadResult = await fileManager.uploadFile(
        req.file.path,
        {
          mimeType: req.file.mimetype,
          displayName: req.file.originalname,
        }
      );

      // Poll the file state until processing is complete
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === FileState.PROCESSING) {
        process.stdout.write('.'); // Indicate processing
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
        file = await fileManager.getFile(uploadResult.file.name);
      }

      // Check for processing failure
      if (file.state === FileState.FAILED) {
        throw new Error('Audio processing failed.');
      }

      console.log(
        `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
      );

      // --- Retry Mechanism with Exponential Backoff ---
      const maxRetries = 3;
      let retryCount = 0;
      let result = null;
      let errorMessage = 'Error generating podcast from audio'; // Default error message

      while (retryCount < maxRetries) {
        try {
          result = await model.generateContent([
            'Generate a transcript of the speech.',
            {
              fileData: {
                fileUri: file.uri,
                mimeType: file.mimeType,
              },
            },
          ]);
          break; // If successful, exit the loop
        } catch (error) {
          if (
            error.name === 'GoogleGenerativeAIFetchError' &&
            (error.message.includes('overloaded') ||
              error.message.includes('temporarily unavailable'))
          ) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            console.log(
              `Gemini API unavailable (status: ${error.status}, message: ${error.message}). Retry attempt ${retryCount}/${maxRetries} after ${delay}ms`
            );
            errorMessage = `Gemini API Error: The service is temporarily unavailable. Please try again later. Attempt ${retryCount}/${maxRetries}.`;
            await new Promise((resolve) =>
              setTimeout(resolve, delay)
            );
          } else {
            throw error; // Re-throw other errors
          }
        }
      }

      if (!result) {
        errorMessage = `Gemini API failed after ${maxRetries} retries. Please try again later.`;
        console.error(errorMessage);
        return res
          .status(500)
          .json({ success: false, message: errorMessage }); // Send error response
      }

      const transcript = result.response.text(); // Ensure this returns the transcript

      const { voice } = req.body;

      const fileName = await createAudioFileFromText(
        transcript,
        voice
      );

      // Send the path to the generated audio file and transcript in the response
      res.json({
        success: true,
        audio: `/public/${fileName}`,
        transcript,
      });
    } catch (error) {
      console.error('Error generating podcast from audio:', error);
      let errorMessage = 'Error generating podcast from audio';

      if (error.message.includes('Play.ai API error')) {
        errorMessage = error.message;
      }
      // Specific handling for Gemini API errors
      if (
        error.name === 'GoogleGenerativeAIFetchError' ||
        error.message.includes('overloaded') ||
        error.message.includes('temporarily unavailable')
      ) {
        errorMessage = `Gemini API Error: The service is temporarily unavailable. Please try again later.`;
        console.log(errorMessage);
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message, // Include original error for debugging
      });
    } finally {
      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting temporary file:', err);
        } else {
          console.log('Temporary file deleted successfully');
        }
      });
    }
  }
);

app.use('/public', express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ----- Helper Functions -----
async function concatenateAudio(audioFiles) {
  const ffmpeg = require('fluent-ffmpeg');
  const outputPath = path.join(__dirname, 'public', `${uuid()}.mp3`);

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    audioFiles.forEach((file) => {
      command.input(file);
    });

    command
      .on('end', () => {
        console.log('Audio concatenation completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error concatenating audio:', err);
        reject(err);
      })
      .mergeToFile(outputPath);
  });
}
