import React from 'react';
import { Container, Navbar } from 'react-bootstrap';
import FileUpload from './FileUpload';
import TranscriptInput from './TranscriptInput';

const App = () => {
  return (
    <Container fluid className='bg-dark text-light min-vh-100'>
      <Navbar bg='dark' variant='dark' expand='lg'>
        <Navbar.Brand href='#home'>Podcast Generator</Navbar.Brand>
      </Navbar>
      <div className='p-4'>
        <h1>Welcome to the Podcast Generator</h1>
        <FileUpload />
        <TranscriptInput />
      </div>
    </Container>
  );
};

export default App;
