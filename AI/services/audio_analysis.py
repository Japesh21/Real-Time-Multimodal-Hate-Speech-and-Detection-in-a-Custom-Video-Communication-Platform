import wave
import numpy as np

from faster_whisper import WhisperModel

from services.text_analysis import analyze_text


# load once
whisper_model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)


def analyze_audio(audio_path: str) -> dict:

    try:

        # ===== silence detection =====
        with wave.open(audio_path, "rb") as wf:

            frames = wf.readframes(wf.getnframes())

            audio_np = np.frombuffer(
                frames,
                dtype=np.int16
            ).astype(np.float32)

            rms = np.sqrt(np.mean(audio_np ** 2))

            print(f"[AUDIO RMS] {rms:.2f}")

            # skip near silence
            if rms < 300:

                return {
                    "transcript": "",
                    "prediction": "non-offensive",
                    "confidence": 0.0,
                    "is_harmful": False
                }

        # ===== speech-to-text =====
        segments, info = whisper_model.transcribe(

            audio_path,

            language="en",

            beam_size=5,

            no_speech_threshold=0.6,

            log_prob_threshold=-1.0,

            condition_on_previous_text=False,
        )

        transcript = " ".join(
            [seg.text for seg in segments]
        ).strip()

        print(f"[WHISPER] transcript: '{transcript}'")

        # empty transcript guard
        if not transcript or len(transcript) < 3:

            return {
                "transcript": "",
                "prediction": "non-offensive",
                "confidence": 0.0,
                "is_harmful": False
            }

        # ===== run full moderation ensemble =====
        text_result = analyze_text(transcript)

        return {

            "transcript": transcript,

            "prediction":
                text_result["prediction"],

            "confidence":
                text_result["confidence"],

            "is_harmful":
                text_result["is_harmful"],

            "active_labels":
                text_result.get(
                    "active_labels",
                    []
                ),
        }

    except Exception:

        import traceback

        print("\n===== AUDIO ANALYSIS ERROR =====")

        traceback.print_exc()

        print("================================\n")

        return {

            "transcript": "",

            "prediction": "non-offensive",

            "confidence": 0.0,

            "is_harmful": False
        }