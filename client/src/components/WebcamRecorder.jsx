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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "1rem", color: "#333" }}>
          🎥 HireVision Interview Recorder
        </h2>
  
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "10px",
            backgroundColor: "#000",
            transform: "scaleX(-1)",
          }}
        />
  
        <div style={{ marginTop: "1.5rem" }}>
          {!recording ? (
            <button
              onClick={handleStartRecording}
              style={{
                padding: "0.7rem 1.5rem",
                backgroundColor: "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              style={{
                padding: "0.7rem 1.5rem",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              Stop Recording
            </button>
          )}
        </div>
  
        {videoBlob && (
          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ marginBottom: "0.5rem", color: "#555" }}>
              📼 Recording Preview
            </h4>
            <video
              src={URL.createObjectURL(videoBlob)}
              controls
              style={{
                width: "100%",
                borderRadius: "10px",
                transform: "scaleX(-1)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
  
};

export default WebcamRecorder;
