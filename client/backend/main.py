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

