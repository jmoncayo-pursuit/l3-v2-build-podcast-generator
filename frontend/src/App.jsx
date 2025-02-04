// frontend/src/App.jsx
import React, { useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import FileUpload from './FileUpload';
import TranscriptInput from './TranscriptInput';

const App = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [audioSrc, setAudioSrc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTranscript, setGeneratedTranscript] = useState('');

  const handleFileChange = (file) => {
    setAudioFile(file);
    setTranscript(''); // Clear transcript if audio file is selected
    setAudioSrc(''); // Clear audio source
    setGeneratedTranscript('');
  };

  const handleTranscriptChange = (text) => {
    setTranscript(text);
    setAudioFile(null); // Clear audio file if transcript is entered
    setAudioSrc(''); // Clear audio source
    setGeneratedTranscript('');
  };

  const handleGeneratePodcast = async (file = null) => {
    setIsLoading(true);

    try {
      let response;
      if (file) {
        // Handle audio generation
        const formData = new FormData();
        formData.append('audio', file);

        response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/generate-from-audio`,
          {
            method: 'POST',
            body: formData, // Send audio file as FormData
          }
        );
      } else if (transcript) {
        response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/generate-from-transcript`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transcript }),
          }
        );
      } else {
        console.error('No audio file or transcript provided.');
        return;
      }

      const data = await response.json();
      if (data.success) {
        console.log('Podcast generated successfully');

        // Set the audio source to the new URL
        setAudioSrc(
          `${import.meta.env.VITE_BACKEND_URL}${data.audio}`
        );

        // Set the generated transcript to the current transcript
        setGeneratedTranscript(transcript);
      } else {
        console.error('Podcast generation failed:', data.message);
      }
    } catch (error) {
      console.error('Error generating podcast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className='bg-dark text-light' fluid>
      <Navbar bg='dark' variant='dark' expand='lg'>
        <Navbar.Brand href='#home'>
          <h1>Welcome to the Podcast Generator</h1>
        </Navbar.Brand>
      </Navbar>

      <FileUpload
        onSubmit={handleGeneratePodcast}
        onChange={handleFileChange}
      />
      <TranscriptInput onTranscriptChange={handleTranscriptChange} />
      <Button
        onClick={() => handleGeneratePodcast(audioFile)}
        disabled={isLoading || (!audioFile && !transcript)}
      >
        {isLoading ? 'Generating...' : 'Generate Podcast'}
      </Button>
      {audioSrc && <audio controls src={audioSrc} />}
      {/* Display the generated transcript */}
      {generatedTranscript && (
        <div className='mt-3'>
          <h4>Generated Transcript:</h4>
          <p>{generatedTranscript}</p>
        </div>
      )}
    </Container>
  );
};

export default App;
