"""
Phase 1.6 — Evaluate FER facial emotion model on FER2013 samples.
Run from project root:  python eval/run_emotion_eval.py
Requires: data/fer2013_sample/<emotion_name>/*.png  (or .jpg)
Output:   results/emotion_preds.csv  +  classification report printed to stdout

Mapping: angry + disgust -> harmful (1),  all others -> non-harmful (0)

Note: FER2013 images are 48x48 greyscale. We upscale to 96x96 and convert to
BGR so OpenCV face detection works reliably. mtcnn=False skips heavy face
detection and uses the direct Haar+emotion classifier, which handles small images.
"""

import os
import sys
import pandas as pd
from sklearn.metrics import classification_report
from fer.fer import FER
import cv2
import numpy as np

# Force UTF-8 stdout on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

os.makedirs('results', exist_ok=True)

DATA_DIR = 'data/fer2013_sample'
HARMFUL_EMOTIONS = {'angry', 'disgust'}
MAX_PER_CLASS = 50

if not os.path.isdir(DATA_DIR):
    print(f"ERROR: {DATA_DIR} not found.")
    sys.exit(1)

# mtcnn=False: use OpenCV Haar cascade — works on small/greyscale images
detector = FER(mtcnn=False)

rows = []
idx = 0

emotion_classes = sorted([d for d in os.listdir(DATA_DIR)
                           if os.path.isdir(os.path.join(DATA_DIR, d))
                           and d.lower() != 'train'])
print(f"Found emotion classes: {emotion_classes}")

for label_folder in emotion_classes:
    folder_path = os.path.join(DATA_DIR, label_folder)
    files = [f for f in os.listdir(folder_path)
             if f.lower().endswith(('.png', '.jpg', '.jpeg'))][:MAX_PER_CLASS]
    true_label = 1 if label_folder.lower() in HARMFUL_EMOTIONS else 0
    print(f"  Processing {label_folder}: {len(files)} images (true={true_label})")

    for filename in files:
        img_path = os.path.join(folder_path, filename)
        img = cv2.imread(img_path)
        if img is None:
            continue

        # FER2013 images are 48x48 greyscale — upscale and ensure BGR
        if img.shape[0] < 96:
            img = cv2.resize(img, (96, 96), interpolation=cv2.INTER_LINEAR)
        if len(img.shape) == 2 or img.shape[2] == 1:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

        result = detector.detect_emotions(img)
        if result:
            emotions = result[0]['emotions']
            top_emotion = max(emotions, key=emotions.get)
        else:
            # No face detected — fall back to top_emotion() which skips face detection
            top_emotion = detector.top_emotion(img)
            if top_emotion is None or (isinstance(top_emotion, tuple) and top_emotion[0] is None):
                top_emotion = 'neutral'
            elif isinstance(top_emotion, tuple):
                top_emotion = top_emotion[0]

        pred = 1 if str(top_emotion).lower() in HARMFUL_EMOTIONS else 0
        rows.append({
            'id': idx,
            'true_label': true_label,
            'pred': pred,
            'true_emotion': label_folder,
            'detected_emotion': top_emotion,
        })
        idx += 1

out = pd.DataFrame(rows)
out.to_csv('results/emotion_preds.csv', index=False)

print(f"\nTotal samples: {len(out)}")
print(f"Prediction distribution: {out['pred'].value_counts().to_dict()}")
print(f"Detected emotions: {out['detected_emotion'].value_counts().to_dict()}")
print("\n===== EMOTION-ONLY DETECTION =====")
print(classification_report(out['true_label'], out['pred'],
                             target_names=['non-harmful', 'harmful'],
                             zero_division=0))

# False positive analysis (1.9)
fp = out[(out['pred'] == 1) & (out['true_label'] == 0)]
print(f"\n--- FALSE POSITIVE BREAKDOWN ({len(fp)} cases) ---")
if len(fp):
    print(fp['true_emotion'].value_counts().to_string())
else:
    print("None")
print("\nSaved -> results/emotion_preds.csv")
