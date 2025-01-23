import React from 'react';
import { Form } from 'react-bootstrap';

const TranscriptInput = () => {
  return (
    <Form className='mb-3'>
      <Form.Group controlId='transcriptInput'>
        <Form.Label className='text-light'>
          Paste Transcript
        </Form.Label>
        <Form.Control
          as='textarea'
          rows={3}
          className='bg-dark text-light'
        />
      </Form.Group>
    </Form>
  );
};

export default TranscriptInput;
