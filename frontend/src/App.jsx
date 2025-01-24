import React, { useState } from 'react';
import { Container, Navbar, Button } from 'react-bootstrap';
import FileUpload from './FileUpload';
import TranscriptInput from './TranscriptInput';

const App = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');

  const handleFileChange = (file) => {
    setAudioFile(file);
  };

  const handleTranscriptChange = (text) => {
    setTranscript(text);
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
    <Container className="bg-dark text-light" fluid>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand href="#home">Podcast Generator</Navbar.Brand>
      </Navbar>
      <h1>Welcome to the Podcast Generator</h1>
      <FileUpload onFileChange={handleFileChange} />
      <TranscriptInput onTranscriptChange={handleTranscriptChange} />
      <Button
        onClick={handleGeneratePodcast}
        disabled={!audioFile || !transcript}
      >
        Generate Podcast
      </Button>
    </Container>
  );
};

export default App;
