import { useRef, useState } from "react";

const WebcamRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setMediaBlobUrl(url);
      uploadRecording(blob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
  };

  const uploadRecording = async (blob) => {
    setLoading(true);
    setTranscript(""); // Reset previous transcript
    const formData = new FormData();
    formData.append("file", blob, "interview.webm");

    try {
      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTranscript(data.transcript || "No transcript found");
      console.log("Transcript:", data.transcript);
    } catch (err) {
      console.error("Upload failed:", err);
      setTranscript("Failed to transcribe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: 480, borderRadius: 12 }} />
      <div style={{ marginTop: 12 }}>
        {recording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )}
      </div>

      {mediaBlobUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Recorded Preview:</h3>
          <video src={mediaBlobUrl} controls style={{ width: 480, borderRadius: 12 }} />
        </div>
      )}

      {loading && <p style={{ marginTop: 16 }}>Transcribing... ⏳</p>}

      {transcript && (
        <div style={{ marginTop: 16 }}>
          <h3>Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default WebcamRecorder;
