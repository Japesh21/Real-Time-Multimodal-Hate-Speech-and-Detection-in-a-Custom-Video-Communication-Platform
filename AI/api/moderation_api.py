import os

from fastapi import APIRouter, Request
from pydantic import BaseModel
from services.text_analysis import analyze_text
#from services.audio_analysis import analyze_audio
# from services.image_analysis import analyze_frame
# from services.video_analysis import analyze_video


import tempfile
import httpx
import wave
import numpy as np

router = APIRouter()
NODE_URL = "http://localhost:5000"


class TextRequest(BaseModel):
    text: str
    user: str = "unknown"
    meetingCode: str = "0000"


class ProfileImageRequest(BaseModel):
    image_url: str
    meeting_id: str
    user_uid: str


# ===== HELPER — convert raw Float32 PCM → WAV =====
def pcm_float32_to_wav(raw_bytes: bytes, sample_rate: int = 44100) -> str:

    audio_np = np.frombuffer(raw_bytes, dtype=np.float32)

    audio_np = np.nan_to_num(audio_np)

    audio_np = np.clip(audio_np, -1.0, 1.0)

    audio_int16 = (audio_np * 32767).astype(np.int16)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")

    tmp_path = tmp.name

    tmp.close()

    with wave.open(tmp_path, 'wb') as wav_file:

        wav_file.setnchannels(1)

        wav_file.setsampwidth(2)

        wav_file.setframerate(sample_rate)

        wav_file.writeframes(audio_int16.tobytes())

    return tmp_path


# ===== TEXT MODERATION =====
@router.post("/moderate/text")
def moderate_text(req: TextRequest):

    result = analyze_text(req.text)

    PRIORITY_LABELS = [
        "threat",
        "sexual_explicit",
        "identity_attack",
        "obscene",
        "insult",
        "severe_toxic",
        "toxic",
    ]

    active = result.get("active_labels", [])

    prediction = result["prediction"]

    for label in PRIORITY_LABELS:

        if label in active:

            prediction = label

            break

    return {
        "user": req.user,
        "meetingCode": req.meetingCode,
        "type": "text",
        "input": req.text,
        "prediction": prediction,
        "confidence": result["confidence"],
        "is_harmful": result["is_harmful"],
        "active_labels": active,
        "label_scores": result.get("label_scores", {}),
        "model_scores": result.get("model_scores", {}),
        "votes": result.get("votes", 0),
    }

"""
# ===== PROFILE IMAGE MODERATION =====
@router.post("/moderation/profile-image")
async def moderate_profile_image(req: ProfileImageRequest):

    try:

        async with httpx.AsyncClient() as client:
            response = await client.get(req.image_url)

        if response.status_code != 200:

            return {
                "safe": True,
                "error": "image_download_failed"
            }

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:

            tmp.write(response.content)

            tmp_path = tmp.name

        result = analyze_profile_image(
            image_url=tmp_path,
            meeting_id=req.meeting_id,
            user_uid=req.user_uid
        )

        os.unlink(tmp_path)

        return result

    except Exception as e:

        print("[PROFILE API ERROR]", e)

        return {
            "safe": True,
            "error": str(e)
        }
"""
"""
# ===== AUDIO MODERATION =====
@router.post("/moderation/audio-live")
async def moderate_audio_live(request: Request):

    try:

        meeting_code = request.headers.get("X-Meeting-Code", "0000")

        user_uid = request.headers.get("X-User-Uid", "unknown")

        user_name = request.headers.get("X-User-Name", "unknown")

        raw_bytes = await request.body()

        if len(raw_bytes) < 1000:

            return {
                "is_harmful": False,
                "transcript": "",
                "message": "audio too short"
            }

        tmp_path = pcm_float32_to_wav(raw_bytes)

        result = analyze_audio(tmp_path)

        os.unlink(tmp_path)

        transcript = result["transcript"].strip()

        if not transcript or len(transcript) < 3:

            return {
                "is_harmful": False,
                "transcript": "",
                "message": "no speech"
            }

        print(f"[AUDIO] {user_name} → {transcript}")

        return {
            "type": "audio",
            "user": user_name,
            "meetingCode": meeting_code,
            "transcript": transcript,
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "is_harmful": result["is_harmful"],
        }

    except Exception as e:

        print("Audio error:", e)

        return {
            "is_harmful": False,
            "transcript": "",
            "message": str(e)
        }
"""

"""
# ===== VIDEO / IMAGE MODERATION =====
@router.post("/moderation/image")
async def moderate_image(request: Request):

    try:

        meeting_code = request.headers.get("X-Meeting-Code", "0000")

        user_uid = request.headers.get("X-User-Uid", "unknown")

        user_name = request.headers.get("X-User-Name", "unknown")

        form = await request.form()

        file = form.get("file")

        image_bytes = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:

            tmp.write(image_bytes)

            tmp_path = tmp.name

        result = analyze_frame(
            image_path=tmp_path,
            meeting_code=meeting_code,
            user_name=user_name,
            user_uid=user_uid,
        )

        os.unlink(tmp_path)

        print(f"[VIDEO] {user_name}: harmful={result['is_harmful']}")

        return {
            "type": "video",
            "user": user_name,
            "meetingCode": meeting_code,
            "is_harmful": result["is_harmful"],
            "label": result.get("label", ""),
            "confidence": result.get("confidence", 0),
        }

    except Exception as e:

        print("Video error:", e)

        return {
            "is_harmful": False,
            "label": "",
            "message": str(e)
        }
"""