"""
Phase 1.4 — Evaluate audio pipeline (faster-whisper → toxicity model).
Run from project root:  python eval/run_audio_eval.py
Requires: data/audio_labels.csv  +  data/audio/sample_*.mp3
          (produced by eval/synthesize_audio.py)
Output:   results/audio_preds.csv  +  classification report printed to stdout

The project uses faster-whisper (not openai-whisper) and expects WAV input.
MP3 files are converted to 16kHz mono WAV in a temp file before transcription.
pydub is used for the conversion; ffmpeg must be on PATH.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'AI'))
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
    sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)

import tempfile
import pandas as pd
from sklearn.metrics import classification_report
from pydub import AudioSegment

from services.audio_analysis import transcribe
from services.text_analysis import analyze_text

os.makedirs('results', exist_ok=True)

LABELS_CSV = 'data/audio_labels.csv'

print(f"Loading {LABELS_CSV} ...")
df = pd.read_csv(LABELS_CSV)

predicted = []
print(f"Running audio pipeline on {len(df)} samples ...")
for i, (_, row) in enumerate(df.iterrows()):
    if i % 25 == 0:
        print(f"  {i}/{len(df)}")
    mp3_path = f"data/audio/sample_{int(row['id'])}.mp3"

    if not os.path.exists(mp3_path):
        print(f"  [WARN] missing {mp3_path}, skipping")
        predicted.append(0)
        continue

    # Convert MP3 → 16kHz mono WAV (faster-whisper requires WAV)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    tmp_path = tmp.name
    tmp.close()
    try:
        audio = AudioSegment.from_mp3(mp3_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(tmp_path, format='wav')

        transcript = transcribe(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if transcript and len(transcript) >= 3:
        result = analyze_text(transcript)
        predicted.append(1 if result['is_harmful'] else 0)
    else:
        predicted.append(0)

df['pred'] = predicted
df['true_label'] = df['toxic']
df[['id', 'true_label', 'pred']].to_csv('results/audio_preds.csv', index=False)

print("\n===== AUDIO-ONLY DETECTION =====")
print(classification_report(df['true_label'], df['pred'],
                             target_names=['non-toxic', 'toxic']))
print("Saved -> results/audio_preds.csv")
