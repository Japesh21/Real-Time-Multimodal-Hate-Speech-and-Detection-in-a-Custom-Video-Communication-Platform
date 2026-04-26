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

  {
    urls: "stun:stun.relay.metered.ca:80",
  },

  {
    urls: "turn:global.relay.metered.ca:80",
    username: "b626f99fa0e6ba0118aa8463",
    credential: "pI02kOUIIrQL+Ugf",
  },

  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "b626f99fa0e6ba0118aa8463",
    credential: "pI02kOUIIrQL+Ugf",
  },

  {
    urls: "turn:global.relay.metered.ca:443",
    username: "b626f99fa0e6ba0118aa8463",
    credential: "pI02kOUIIrQL+Ugf",
  },

  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "b626f99fa0e6ba0118aa8463",
    credential: "pI02kOUIIrQL+Ugf",
  },

],
  iceTransportPolicy: "all",
  iceCandidatePoolSize: 10
});

  // Debug logs (VERY helpful)
  peer.onconnectionstatechange = () => {
    console.log("Connection State:", peer.connectionState);
    if (peer.connectionState === "failed") {
      console.error("❌ Peer connection FAILED — ICE negotiation broke down");
    }
    if (peer.connectionState === "connected") {
      console.log("✅ Peer connected successfully!");
    }
  };

  peer.oniceconnectionstatechange = () => {
    console.log("ICE State:", peer.iceConnectionState);
  };

  peer.onsignalingstatechange = () => {
    console.log("Signaling State:", peer.signalingState);
  };

  return peer;
};