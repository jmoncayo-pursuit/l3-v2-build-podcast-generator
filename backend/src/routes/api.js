const router = require('express').Router();
const {
  audioController,
  transcriptController,
} = require('../controllers');
const { upload } = require('../middleware/upload');
const {
  validateAudioUpload,
  validateTranscript,
} = require('../middleware/validator');

router.post(
  '/asr',
  upload.single('audio'),
  validateAudioUpload,
  audioController.processAudio
);

router.post(
  '/generate-from-transcript',
  validateTranscript,
  transcriptController.generateFromTranscript
);

router.post(
  '/generate-from-audio',
  upload.single('audio'),
  validateAudioUpload,
  audioController.generateFromAudio
);

module.exports = router;
