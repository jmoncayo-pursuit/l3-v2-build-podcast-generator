const fetch = require('node-fetch');
const config = require('../config');

class ElevenLabsService {
  constructor() {
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.headers = {
      'xi-api-key': config.elevenLabs.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async generateAudio(text) {
    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${config.elevenLabs.voiceId}`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          text,
          model_id: config.elevenLabs.modelId,
          voice_settings: config.elevenLabs.settings,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    return response.arrayBuffer();
  }
}

module.exports = new ElevenLabsService();
