const path = require('path');

module.exports = {
  port: process.env.PORT || 5001,
  paths: {
    public: path.join(__dirname, '../../public'),
    uploads: path.join(__dirname, '../../uploads'),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-pro-latest',
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_XI_API_KEY,
    modelId: process.env.ELEVENLABS_MODEL_ID,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    settings: {
      stability: process.env.ELEVENLABS_VOICE_STABILITY,
      similarityBoost: process.env.ELEVENLABS_VOICE_SIMILARITY_BOOST,
      style: process.env.ELEVENLABS_VOICE_STYLE,
      useSpeakerBoost:
        process.env.ELEVENLABS_VOICE_USE_SPEAKER_BOOST === 'true',
      optimizeStreamingLatency: parseInt(
        process.env.ELEVENLABS_OPTIMIZE_STREAMING_LATENCY
      ),
      outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT,
    },
  },
};
