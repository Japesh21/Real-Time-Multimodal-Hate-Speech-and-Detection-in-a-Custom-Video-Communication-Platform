
import os
os.environ["PATH"] += r";C:\Users\japes\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"

import whisper
from transformers import pipeline

# load once at import time
whisper_model = whisper.load_model("base")

classifier = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-offensive",
    top_k=None
)

def analyze_audio(audio_path: str) -> dict:
    result = whisper_model.transcribe(audio_path)
    transcript = result["text"].strip()

    results = classifier(transcript)[0]
    offensive_score = next(r["score"] for r in results if r["label"] == "offensive")
    top = max(results, key=lambda x: x["score"])

    return {
        "transcript": transcript,
        "prediction": top["label"],
        "confidence": round(offensive_score, 4),
        "is_harmful": offensive_score > 0.45
    }
