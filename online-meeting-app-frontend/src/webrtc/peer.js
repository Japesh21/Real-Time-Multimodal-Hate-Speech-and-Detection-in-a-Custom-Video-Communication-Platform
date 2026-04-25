// ===============================
// GET USER MEDIA (Camera + Mic)
// ===============================
export async function getUserMediaStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    return stream;

  } catch (error) {
    console.error("Media access error:", error);

    alert(
      "Camera/Microphone access denied or not available.\nPlease allow permissions."
    );

    throw error;
  }
}


// ===============================
// CREATE RTCPeerConnection
// ===============================
export const createPeer = () => {
  const peer = new RTCPeerConnection({

    iceServers: [
      // STUN (works for most local testing)
      {
        urls: "stun:stun.l.google.com:19302"
      },

      // Optional: add TURN later for production
      // {
      //   urls: "turn:your-turn-server.com",
      //   username: "user",
      //   credential: "pass"
      // }
    ],

    iceCandidatePoolSize: 10
  });

  // Debug logs (VERY helpful)
  peer.onconnectionstatechange = () => {
    console.log("Connection State:", peer.connectionState);
  };

  peer.oniceconnectionstatechange = () => {
    console.log("ICE State:", peer.iceConnectionState);
  };

  peer.onsignalingstatechange = () => {
    console.log("Signaling State:", peer.signalingState);
  };

  return peer;
};