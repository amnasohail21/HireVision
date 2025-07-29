import React, { useRef, useState, useEffect } from "react";

const WebcamRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [stream, setStream] = useState(null);
  const [transcript, setTranscript] = useState("");

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
        uploadVideoForTranscription(blob); // 👈 Upload right after stopping
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

  const uploadVideoForTranscription = async (blob) => {
    const formData = new FormData();
    const file = new File([blob], "interview.webm", { type: "video/webm" });
    formData.append("file", file);
  
    try {
      const res = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      setTranscript(data.transcript);
    } catch (err) {
      console.error("Upload error:", err);
      setTranscript("Failed to transcribe.");
    }
  };
  

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        padding: "2rem",
        fontFamily: "'Inter', sans-serif",
        color: "#f4f4f4",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          background: "rgba(30, 30, 30, 0.85)",
          backdropFilter: "blur(12px)",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", fontWeight: 600 }}>
          🎥 HireVision Interview Analysis
        </h2>
  
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            borderRadius: "12px",
            backgroundColor: "#000",
            transform: "scaleX(-1)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
  
        <div style={{ marginTop: "1.8rem" }}>
          {!recording ? (
            <button
              onClick={handleStartRecording}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#4ade80",
                color: "#111",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.2s ease-in-out",
              }}
            >
              ▶️ Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#f87171",
                color: "#111",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.2s ease-in-out",
              }}
            >
              ⏹ Stop Recording
            </button>
          )}
        </div>
  
        {videoBlob && (
          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#e0e0e0" }}>
              📼 Recording Preview
            </h4>
            <video
              src={URL.createObjectURL(videoBlob)}
              controls
              style={{
                width: "100%",
                borderRadius: "12px",
                transform: "scaleX(-1)",
                backgroundColor: "#000",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        )}
  
        {transcript && (
          <div style={{ marginTop: "2rem", textAlign: "left" }}>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#90ee90" }}>
              📝 Transcription Result
            </h4>
            <div
              style={{
                background: "#1c1c1c",
                padding: "1rem",
                borderRadius: "10px",
                color: "#ccc",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                whiteSpace: "pre-wrap",
              }}
            >
              {transcript}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  

};

export default WebcamRecorder;
