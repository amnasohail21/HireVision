import React, { useRef, useState, useEffect } from "react";

const WebcamRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [stream, setStream] = useState(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // Request webcam and mic on load
    const setupStream = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Webcam or microphone access was denied.");
      }
    };

    setupStream();
  }, []);

  const handleStartRecording = () => {
    if (!stream) {
      alert("Webcam/mic not ready yet.");
      return;
    }

    chunksRef.current = [];

    try {
      const mediaRecorder = new MediaRecorder(stream); // ✅ removed mimeType
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        chunksRef.current = [];
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("MediaRecorder failed to start:", err);
      alert("Recording is not supported in this browser.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>HireVision Interview Recorder</h2>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: 400,
          height: 300,
          borderRadius: 8,
          backgroundColor: "#000",
          transform: "scaleX(-1)",   // mirror live webcam
        }}
      /> 
  
      <div style={{ marginTop: 20 }}>
        {!recording ? (
          <button onClick={handleStartRecording}>Start Recording</button>
        ) : (
          <button onClick={handleStopRecording}>Stop Recording</button>
        )}
      </div>
  
      {videoBlob && (
        <div style={{ marginTop: 20 }}>
          <h4>Recording Preview:</h4>
          <video
            src={URL.createObjectURL(videoBlob)}
            controls
            style={{ 
              width: 400, 
              borderRadius: 8, 
              transform: "scaleX(-1)"  // mirror recorded playback
            }}
          />
        </div>
      )}
    </div>
  );
  
};

export default WebcamRecorder;
