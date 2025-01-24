import React, { useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import FileUpload from './FileUpload';
import TranscriptInput from './TranscriptInput';

const App = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [audioSrc, setAudioSrc] = useState('');

  const handleFileChange = (file) => {
    setAudioFile(file);
  };

  const handleTranscriptChange = (text) => {
    setTranscript(text);
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
    try {
      const result = await generatePodcast(audioFile, transcript);
      console.log('Podcast generated:', result);
    } catch (error) {
      console.error('Error generating podcast:', error);
    }
  };

  return (
    <Container className='bg-dark text-light' fluid>
      <Navbar bg='dark' variant='dark' expand='lg'>
        <Navbar.Brand href='#home'>Podcast Generator</Navbar.Brand>
      </Navbar>
      <h1>Welcome to the Podcast Generator</h1>
      <FileUpload onSubmit={handleFileSubmit} />
      <TranscriptInput onTranscriptChange={handleTranscriptChange} />
      <Button
        onClick={handleGeneratePodcast}
        disabled={!audioFile || !transcript}
      >
        Generate Podcast
      </Button>
      <audio controls src={audioSrc} />
    </Container>
  );
};

export default App;
