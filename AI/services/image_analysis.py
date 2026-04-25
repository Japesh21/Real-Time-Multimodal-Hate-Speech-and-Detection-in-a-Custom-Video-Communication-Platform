import time
import requests
from ultralytics import YOLO
from transformers import pipeline

# =========================================================
# LOAD MODELS ONCE
# =========================================================

weapon_model = YOLO("yolov8m.pt")

nsfw_classifier = pipeline(
    "image-classification",
    model="Falconsai/nsfw_image_detection"
)

# =========================================================
# CACHE
# =========================================================

PROFILE_SCAN_CACHE = {}

CACHE_EXPIRY_SECONDS = 3600

# =========================================================
# WEAPON LABELS
# =========================================================

DANGEROUS_OBJECTS = [
    "knife",
    "scissors",
    "baseball bat",
    "gun",
    "pistol",
    "rifle",
    "firearm",
    "weapon",
    "suitcase"
]

# =========================================================
# CONFIDENCE THRESHOLD
# =========================================================

WEAPON_CONFIDENCE_THRESHOLD = 0.20

# =========================================================
# DOWNLOAD IMAGE
# =========================================================

def download_image(image_url):

    # =====================================
    # LOCAL FILE PATH
    # =====================================

    if (
        image_url.startswith("C:\\")
        or image_url.startswith("/")
        or image_url.startswith("./")
    ):

        return image_url

    # =====================================
    # REMOTE URL
    # =====================================

    response = requests.get(
        image_url,
        timeout=10
    )

    if response.status_code != 200:
        return None

    temp_path = "temp_profile_image.jpg"

    with open(temp_path, "wb") as f:
        f.write(response.content)

    return temp_path

# =========================================================
# MAIN FUNCTION
# =========================================================

def analyze_profile_image(
    image_url: str,
    meeting_id: str,
    user_uid: str
):

    cache_key = f"{meeting_id}_{user_uid}"

    # =====================================================
    # CACHE CHECK
    # =====================================================

    now = time.time()

    if cache_key in PROFILE_SCAN_CACHE:

        last_scan = PROFILE_SCAN_CACHE[cache_key]

        if (
            now - last_scan
            < CACHE_EXPIRY_SECONDS
        ):

            print(
                f"[PROFILE AI] skipped cached scan for {cache_key}"
            )

            return {
                "cached": True,
                "safe": True,
                "labels": [],
                "confidence": 0
            }

    # =====================================================
    # LOAD IMAGE
    # =====================================================

    image_path = download_image(image_url)

    if not image_path:

        return {
            "cached": False,
            "safe": True,
            "labels": [],
            "confidence": 0
        }

    detected_labels = []

    top_confidence = 0

    # =====================================================
    # YOLO DETECTION
    # =====================================================

    try:

        results = weapon_model.predict(

            source=image_path,

            conf=WEAPON_CONFIDENCE_THRESHOLD,

            verbose=False

        )

        for box in results[0].boxes:

            cls_id = int(box.cls[0])

            label = (
                weapon_model.names[cls_id]
                .lower()
            )

            conf = float(box.conf[0])

            print(
                f"[PROFILE DETECTION] "
                f"{label} "
                f"{round(conf, 4)}"
            )

            if (

                label in DANGEROUS_OBJECTS

                and conf >= 0.20

            ):

                detected_labels.append(label)

                top_confidence = max(
                    top_confidence,
                    conf
                )

    except Exception as e:

        print(
            "[PROFILE YOLO ERROR]",
            e
        )

    # =====================================================
    # NSFW DETECTION
    # =====================================================

    try:

        nsfw_results = (
            nsfw_classifier(image_path)
        )

        for item in nsfw_results:

            label = (
                item["label"]
                .lower()
            )

            score = float(
                item["score"]
            )

            print(
                f"[NSFW CHECK] "
                f"{label} "
                f"{round(score, 4)}"
            )

            if (
                label == "nsfw"
                and score > 0.60
            ):

                detected_labels.append(
                    "nsfw"
                )

                top_confidence = max(
                    top_confidence,
                    score
                )

    except Exception as e:

        print(
            "[PROFILE NSFW ERROR]",
            e
        )

    # =====================================================
    # FINAL RESULT
    # =====================================================

    PROFILE_SCAN_CACHE[
        cache_key
    ] = now

    result = {

        "cached": False,

        "safe":
            len(
                detected_labels
            ) == 0,

        "labels":
            list(
                set(
                    detected_labels
                )
            ),

        "confidence":
            round(
                top_confidence,
                4
            )

    }

    print(
        f"[PROFILE AI] "
        f"{cache_key} "
        f"-> {result}"
    )

    return result