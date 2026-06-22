"""
Phase 1.7 — Ablation study: multimodal fusion (majority vote).
Run from project root:  python eval/run_fusion_eval.py
Requires: results/text_preds.csv
          results/audio_preds.csv
          results/emotion_preds.csv
          (produced by the three preceding eval scripts)
Output:   results/fusion_preds.csv  +  per-modality classification reports
"""

import os
import pandas as pd
from sklearn.metrics import classification_report, accuracy_score

os.makedirs('results', exist_ok=True)

REQUIRED = ['results/text_preds.csv', 'results/audio_preds.csv', 'results/emotion_preds.csv']
for f in REQUIRED:
    if not os.path.exists(f):
        raise FileNotFoundError(
            f"Missing {f} — run the corresponding eval script first.\n"
            f"Order: run_text_eval.py → run_audio_eval.py → run_emotion_eval.py"
        )

text_preds    = pd.read_csv('results/text_preds.csv')
audio_preds   = pd.read_csv('results/audio_preds.csv')
emotion_preds = pd.read_csv('results/emotion_preds.csv')

# Truncate to the shortest result set for a clean 1:1 paired set
n = min(len(text_preds), len(audio_preds), len(emotion_preds))
print(f"Aligning to {n} samples (text={len(text_preds)}, "
      f"audio={len(audio_preds)}, emotion={len(emotion_preds)})")

merged = pd.DataFrame({
    'true_label':   text_preds['true_label'][:n].values,
    'pred_text':    text_preds['pred'][:n].values,
    'pred_audio':   audio_preds['pred'][:n].values,
    'pred_emotion': emotion_preds['pred'][:n].values,
})

# Majority vote (≥2 of 3 modalities flag as harmful)
merged['fused_pred'] = (
    merged[['pred_text', 'pred_audio', 'pred_emotion']].sum(axis=1) >= 2
).astype(int)

merged.to_csv('results/fusion_preds.csv', index=False)

COLS = [
    ('pred_text',    'Text-only'),
    ('pred_audio',   'Audio-only'),
    ('pred_emotion', 'Emotion-only'),
    ('fused_pred',   'Multimodal fusion (majority vote)'),
]

print("\n===== ABLATION STUDY — TABLE II =====")
for col, name in COLS:
    acc = accuracy_score(merged['true_label'], merged[col])
    print(f"\n--- {name} (accuracy={acc:.4f}) ---")
    print(classification_report(merged['true_label'], merged[col],
                                 target_names=['non-harmful', 'harmful']))

print("Saved -> results/fusion_preds.csv")
