import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const WebcamRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fillerWords, setFillerWords] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Load face-api models once
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Place models in /public/models
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

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
      analyzePostureAndEyeContact(url);
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
    setTranscript("");
    setFillerWords([]);

    const formData = new FormData();
    formData.append("file", blob, "interview.webm");

    try {
      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const text = data.transcript || "No transcript found";
      setTranscript(text);

      const fillerMatches = text.match(/\b(um|uh|like|you know|so)\b/gi) || [];
      setFillerWords(fillerMatches);
    } catch (err) {
      console.error("Upload failed:", err);
      setTranscript("Failed to transcribe.");
    } finally {
      setLoading(false);
    }
  };

  const analyzePostureAndEyeContact = async (videoUrl) => {
    const tempVideo = document.createElement("video");
    tempVideo.src = videoUrl;
    tempVideo.crossOrigin = "anonymous";
    tempVideo.muted = true;
    await tempVideo.play();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    let faceCount = 0;
    let lookingAtCamera = 0;

    const analyzeFrame = async () => {
      canvas.width = tempVideo.videoWidth;
      canvas.height = tempVideo.videoHeight;
      context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

      const detections = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections) {
        faceCount++;
        const landmarks = detections.landmarks;
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const noseX = nose[3].x;
        const leftX = leftEye[0].x;
        const rightX = rightEye[3].x;

        const centerFace = (leftX + rightX) / 2;
        const eyeDiff = Math.abs(noseX - centerFace);

        if (eyeDiff < 15) {
          lookingAtCamera++;
        }
      }
    };

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        if (tempVideo.ended || tempVideo.currentTime >= tempVideo.duration) {
          clearInterval(interval);
          const posture = faceCount > 0 ? "Visible" : "No face detected";
          const eyeContact = lookingAtCamera / faceCount > 0.6 ? "Good" : "Poor";
          setAnalysis({ posture, eyeContact });
          resolve();
        } else {
          await analyzeFrame();
        }
      }, 500);
    });
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

      {fillerWords.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4>Filler Words Detected:</h4>
          <ul>
            {fillerWords.map((word, i) => (
              <li key={i}>{word}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis && (
        <div style={{ marginTop: 12 }}>
          <h4>Posture & Eye Contact:</h4>
          <p>Posture: {analysis.posture}</p>
          <p>Eye Contact: {analysis.eyeContact}</p>
        </div>
      )}
    </div>
  );
};

export default WebcamRecorder;
