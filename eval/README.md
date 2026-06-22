# Phase 1 — Evaluation Scripts

Run these **in order** from the project root (`c:\Users\japes\OneDrive\Desktop\call`).

## Prerequisites

```
pip install pandas scikit-learn gtts fer opencv-python pydub faster-whisper
```

ffmpeg must be on PATH for MP3→WAV conversion (used in `run_audio_eval.py`).
Download: https://ffmpeg.org/download.html  — add the `bin/` folder to PATH.

---

## Step-by-step

### 1.1 — Get Jigsaw dataset
Download `train.csv` from https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge/data  
Place at: `data/train.csv`  
Required columns: `comment_text`, `toxic`

### 1.2 — Text evaluation
```
python eval/run_text_eval.py
```
Output: `results/text_preds.csv`

### 1.3 — Synthesize audio (TTS)
```
python eval/synthesize_audio.py
```
Needs internet (Google TTS). Output: `data/audio/*.mp3`, `data/audio_labels.csv`

### 1.4 — Audio evaluation
```
python eval/run_audio_eval.py
```
Output: `results/audio_preds.csv`

### 1.5 — Get FER2013 dataset
Download from https://www.kaggle.com/datasets/msambare/fer2013  
Arrange ~50 images per class into:
```
data/fer2013_sample/
    angry/     (*.png or *.jpg)
    disgust/
    happy/
    neutral/
    sad/
    fear/
    surprise/
```

### 1.6 — Emotion evaluation
```
python eval/run_emotion_eval.py
```
Output: `results/emotion_preds.csv`

### 1.7 — Fusion / ablation study
```
python eval/run_fusion_eval.py
```
Output: `results/fusion_preds.csv` + per-modality Table II numbers

---

## Results files

| File | Contents |
|---|---|
| `results/text_preds.csv` | id, true_label, pred |
| `results/audio_preds.csv` | id, true_label, pred |
| `results/emotion_preds.csv` | id, true_label, pred, true_emotion, detected_emotion |
| `results/fusion_preds.csv` | merged table + fused_pred column |
