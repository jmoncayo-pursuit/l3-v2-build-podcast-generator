import React from 'react';
import { Container, Navbar } from 'react-bootstrap';

const App = () => {
  return (
    <Container>
      <Navbar bg='light' expand='lg'>
        <Navbar.Brand href='#home'>Podcast Generator</Navbar.Brand>
      </Navbar>
      <h1>Welcome to the Podcast Generator</h1>
      {/* Add more components here */}
    </Container>
  );
};

export default App;
