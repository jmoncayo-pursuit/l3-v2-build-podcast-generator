// backend/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Use CORS middleware
app.use(cors());

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  },
});

const upload = multer({ storage });

// Endpoint to handle file uploads
app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send({ success: true, filePath: req.file.path });
});

app.get('/', (req, res) => {
  res.send('Hello, Podcast Generator!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
