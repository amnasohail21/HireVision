from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import openai
from utils import extract_audio_from_video

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe_video(file: UploadFile = File(...)):
    video_path = f"temp/{file.filename}"
    audio_path = video_path.replace(".webm", ".mp3") 


    with open(video_path, "wb") as f:
        f.write(await file.read())

    extract_audio_from_video(video_path, audio_path)

    with open(audio_path, "rb") as audio_file:
        transcript = openai.Audio.transcribe("whisper-1", audio_file)

    return {"transcript": transcript["text"]}

