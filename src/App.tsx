import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import useIndexedDB from './useIndexedDB';

function App() {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [items, setItems] = useState([]);

  const db = useIndexedDB('test-db', 'store-name');

  useEffect(() => {
    db.getAllFromDB((data) => {
      setItems(data);
    });
  }, [db.getAllFromDB]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedChunks([]);
    if (webcamRef.current!.stream === null) {
      return;
    }

    const _mediaRecorder = new MediaRecorder(webcamRef.current!.stream);
    setMediaRecorder(_mediaRecorder);
    _mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        const chunks = [e.data];
        setRecordedChunks(chunks);
        console.log('chunks', chunks);

        db.addToDB({ name: Date.now().toString(), data: chunks });
      }
    };
    _mediaRecorder.start();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    mediaRecorder && mediaRecorder.stop();
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
    mediaRecorder && mediaRecorder.pause();
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
    mediaRecorder && mediaRecorder.resume();
  };

  const downloadVideo = ({ name, data }: { name: string; data: Blob[] }) => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = 'recorded.webm';
    a.click();
    window.URL.revokeObjectURL(url);
    a.parentElement?.removeChild(a);
  };

  return (
    <>
      <h1>record video</h1>
      <Webcam
        audio={false}
        ref={webcamRef}
        width={320}
        height={280}
        videoConstraints={{ frameRate: 25 }}
        style={{
          transform: 'scaleX(-1)',
        }}
      />
      <br />

      {isRecording ? (
        <>
          <button onClick={handleStopRecording}>stop recording</button>
          {isPaused ? (
            <button onClick={handleResumeRecording}>resume recording</button>
          ) : (
            <button onClick={handlePauseRecording}>pause recording</button>
          )}
        </>
      ) : (
        <button onClick={handleStartRecording}>start recording</button>
      )}

      <br />

      <ul>
        {items.map((item) => (
          <li key={item.name + item.id}>
            <span>{item.id}</span>
            <button onClick={() => downloadVideo(item)}>
              download {item.name}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
