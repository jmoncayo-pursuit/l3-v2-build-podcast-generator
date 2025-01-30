const { ApiError } = require('./errorHandler');

const validateAudioUpload = (req, res, next) => {
  if (!req.file) {
    throw new ApiError('Audio file is required', 400);
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    throw new ApiError('File size exceeds 10MB limit', 400);
  }

  next();
};

const validateTranscript = (req, res, next) => {
  const { transcript } = req.body;

  if (!transcript || typeof transcript !== 'string') {
    throw new ApiError('Valid transcript text is required', 400);
  }

  if (transcript.length > 5000) {
    throw new ApiError(
      'Transcript exceeds maximum length of 5000 characters',
      400
    );
  }

  next();
};

module.exports = {
  validateAudioUpload,
  validateTranscript,
};
