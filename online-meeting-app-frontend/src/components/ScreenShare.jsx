// C:\Users\japes\OneDrive\Desktop\call\online-meeting-app-frontend\src\components\ScreenShare.jsx

// Props (WebRTC-ready):
//   onStream: (stream: MediaStream) => void  — called when user starts sharing screen
//   onStop:   () => void                     — called when screen share ends

export default function ScreenShare({ onStream, onStop }) {

  const startShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      // Auto-detect when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        if (onStop) onStop();
      };

      if (onStream) onStream(screenStream);
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  // This component is headless — ControlBar renders the button.
  // Call startShare() directly from ControlBar via onShareScreen prop.
  // Export the function for external use if needed.
  return null;
}

// Helper hook — use this in MeetingPage.jsx for easy screen share wiring:
// const { startScreenShare } = useScreenShare(onStream, onStop);
export function useScreenShare(onStream, onStop) {
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStream.getVideoTracks()[0].onended = () => { if (onStop) onStop(); };
      if (onStream) onStream(screenStream);
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };
  return { startScreenShare };
}
