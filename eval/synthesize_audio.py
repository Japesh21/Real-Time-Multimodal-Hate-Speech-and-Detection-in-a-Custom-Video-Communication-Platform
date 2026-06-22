"""
Phase 1.3 — Convert the same 300 text samples to speech (TTS).
Run from project root:  python eval/synthesize_audio.py
Requires: data/train.csv
Output:   data/audio/sample_<id>.mp3  +  data/audio_labels.csv
Note: gTTS requires an internet connection (Google TTS API).
"""

import os
import pandas as pd
from gtts import gTTS

CSV_PATH = 'data/train.csv'
SAMPLE_N = 300
RANDOM_STATE = 42

os.makedirs('data/audio', exist_ok=True)

print(f"Loading {CSV_PATH} ...")
df = pd.read_csv(CSV_PATH)
df = df.sample(SAMPLE_N, random_state=RANDOM_STATE).reset_index(drop=True)
df['id'] = df.index
df.to_csv('data/audio_labels.csv', index=False)

print(f"Synthesising {len(df)} audio files ...")
for i, row in df.iterrows():
    out_path = f"data/audio/sample_{row['id']}.mp3"
    if os.path.exists(out_path):
        continue
    try:
        tts = gTTS(text=str(row['comment_text']), lang='en')
        tts.save(out_path)
    except Exception as e:
        print(f"  [WARN] sample {row['id']} failed: {e}")
    if i % 50 == 0:
        print(f"  {i}/{len(df)} done")

print("Done — saved to data/audio/ and data/audio_labels.csv")
