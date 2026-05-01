import os
import time
from fastapi import APIRouter, Request
from pydantic import BaseModel
from services.text_analysis import analyze_text
from services.audio_analysis import analyze_audio
from services.video_analysis import analyze_frame
from services.image_analysis import analyze_profile_image
#from services.video_analysis import analyze_video


import tempfile
import httpx
import wave
import numpy as np

router = APIRouter()
NODE_URL = "https://meeting-backend-v3xj.onrender.com"
# audio buffers per user
audio_buffers = {}
def cleanup_old_buffers():

    now = time.time()

    dead = [

        uid

        for uid, buf
        in audio_buffers.items()

        if now - buf["last_time"] > 60
    ]

    for uid in dead:

        del audio_buffers[uid]

        print(
            f"[BUFFER CLEANUP] {uid}"
        )

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

    max_val = np.max(np.abs(audio_np))

    if max_val > 0.0001:

        audio_np = (
        audio_np / max_val
    ) * 0.95

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
async def moderate_text(req: TextRequest):

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
     # ===== SAVE TEXT EVENT =====

    try:

        async with httpx.AsyncClient() as client:
                
                await client.post(

                    f"{NODE_URL}/api/moderation/save-transcript",

                    json={

                        "meetingCode":
                            req.meetingCode,

                        "uid":
                                "text-user",

                            "name":
                                req.user,

                    

                        "transcript":
                            req.text,

                        "flagged":
                            result["is_harmful"],

                        "aiLabel":
                            prediction,

                        "aiScore":
                            result["confidence"],

                    },

                    timeout=10.0,
                )

    except Exception as e:

        print(
            "[TEXT SAVE ERROR]",
            e
        )

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


# ===== AUDIO MODERATION =====
@router.post("/moderation/audio-live")
async def moderate_audio_live(request: Request):

    try:

        meeting_code = request.headers.get(
            "X-Meeting-Code",
            "0000"
        )

        user_uid = request.headers.get(
            "X-User-Uid",
            "unknown"
        )

        user_name = request.headers.get(
            "X-User-Name",
            "unknown"
        )

        sample_rate = int(
        request.headers.get("X-Sample-Rate", "48000")
        )

        raw_bytes = await request.body()

        cleanup_old_buffers()

        # reject tiny chunks
        if len(raw_bytes) < 1000:

            return {
                "is_harmful": False,
                "transcript": "",
                "message": "too short"
            }

        # ===== create user buffer =====
        now = time.time()

        if user_uid not in audio_buffers:

            audio_buffers[user_uid] = {
                "chunks": [],
                "last_time": now
            }

        buf = audio_buffers[user_uid]

        # store chunk
        buf["chunks"].append(raw_bytes)

        buf["last_time"] = now

        # ===== calculate total size =====
        total_bytes = sum(
            len(chunk)
            for chunk in buf["chunks"]
        )

        # wait until enough audio collected
        if total_bytes < 600000:

            return {
                "is_harmful": False,
                "transcript": "",
                "message": "buffering..."
            }

        # ===== merge chunks =====
        merged = b"".join(buf["chunks"])

        # clear buffer
        buf["chunks"] = []

        # make divisible by 4
        merged = merged[
            :len(merged)
            - (len(merged) % 4)
        ]

        # ===== convert to wav =====
        tmp_path = pcm_float32_to_wav(
            merged, sample_rate=sample_rate
        )

        # ===== analyze =====
        result = analyze_audio(tmp_path)

        os.unlink(tmp_path)

        transcript = (
            result["transcript"]
            .strip()
        )

        if (
            not transcript
            or len(transcript) < 3
        ):

            return {
                "is_harmful": False,
                "transcript": "",
                "message": "no speech"
            }

        print(
            f"[AUDIO] "
            f"{user_name} "
            f"→ {transcript}"
        )

        # ===== SAVE AUDIO EVENT =====

        try:

            async with httpx.AsyncClient() as client:

                await client.post(

                    f"{NODE_URL}/api/moderation/save-transcript",

                    json={

                        "meetingCode":
                            meeting_code,
                    
                        "uid":
                            user_uid,

                        "name":
                            user_name,
                    

                        "transcript":
                            transcript,

                        "flagged":
                            result["is_harmful"],

                        "aiLabel":
                            result["prediction"],

                        "aiScore":
                            result["confidence"],

                    },

                    timeout=10.0,
                )

        except Exception as save_err:

            print(
                "[AUDIO SAVE ERROR]",
                save_err
            )


        return {
            "type": "audio",
            "user": user_name,
            "meetingCode": meeting_code,
            "transcript": transcript,
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "is_harmful": result["is_harmful"],
            "active_labels": result.get("active_labels", []),
        }

    except Exception as e:

        import traceback

        traceback.print_exc()

        return {

            "is_harmful": False,

            "transcript": "",

            "message": str(e)
        }

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

        # ===== SAVE VIDEO EVENT =====

        if result["is_harmful"]:

            try:

                async with httpx.AsyncClient() as client:

                    await client.post(

                        f"{NODE_URL}/api/moderation/save-video-event",

                        json={

                            "meetingCode":
                                meeting_code,

                                "uid":
                                    user_uid,

                                "name":
                                    user_name,

                            

                            "type":
                                    "nsfw"
                                ,

                            "label":
                                result.get(
                                    "label",
                                    ""
                                ),

                            "confidence":
                                result.get(
                                    "confidence",
                                    0
                                ),

                            "allDetections":
                                result.get(
                                    "all_detections",
                                    []
                                ),

                            "reasons":
                                result.get(
                                    "reasons",
                                    []
                                ),

                            "ocrText":
                                result.get(
                                    "ocr_text",
                                    ""
                                ),

                            "ocrHarmful":
                                result.get(
                                    "ocr_harmful",
                                    False
                                ),

                            "middleFinger":
                                result.get(
                                    "middle_finger",
                                    False
                                ),

                            "nsfw":
                                result.get(
                                    "nsfw",
                                    False
                                ),

                            "snapshotCloudURL":
                                result.get(
                                    "snapshot_path",
                                    ""
                                ),

                        },

                        timeout=10.0,
                    )

            except Exception as save_err:

                print(
                    "[VIDEO SAVE ERROR]",
                    save_err
                )


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
