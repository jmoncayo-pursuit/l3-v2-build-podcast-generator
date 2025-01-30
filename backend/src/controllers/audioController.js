const { AudioService } = require('../services/audioService');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class AudioController {
  async processAudio(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError('Audio file is required', 400);
      }

      const transcript = await AudioService.processAudioFile(
        req.file
      );
      res.json({ transcript });
    } catch (error) {
      logger.error('Audio processing failed:', error);
      next(error);
    }
  }

  async generateFromAudio(req, res, next) {
    try {
      const audioUrl = await AudioService.generatePodcast(req.file);
      res.json({ success: true, audio: audioUrl });
    } catch (error) {
      logger.error('Podcast generation failed:', error);
      next(error);
    }
  }
}

module.exports = new AudioController();
