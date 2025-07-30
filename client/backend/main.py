from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from utils import extract_audio_from_video
import whisper
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model once at startup
model = whisper.load_model("base")  # Or "small", "medium", "large"

@app.post("/transcribe")
async def transcribe_video(file: UploadFile = File(...)):
    video_path = f"temp/{file.filename}"
    audio_path = video_path.replace(".webm", ".mp3")

    with open(video_path, "wb") as f:
        f.write(await file.read())

    extract_audio_from_video(video_path, audio_path)

    # Transcribe with Whisper locally
    result = model.transcribe(audio_path)

    return {"transcript": result["text"]}
