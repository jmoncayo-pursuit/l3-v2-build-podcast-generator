import React from 'react';
import { Form } from 'react-bootstrap';

const FileUpload = ({ onFileChange }) => {
  const handleChange = (event) => {
    onFileChange(event.target.files[0]);
  };

  return (
    <Form className='bg-dark text-light p-3'>
      <Form.Group controlId='formFile' className='mb-3'>
        <Form.Label>Upload Audio File</Form.Label>
        <Form.Control
          type='file'
          accept='audio/*'
          onChange={handleChange}
          className='bg-secondary text-light'
        />
      </Form.Group>
    </Form>
  );
};

export default FileUpload;
