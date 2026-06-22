# fusion_engine.py
# Aggregates per-modality alert counts for a user/meeting and returns
# an overall risk level. Stored in MongoDB (Meeting.analytics.fusion).
# Does NOT block alerts — alerts fire independently.

def fuse(
    text_alerts: int = 0,
    audio_alerts: int = 0,
    video_alerts: int = 0,
    emotion_alerts: int = 0,
) -> dict:
    total = text_alerts + audio_alerts + video_alerts + emotion_alerts

    if total == 0:
        risk = "low"
    elif total <= 2:
        risk = "medium"
    elif total <= 5:
        risk = "high"
    else:
        risk = "critical"

    parts = []
    if text_alerts:    parts.append(f"{text_alerts} text")
    if audio_alerts:   parts.append(f"{audio_alerts} audio")
    if video_alerts:   parts.append(f"{video_alerts} video")
    if emotion_alerts: parts.append(f"{emotion_alerts} emotion")
    summary = " + ".join(parts) if parts else "no alerts"

    return {
        "textAlerts":    text_alerts,
        "audioAlerts":   audio_alerts,
        "videoAlerts":   video_alerts,
        "emotionAlerts": emotion_alerts,
        "totalAlerts":   total,
        "riskLevel":     risk,
        "riskSummary":   summary,
    }
