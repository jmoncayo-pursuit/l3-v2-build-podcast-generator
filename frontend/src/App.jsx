import React, { useState, useRef } from 'react';
import {
  Upload,
  Mic,
  FileText,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';
import { Container, Navbar, Button, Form } from 'react-bootstrap'; // Keeping Bootstrap for consistent styling

function App() {
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedTranscript, setGeneratedTranscript] = useState(''); //Renamed to match FE
  const [error, setError] = useState('');
  const [audioSrc, setAudioSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef(null);

  const handleTranscriptSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate script');
      }

      setGeneratedTranscript(transcript); //Now showing the transcript
      setAudioSrc(`${import.meta.env.VITE_BACKEND_URL}${data.audio}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAudioSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/generate-from-audio`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate script');
      }

      setGeneratedTranscript(data.transcript);
      setAudioSrc(`${import.meta.env.VITE_BACKEND_URL}${data.audio}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const progressValue = duration
        ? (currentTime / duration) * 100
        : 0;
      setProgress(progressValue);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      // Ensure duration is a valid number before using it
      const duration = audioRef.current.duration;
      setProgress(0); // Reset progress when new audio loads
    }
  };

  return (
    <div className='min-vh-100 bg-dark text-white'>
      <Container className='py-5'>
        <div className='text-center mb-4'>
          <h1 className='display-4'>AI Podcast Generator</h1>
          <p className='text-muted'>
            Transform your content into engaging podcast conversations
          </p>
        </div>

        <div className='row'>
          {/* Transcript Input */}
          <div className='col-md-6 mb-4'>
            <div className='bg-secondary p-4 rounded shadow'>
              <h2 className='h5 mb-3 d-flex align-items-center'>
                <FileText className='me-2' />
                Text to Podcast
              </h2>
              <Form onSubmit={handleTranscriptSubmit}>
                <Form.Control
                  as='textarea'
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className='mb-3 bg-dark text-white'
                  placeholder='Enter your text content here...'
                  rows='5'
                />
                <Button
                  type='submit'
                  disabled={loading || !transcript}
                  className='w-100'
                  variant='primary'
                >
                  {loading ? (
                    <>
                      <Loader2 className='spin' /> Generating
                    </>
                  ) : (
                    'Generate from Text'
                  )}
                </Button>
              </Form>
            </div>
          </div>

          {/* Audio Input */}
          <div className='col-md-6 mb-4'>
            <div className='bg-secondary p-4 rounded shadow'>
              <h2 className='h5 mb-3 d-flex align-items-center'>
                <Mic className='me-2' />
                Audio to Podcast
              </h2>
              <Form onSubmit={handleAudioSubmit}>
                <Form.Group className='mb-3'>
                  <Form.Label
                    htmlFor='audio-upload'
                    className='w-100'
                  >
                    <div className='border border-dashed border-light rounded p-4 text-center'>
                      <Upload className='mb-2' />
                      <span className='text-muted'>
                        {audioFile
                          ? audioFile.name
                          : 'Click to upload audio file'}
                      </span>
                      <Form.Control
                        type='file'
                        accept='audio/*'
                        onChange={(e) =>
                          setAudioFile(e.target.files?.[0] || null)
                        }
                        className='d-none'
                        id='audio-upload'
                      />
                    </div>
                  </Form.Label>
                </Form.Group>
                <Button
                  type='submit'
                  disabled={loading || !audioFile}
                  className='w-100 mt-3'
                  variant='primary'
                >
                  {loading ? (
                    <>
                      <Loader2 className='spin' /> Generating
                    </>
                  ) : (
                    'Generate from Audio'
                  )}
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='alert alert-danger mt-4'>{error}</div>
        )}

        {/* Generated Script */}
        {generatedTranscript && (
          <div className='bg-secondary p-4 rounded shadow mt-4'>
            <h2 className='h5'>Generated Podcast Script</h2>
            <pre className='bg-dark text-white p-3 rounded'>
              {generatedTranscript}
            </pre>
          </div>
        )}

        {/* Audio Player */}
        {audioSrc && (
          <div className='mt-4'>
            <h2 className='h5'>Audio Player</h2>
            <div className='d-flex align-items-center justify-content-between mb-2'>
              <Button
                variant='outline-light'
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause /> : <Play />}
              </Button>

              <input
                type='range'
                className='form-range w-75'
                min='0'
                max='100'
                value={progress}
                onChange={() => {}} // Dummy onChange to remove warning
              />

              <Form.Control
                type='number'
                min='0.5'
                max='2.0'
                step='0.1'
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className='w-auto'
                style={{ width: '60px' }}
              />
            </div>
            <audio
              ref={audioRef}
              src={audioSrc}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}
      </Container>
    </div>
  );
}

export default App;
