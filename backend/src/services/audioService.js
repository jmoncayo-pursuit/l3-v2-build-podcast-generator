const { GeminiService } = require('./geminiService');
const { ElevenLabsService } = require('./elevenLabsService');
const { FileManager } = require('../utils/fileManager');
const config = require('../config');

class AudioService {
  async processAudioFile(file) {
    const uploadResult = await FileManager.uploadToGemini(file);
    const transcript = await GeminiService.generateTranscript(
      uploadResult
    );
    return transcript;
  }

  async generatePodcast(file) {
    const transcript = await this.processAudioFile(file);
    const audioFile = await ElevenLabsService.generateAudio(
      transcript
    );
    const publicUrl = await FileManager.saveToPublic(audioFile);
    return publicUrl;
  }
}

module.exports = new AudioService();
