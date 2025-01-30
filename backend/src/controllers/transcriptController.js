const { AudioService } = require('../services/audioService');
const logger = require('../utils/logger');

class TranscriptController {
  async generateFromTranscript(req, res, next) {
    try {
      const { transcript } = req.body;
      const audioUrl = await AudioService.generateAudioFromTranscript(
        transcript
      );
      res.json({ success: true, audio: audioUrl });
    } catch (error) {
      logger.error('Transcript processing failed:', error);
      next(error);
    }
  }
}

module.exports = new TranscriptController();
