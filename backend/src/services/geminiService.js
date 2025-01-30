const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  GoogleAIFileManager,
} = require('@google/generative-ai/server');
const config = require('../config');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
    });
    this.fileManager = new GoogleAIFileManager(config.gemini.apiKey);
  }

  async generateTranscript(uploadResult) {
    let file = await this.fileManager.getFile(uploadResult.file.name);

    while (file.state === 'PROCESSING') {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      file = await this.fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === 'FAILED') {
      throw new Error('Audio processing failed');
    }

    const result = await this.model.generateContent([
      { fileData: { fileUri: file.uri, mimeType: file.mimeType } },
      { text: 'Generate a transcript of the speech.' },
    ]);

    return result.response.text();
  }
}

module.exports = new GeminiService();
