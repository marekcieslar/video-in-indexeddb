import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import useIndexedDB from './useIndexedDB';

interface DataRecordType {
  id: number;
  name: string;
  data: Blob;
}

function App() {
  const webcamRef = useRef<Webcam>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [items, setItems] = useState<DataRecordType[]>([]);

  const db = useIndexedDB('test-db', 'store-name');

  useEffect(() => {
    db.getAllFromDB((data: DataRecordType[]) => {
      setItems(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.getAllFromDB]);

  const handleStartRecording = () => {
    setIsRecording(true);
    if (webcamRef.current!.stream === null) {
      return;
    }

    const _mediaRecorder = new MediaRecorder(webcamRef.current!.stream);
    setMediaRecorder(_mediaRecorder);
    _mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        const chunks = [e.data];
        console.log('chunks', chunks);

        db.addToDB({
          name: Date.now().toString(),
          data: new Blob(chunks, { type: 'video/webm' }),
        });
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

  const downloadVideo = ({ id, name, data }: DataRecordType) => {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = `recorded_${id}_${name}.webm`;
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
            <span>id: {item.id} </span>
            <span>name: {item.name} </span>
            <button onClick={() => downloadVideo(item)}>download</button>
            <button onClick={() => db.removeFromDb(item.id)}>delete</button>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
