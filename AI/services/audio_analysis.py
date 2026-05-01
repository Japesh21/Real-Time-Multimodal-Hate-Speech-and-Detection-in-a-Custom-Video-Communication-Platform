import os
import wave
import tempfile

import numpy as np

from faster_whisper import WhisperModel

from services.text_analysis import analyze_text


# ===== LOAD MODEL ONCE =====
# medium = higher accuracy
# int8 = faster CPU inference
whisper_model = WhisperModel(
    "medium",
    device="cpu",
    compute_type="int8"
)


# ===== SILENCE DETECTION =====
def is_silent(
    audio_path: str,
    rms_threshold: float = 0.5
) -> tuple[bool, float]:

    with wave.open(audio_path, "rb") as wf:

        frames = wf.readframes(
            wf.getnframes()
        )

        audio_np = np.frombuffer(
            frames,
            dtype=np.int16
        ).astype(np.float32)

    if len(audio_np) == 0:

        return True, 0.0

    rms = np.sqrt(
        np.mean(audio_np ** 2)
    )

    print(f"[AUDIO RMS] {rms:.2f}")

    return rms < rms_threshold, rms


# ===== NORMALIZE AUDIO =====
def normalize_audio(
    audio_path: str
) -> str:

    with wave.open(audio_path, "rb") as wf:

        params = wf.getparams()

        frames = wf.readframes(
            wf.getnframes()
        )

        audio_np = np.frombuffer(
            frames,
            dtype=np.int16
        ).astype(np.float32)

    max_val = np.max(
        np.abs(audio_np)
    )

    if max_val > 0:

        # normalize to 90% volume
        audio_np = (
            audio_np / max_val
        ) * 29491

    audio_int16 = (
        audio_np.astype(np.int16)
    )

    tmp = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".wav"
    )

    tmp_path = tmp.name

    tmp.close()

    with wave.open(
        tmp_path,
        "wb"
    ) as wf:

        wf.setparams(params)

        wf.writeframes(
            audio_int16.tobytes()
        )

    return tmp_path


# ===== TRANSCRIBE =====
def transcribe(
    audio_path: str
) -> str:

    segments, info = (
        whisper_model.transcribe(

            audio_path,

            language="en",

            beam_size=3,

            temperature=0.0,

            # less aggressive silence rejection
            no_speech_threshold=0.4,

            # accept lower-confidence speech
            log_prob_threshold=-1.0,

            # reduce over-filtering
            compression_ratio_threshold=2.4,

            # prevent context carry-over hallucinations
            condition_on_previous_text=False,

            # disable VAD because it may cut speech
            vad_filter=True,
        )
    )

    transcript = " ".join(

        seg.text

        for seg in segments

    ).strip()


    # ===== FILTER COMMON HALLUCINATIONS =====
    HALLUCINATIONS = [

        "thank you for watching",

        "thanks for watching",

        "thank you",

        "subscribe",

        "like and subscribe",

        "see you next time",

        "bye",
    ]

    lower = (
        transcript
        .lower()
        .strip(" .,!?")
    )

    if lower in HALLUCINATIONS:

        print(
            f"[WHISPER] "
            f"Hallucination filtered:"
            f" '{transcript}'"
        )

        return ""

    return transcript


# ===== MAIN ANALYSIS =====
def analyze_audio(
    audio_path: str
) -> dict:

    EMPTY = {

        "transcript": "",

        "prediction":
            "non-offensive",

        "confidence": 0.0,

        "is_harmful": False,

        "active_labels": [],
    }

    try:

        # ===== CHECK SILENCE =====
        silent, rms = is_silent(
            audio_path,
            rms_threshold=0.5
        )

        if silent:

            return EMPTY


        # ===== NORMALIZE AUDIO =====
        normalized_path = (
            normalize_audio(
                audio_path
            )
        )


        # ===== TRANSCRIBE =====
        try:

            transcript = transcribe(
                normalized_path
            )

        finally:

            os.unlink(
                normalized_path
            )


        print(
            f"[WHISPER] "
            f"transcript:"
            f" '{transcript}'"
        )


        if (
            not transcript
            or len(transcript) < 3
        ):

            return EMPTY


        # ===== RUN MODERATION =====
        text_result = analyze_text(
            transcript
        )


        return {

            "transcript":
                transcript,

            "prediction":
                text_result[
                    "prediction"
                ],

            "confidence":
                text_result[
                    "confidence"
                ],

            "is_harmful":
                text_result[
                    "is_harmful"
                ],

            "active_labels":
                text_result.get(
                    "active_labels",
                    []
                ),
        }

    except Exception:

        import traceback

        print(
            "\n===== AUDIO "
            "ANALYSIS ERROR ====="
        )

        traceback.print_exc()

        print(
            "====================="
            "===========\n"
        )

        return EMPTY