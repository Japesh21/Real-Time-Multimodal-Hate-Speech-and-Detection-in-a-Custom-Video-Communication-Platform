import torch
import torch.nn as nn
import numpy as np
from transformers import (
    pipeline,
    AutoTokenizer,
    AutoModelForSequenceClassification
)

# ===== 1. Cardiff NLP RoBERTa — binary offensive detection =====
roberta_classifier = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-offensive",
    top_k=None
)

# ===== 2. HateBERT — hate speech detection =====
hatebert_tokenizer = AutoTokenizer.from_pretrained("GroNLP/hateBERT")
hatebert_model     = AutoModelForSequenceClassification.from_pretrained("GroNLP/hateBERT")
hatebert_model.eval()

# ===== 3. Unbiased Toxic RoBERTa — multi-label classification =====
toxic_tokenizer = AutoTokenizer.from_pretrained(
    "unitary/toxic-bert"
)
toxic_model = AutoModelForSequenceClassification.from_pretrained(
     "unitary/toxic-bert"
)
toxic_model.eval()

TOXIC_LABELS = [
    "toxic",
    "severe_toxic",
    "obscene",
    "threat",
    "insult",
    "identity_attack",
    "sexual_explicit",
]

# ===== 4. Bi-LSTM — sequence pattern matching =====
BILSTM_VOCAB = {
    "<pad>": 0, "<unk>": 1,
    "kill": 2, "hate": 3, "die": 4, "stupid": 5, "idiot": 6,
    "damn": 7, "hell": 8, "shut": 9, "ugly": 10, "loser": 11,
    "freak": 12, "moron": 13, "dumb": 14, "trash": 15, "scum": 16,
    "pig": 17, "rat": 18, "sick": 19, "disgusting": 20,
    "abuse": 21, "violent": 22, "threat": 23, "attack": 24, "murder": 25,
    "rape": 26, "assault": 27, "stab": 28, "shoot": 29, "bomb": 30,
    "terrorist": 31, "extremist": 32, "racist": 33, "sexist": 34,
    "bitch": 35, "bastard": 36, "asshole": 37, "crap": 38, "shit": 39,
    "fuck": 40, "fucking": 41, "fucker": 42, "fuk": 43, "wtf": 44,
    "nigger": 45, "nigga": 46, "faggot": 47, "retard": 48, "whore": 49,
    "slut": 50, "cunt": 51, "piss": 52, "motherfucker": 53, "cock": 54,
    "dick": 55, "pussy": 56, "anus": 57, "porn": 58, "sex": 59,
    "you": 60, "are": 61, "a": 62, "your": 63, "go": 64,
    "i": 65, "will": 66, "not": 67, "good": 68, "bad": 69,
}

VOCAB_SIZE = len(BILSTM_VOCAB)
EMBED_DIM  = 64
HIDDEN_DIM = 128
NUM_LAYERS = 2

class BiLSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_layers):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 2)
        )

    def forward(self, x):
        emb = self.embedding(x)
        out, (hidden, _) = self.lstm(emb)
        final = torch.cat([hidden[-2], hidden[-1]], dim=1)
        return self.classifier(final)

torch.manual_seed(42)
bilstm_model = BiLSTMClassifier(VOCAB_SIZE, EMBED_DIM, HIDDEN_DIM, NUM_LAYERS)

with torch.no_grad():
    for idx in range(2, 60):
        bilstm_model.embedding.weight[idx] = torch.randn(EMBED_DIM) * 0.5 + 0.5

bilstm_model.eval()

MAX_SEQ_LEN = 32

def tokenize_for_bilstm(text: str) -> torch.Tensor:
    words  = text.lower().split()
    tokens = [BILSTM_VOCAB.get(w, BILSTM_VOCAB["<unk>"]) for w in words]
    tokens = tokens[:MAX_SEQ_LEN]
    tokens += [0] * (MAX_SEQ_LEN - len(tokens))
    return torch.tensor([tokens], dtype=torch.long)


# ===== MODEL INFERENCE FUNCTIONS =====

def run_roberta(text: str) -> dict:
    results = roberta_classifier(text)[0]
    offensive_score = next(
        (r["score"] for r in results if r["label"] == "offensive"), 0.0
    )
    return {
        "model": "roberta",
        "score": round(offensive_score, 4),
        "is_harmful": offensive_score > 0.50
    }


def run_hatebert(text: str) -> dict:
    inputs = hatebert_tokenizer(
        text, return_tensors="pt",
        truncation=True, max_length=128
    )
    with torch.no_grad():
        logits = hatebert_model(**inputs).logits
    probs = torch.softmax(logits, dim=1)[0]
    hate_score = float(probs[1])
    return {
        "model": "hatebert",
        "score": round(hate_score, 4),
        "is_harmful": hate_score > 0.50
    }


def run_bilstm(text: str) -> dict:
    tokens = tokenize_for_bilstm(text)
    with torch.no_grad():
        logits = bilstm_model(tokens)
    probs = torch.softmax(logits, dim=1)[0]
    offensive_score = float(probs[1])
    return {
        "model": "bilstm",
        "score": round(offensive_score, 4),
        "is_harmful": offensive_score > 0.50
    }


def run_toxic_roberta(text: str) -> dict:
    inputs = toxic_tokenizer(
        text, return_tensors="pt",
        truncation=True, max_length=128
    )
    with torch.no_grad():
        logits = toxic_model(**inputs).logits

    probs = torch.sigmoid(logits)[0]

    label_scores = {
        TOXIC_LABELS[i]: round(float(probs[i]), 4)
        for i in range(len(TOXIC_LABELS))
    }

    active_labels = [
        label for label, score in label_scores.items()
        if score > 0.50
    ]

    top_label = max(label_scores, key=label_scores.get)
    top_score = label_scores[top_label]

    return {
        "model": "toxic_roberta",
        "label_scores": label_scores,
        "active_labels": active_labels,
        "top_label": top_label,
        "top_score": round(top_score, 4),
        "is_harmful": len(active_labels) > 0
    }


# ===== MAIN FUNCTION =====
def analyze_text(text: str) -> dict:

    roberta      = run_roberta(text)
    hatebert     = run_hatebert(text)
    bilstm       = run_bilstm(text)
    toxic_result = run_toxic_roberta(text)

    # ✅ Updated balanced ensemble weights
    ensemble_score = round(
        roberta["score"]          * 0.25 +
        hatebert["score"]         * 0.25 +
        bilstm["score"]           * 0.20 +
        toxic_result["top_score"] * 0.30,
        4
    )

    votes = sum([
        roberta["is_harmful"],
        hatebert["is_harmful"],
        bilstm["is_harmful"],
        toxic_result["is_harmful"],
    ])

    is_harmful = votes >= 2

    if is_harmful and toxic_result["active_labels"]:
        prediction = toxic_result["top_label"]
    elif is_harmful:
        prediction = "offensive"
    else:
        prediction = "non-offensive"

    print(f"[TEXT] '{text[:60]}'")
    print(f"  RoBERTa={roberta['score']}  HateBERT={hatebert['score']}  BiLSTM={bilstm['score']}  ToxicRoBERTa={toxic_result['top_score']}")
    print(f"  Active labels: {toxic_result['active_labels']}")
    print(f"  Ensemble={ensemble_score}  Votes={votes}/4  → {prediction}")

    return {
        "input": text,
        "prediction": prediction,
        "confidence": ensemble_score,
        "is_harmful": is_harmful,
        "active_labels": toxic_result["active_labels"],
        "label_scores": toxic_result["label_scores"],
        "model_scores": {
            "roberta":       roberta["score"],
            "hatebert":      hatebert["score"],
            "bilstm":        bilstm["score"],
            "toxic_roberta": toxic_result["top_score"],
        },
        "votes": votes
    }