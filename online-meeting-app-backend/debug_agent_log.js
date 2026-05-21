const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "..", "debug-fc1f41.log");
const ENDPOINT =
  "http://127.0.0.1:7450/ingest/aaacd22f-394e-4b0b-a706-96fb8d7236b7";

function agentLog(location, message, data = {}, hypothesisId = "") {
  // #region agent log
  const entry = {
    sessionId: "fc1f41",
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  try {
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
  } catch (_) {}
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "fc1f41",
    },
    body: JSON.stringify(entry),
  }).catch(() => {});
  // #endregion
}

module.exports = { agentLog };
