"""
Phase 1.2 — Evaluate text/toxicity model on Jigsaw dataset.
Run from project root:  python eval/run_text_eval.py
Requires: data/train.csv  (Jigsaw Toxic Comment Classification Challenge)
Output:   results/text_preds.csv  +  classification report printed to stdout
"""

import sys
import os
# Force UTF-8 stdout so Unicode chars in Jigsaw text don't crash on Windows CP1252
sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', encoding='utf-8', buffering=1)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'AI'))

import pandas as pd
from sklearn.metrics import classification_report

from services.text_analysis import analyze_text

os.makedirs('results', exist_ok=True)

CSV_PATH = 'data/train.csv'
SAMPLE_N = 300
RANDOM_STATE = 42

print(f"Loading {CSV_PATH} ...")
df = pd.read_csv(CSV_PATH)
df = df.sample(SAMPLE_N, random_state=RANDOM_STATE).reset_index(drop=True)
df['id'] = df.index

print(f"Running toxicity model on {len(df)} samples ...")
predicted = []
for i, text in enumerate(df['comment_text']):
    if i % 50 == 0:
        print(f"  {i}/{len(df)}")
    result = analyze_text(str(text))
    predicted.append(1 if result['is_harmful'] else 0)

df['pred'] = predicted
df['true_label'] = df['toxic']
df[['id', 'true_label', 'pred']].to_csv('results/text_preds.csv', index=False)

print("\n===== TEXT-ONLY DETECTION =====")
print(classification_report(df['true_label'], df['pred'],
                             target_names=['non-toxic', 'toxic']))
print("Saved → results/text_preds.csv")
