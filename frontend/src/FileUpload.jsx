import React from 'react';
import { Form } from 'react-bootstrap';

const FileUpload = () => {
  return (
    <Form className='mb-3'>
      <Form.Group controlId='formFile'>
        <Form.Label className='text-light'>
          Upload Audio File
        </Form.Label>
        <Form.Control
          type='file'
          accept='audio/*'
          className='bg-dark text-light'
        />
      </Form.Group>
    </Form>
  );
};

export default FileUpload;
