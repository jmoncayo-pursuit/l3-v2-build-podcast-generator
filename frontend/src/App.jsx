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

  const handleFileChange = (file) => {
    setAudioFile(file);
    setTranscript(''); // Clear transcript if audio file is selected
    setAudioSrc(''); // Clear audio source
  };

  const handleTranscriptChange = (text) => {
    setTranscript(text);
    setAudioFile(null); // Clear audio file if transcript is entered
    setAudioSrc(''); // Clear audio source
  };

  const handleFileSubmit = async (file) => {
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log('File uploaded successfully:', data.filePath);
        setAudioSrc(data.filePath);
      } else {
        console.error('File upload failed:', data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleGeneratePodcast = async () => {
    setIsLoading(true);

    try {
      let response;
      if (transcript) {
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
        // Handle audio generation logic (to be implemented later)
        console.error('Audio generation not yet implemented.');
      }

      const data = await response.json();
      if (data.success) {
        console.log('Podcast generated successfully');

        // Set the audio source to the new URL
        setAudioSrc(
          `${import.meta.env.VITE_BACKEND_URL}${data.audio}`
        );
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
        <Navbar.Brand href='#home'>Podcast Generator</Navbar.Brand>
      </Navbar>
      <h1>Welcome to the Podcast Generator</h1>
      <FileUpload
        onSubmit={handleFileSubmit}
        onChange={handleFileChange}
      />
      <TranscriptInput onTranscriptChange={handleTranscriptChange} />
      <Button
        onClick={handleGeneratePodcast}
        disabled={isLoading || (!audioFile && !transcript)}
      >
        {isLoading ? 'Generating...' : 'Generate Podcast'}
      </Button>
      {audioSrc && <audio controls src={audioSrc} />}
    </Container>
  );
};

export default App;
