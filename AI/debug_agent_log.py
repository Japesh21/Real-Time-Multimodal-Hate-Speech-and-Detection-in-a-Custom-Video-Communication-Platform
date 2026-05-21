import json
import os
import time

_LOG_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "debug-fc1f41.log")
)


def agent_log(location, message, data=None, hypothesis_id=""):
    # #region agent log
    try:
        entry = {
            "sessionId": "fc1f41",
            "location": location,
            "message": message,
            "data": data or {},
            "hypothesisId": hypothesis_id,
            "timestamp": int(time.time() * 1000),
        }
        with open(_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception:
        pass
    # #endregion
