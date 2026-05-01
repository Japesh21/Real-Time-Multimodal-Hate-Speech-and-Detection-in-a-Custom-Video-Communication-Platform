# C:\Users\japes\OneDrive\Desktop\call\AI\services\video_analysis.py

import os
import sys
import cv2
import time
import numpy as np
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from ultralytics import YOLO
from nudenet import NudeDetector
from transformers import pipeline
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import easyocr
from services.text_analysis import analyze_text
from services.cloudinary_service import upload_image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HAND_MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "hand_landmarker.task")

# ✅ Load all models once at startup
model = YOLO("yolov8n.pt")
nude_detector = NudeDetector()
violence_classifier = pipeline("image-classification", model="Falconsai/nsfw_image_detection")
ocr_reader = easyocr.Reader(["en"], verbose=False)  

base_options = python.BaseOptions(model_asset_path=HAND_MODEL_PATH)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.5
)
hand_landmarker = vision.HandLandmarker.create_from_options(options)

# ✅ Dangerous labels
DANGEROUS_LABELS = ["knife", "scissors", "baseball bat", "fork"]

# ✅ Nudity labels to flag
HARMFUL_NUDE_LABELS = [
    "FEMALE_GENITALIA_EXPOSED", "MALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED", "BUTTOCKS_EXPOSED", "ANUS_EXPOSED",
    "FEMALE_GENITALIA_COVERED", "MALE_BREAST_EXPOSED", "BELLY_EXPOSED",
]

# ✅ REDUCED confidence thresholds
YOLO_CONFIDENCE       = 0.35   # was 0.4
NUDE_CONFIDENCE       = 0.35   # was 0.4
NSFW_CONFIDENCE       = 0.80   # was 0.7
MIDDLE_CONFIRM_FRAMES = 2      # was 3 — flags faster

# ✅ Cooldown — save same detection max once per 30 seconds per user
COOLDOWN_SECONDS = 30
_cooldown_tracker = {}

# ✅ Where flagged frames are saved on disk
SAVE_DIR = "./temp_ai_frames"

# ===== CONSECUTIVE FRAME COUNTER =====
frame_counter = {}
ocr_frame_counter = {}

def should_flag(key: str) -> bool:
    frame_counter[key] = frame_counter.get(key, 0) + 1
    if frame_counter[key] >= MIDDLE_CONFIRM_FRAMES:
        frame_counter[key] = 0
        return True
    return False

# ===== MIDDLE FINGER DETECTION =====
def detect_middle_finger(image_path: str) -> dict:
    try:
        image = mp.Image.create_from_file(image_path)
        results = hand_landmarker.detect(image)

        if not results.hand_landmarks:
            frame_counter["middle_finger"] = 0
            return {"middle_finger": False, "hands_detected": 0}

        for hand in results.hand_landmarks:
            lm = hand
            middle_tip = lm[12].y
            middle_pip = lm[10].y

            index_tip  = lm[8].y
            index_pip  = lm[6].y

            ring_tip   = lm[16].y
            ring_pip   = lm[14].y

            pinky_tip  = lm[20].y
            pinky_pip  = lm[18].y


            middle_up  = (
             middle_tip < middle_pip
            )

            index_down = (
            index_tip > index_pip
            )

            ring_down = (
            ring_tip > ring_pip
            )

            pinky_down = (
            pinky_tip > pinky_pip
            )

            if middle_up and index_down and ring_down and pinky_down:
                confirmed = should_flag("middle_finger")
                return {
                    "middle_finger": confirmed,
                    "hands_detected": len(results.hand_landmarks),
                    "confidence": 0.95
                }

        frame_counter["middle_finger"] = 0
        return {"middle_finger": False, "hands_detected": len(results.hand_landmarks)}

    except Exception as e:
        print(f"[GESTURE ERROR] {e}")
        return {"middle_finger": False, "hands_detected": 0}

# ===== OCR TEXT CHECK =====
def extract_and_check_text(image_path: str) -> dict:
    try:
        ocr_results = ocr_reader.readtext(image_path)
        extracted_text = " ".join([item[1] for item in ocr_results]).strip()

        if not extracted_text or len(extracted_text) < 3:
            return {"ocr_text": "", "ocr_harmful": False, "ocr_label": "", "ocr_score": 0}

        text_result = analyze_text(extracted_text)
        return {
            "ocr_text": extracted_text,
            "ocr_harmful": text_result["is_harmful"],
            "ocr_label": text_result["prediction"],
            "ocr_score": text_result["confidence"]
        }
    except Exception as e:
        print(f"[OCR ERROR] {e}")
        return {"ocr_text": "", "ocr_harmful": False, "ocr_label": "", "ocr_score": 0}

# ===== MAIN ANALYSIS FUNCTION =====
def analyze_frame(
    image_path: str,
    meeting_code: str = "0000",
    user_name: str = "unknown",
    user_uid: str = "unknown",
) -> dict:

    results = {
        "is_harmful": False,
        "reasons": [],
        "label": "",
        "confidence": 0,
        "all_detections": [],
        "dangerous_found": [],
        "nude_found": [],
        "middle_finger": False,
        "nsfw": False,
        "ocr_text": "",
        "ocr_harmful": False,
        "ocr_label": "",
        "ocr_score": 0,
        "snapshot_path": "",
    }

    try:
        # ===== 1. YOLOv8 — weapon detection =====
        yolo_results = model(image_path, verbose=False)
        for box in yolo_results[0].boxes:
            label = model.names[int(box.cls)]
            confidence = round(float(box.conf), 4)
            results["all_detections"].append({"label": label, "confidence": confidence})

            if label.lower() in DANGEROUS_LABELS and confidence >= YOLO_CONFIDENCE:
                results["dangerous_found"].append({"label": label, "confidence": confidence})
                results["reasons"].append(f"weapon:{label}")

        # ===== 2. NudeNet — nudity detection =====
        nude_results = nude_detector.detect(image_path)
        for item in nude_results:
            if item["class"] in HARMFUL_NUDE_LABELS and item["score"] >= NUDE_CONFIDENCE:
                results["nude_found"].append({
                    "label": item["class"],
                    "confidence": round(item["score"], 4)
                })
                results["reasons"].append(f"nudity:{item['class']}")

        # ===== 3. NSFW classifier =====
        nsfw_result = violence_classifier(image_path)
        nsfw_score = next((x["score"] for x in nsfw_result if x["label"] == "nsfw"), 0)
        if nsfw_score >= NSFW_CONFIDENCE:
            results["nsfw"] = True
            results["reasons"].append(f"nsfw:{round(nsfw_score, 4)}")

        # ===== 4. Middle finger gesture =====
        gesture = detect_middle_finger(image_path)
        if gesture["middle_finger"]:
            results["middle_finger"] = True
            results["reasons"].append("gesture:middle_finger")

        # ===== 5. OCR — text in frame =====

        ocr_frame_counter[user_uid] = (
            ocr_frame_counter.get(
                user_uid,
                0
            ) + 1
        )

        run_ocr = (
            ocr_frame_counter[user_uid]
            % 5 == 0
        )

        if run_ocr:

            ocr = extract_and_check_text(
                image_path
            )

        else:

            ocr = {

                "ocr_text": "",

                "ocr_harmful": False,

                "ocr_label": "",

                "ocr_score": 0

            }

        results["ocr_text"] = (
            ocr["ocr_text"]
        )

        results["ocr_harmful"] = (
            ocr["ocr_harmful"]
        )

        results["ocr_label"] = (
            ocr["ocr_label"]
        )

        results["ocr_score"] = (
            ocr["ocr_score"]
        )

        if ocr["ocr_harmful"]:

            results["reasons"].append(
                f"ocr_text:"
                f"{ocr['ocr_text'][:50]}"
            )

        # ===== Is harmful? =====
        results["is_harmful"] = len(results["reasons"]) > 0

        # ===== Top label + confidence =====
        if results["dangerous_found"]:
            top = results["dangerous_found"][0]
            results["label"] = top["label"]
            results["confidence"] = top["confidence"]
        elif results["nude_found"]:
            top = results["nude_found"][0]
            results["label"] = top["label"]
            results["confidence"] = top["confidence"]
        elif results["nsfw"]:
            results["label"] = "nsfw"
            results["confidence"] = round(nsfw_score, 4)
        elif results["middle_finger"]:
            results["label"] = "middle_finger"
            results["confidence"] = 0.95
        elif ocr["ocr_harmful"]:
            results["label"] = "ocr_offensive_text"
            results["confidence"] = ocr["ocr_score"]

        # ===== Save snapshot with cooldown =====
        if results["is_harmful"] and results["label"]:
            cooldown_key = f"{meeting_code}_{user_uid}_{results['label']}"
            now = time.time()
            last_logged = _cooldown_tracker.get(cooldown_key, 0)

            if now - last_logged >= COOLDOWN_SECONDS:
                _cooldown_tracker[cooldown_key] = now

                # Draw YOLO boxes on frame then save
                annotated = yolo_results[0].plot()
                os.makedirs(SAVE_DIR, exist_ok=True)
                timestamp = int(time.time() * 1000)
                filename = f"{meeting_code}_{results['label']}_{timestamp}.jpg"
                full_path = os.path.join(SAVE_DIR, filename)
                cv2.imwrite(full_path, annotated)

                # ✅ MongoDB stores this path — not the image
                cloud_url = upload_image(
                full_path,
                "video_ai_events"
                )

                results["snapshot_path"] = cloud_url

                print(f"[VIDEO] ⚠️  {user_name} in {meeting_code}: '{results['label']}' ({results['confidence']}) → saved: {filename}")
                print(f"[VIDEO] Reasons: {results['reasons']}")
            else:
                secs_left = int(
                COOLDOWN_SECONDS -
                    (now - last_logged)
                )

                print(
                f"[VIDEO] Cooldown "
                f"{cooldown_key}"
                f" — {secs_left}s left,"
                f" skipping SAVE only"
                )
                
                results["snapshot_path"] = ""

    except Exception as e:
        print(f"[VIDEO ERROR] {e}")
        results["reasons"].append(f"error:{str(e)}")

    return results