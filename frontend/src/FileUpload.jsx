import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

const FileUpload = ({ onSubmit }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (file) {
      console.log("isfile", file)
      onSubmit(file);
    } else {
      alert('Please select a file before submitting.');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId='formFile' className='mb-3'>
        <Form.Label>Upload Audio File</Form.Label>
        <Form.Control
          type='file'
          accept='audio/*'
          onChange={handleFileChange}
          className='bg-secondary text-light'
        />
      </Form.Group>
      <Button variant='primary' type='submit'>
        Submit
      </Button>
    </Form>
  );
};

export default FileUpload;
