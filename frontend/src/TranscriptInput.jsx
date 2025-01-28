import React from 'react';
import { Form } from 'react-bootstrap';

const TranscriptInput = ({ onTranscriptChange }) => {
  const handleChange = (event) => {
    onTranscriptChange(event.target.value);
  };

  return (
    <Form className='bg-dark text-light p-3'>
      <Form.Group controlId='transcriptInput' className='mb-3'>
        <Form.Label>Paste Transcript</Form.Label>
        <Form.Control
          as='textarea'
          rows={3}
          onChange={handleChange}
          className='bg-secondary text-light'
        />
      </Form.Group>
    </Form>
  );
};

export default TranscriptInput;