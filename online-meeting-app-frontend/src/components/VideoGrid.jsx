// src/components/VideoGrid.jsx

import { useRef, useState, useEffect, useCallback } from "react";

/* =========================================
   VIDEO TILE
========================================= */
function VideoTile({ stream, muted = false, style = {} }) {
  const ref = useRef(null);
useEffect(() => {

  const video = ref.current;

  if (!video) return;

  if (!stream) {

    video.srcObject = null;
    return;

  }

  video.srcObject = stream;
  console.log(
  "VIDEO TRACKS:",
  stream.getVideoTracks().length
);

console.log(
  "AUDIO TRACKS:",
  stream.getAudioTracks().length
);

  video.muted = muted;

  video.playsInline = true;
  video.setAttribute("playsinline", "");

  const playVideo = async () => {

    try {

      await video.play();

    } catch (err) {

      console.log(
        "VIDEO PLAY ERROR:",
        err
      );

    }

  };

  video.onloadedmetadata =
    playVideo;

  // IMPORTANT FIX
  stream.onaddtrack = () => {

    console.log(
      "TRACK ADDED TO STREAM"
    );

    playVideo();

  };

  playVideo();

  return () => {

    stream.onaddtrack =
      null;

  };

}, [stream, muted]);
  return <video ref={ref} autoPlay playsInline muted={muted} style={style} />;
}

/* =========================================
   CAM-OFF AVATAR
========================================= */
function CamOffAvatar({ name, photoURL }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = photoURL && !imgFailed;

  return (
    <div style={{
      width: "100%",
      height: 120,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#1e293b",
    }}>
      {showImg ? (
        <img
          src={photoURL}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #475569",
          }}
        />
      ) : (
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#6366f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          border: "2px solid #818cf8",
        }}>
          {name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div style={{
        marginTop: 6,
        fontSize: 10,
        color: "#64748b",
        fontWeight: 500,
      }}>
        Camera off
      </div>
    </div>
  );
}

/* =========================================
   SCROLL ARROW
========================================= */
function ScrollArrow({ direction, onClick, visible }) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [direction === "left" ? "left" : "right"]: 2,
        zIndex: 30,
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "none",
        background: "rgba(99,102,241,0.9)",
        color: "#fff",
        fontSize: 18,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      {direction === "left" ? "‹" : "›"}
    </button>
  );
}

/* =========================================
   MAIN COMPONENT
========================================= */
export default function VideoGrid({
  localStream,
  remoteStreams = [],
  localName = "You",
  micOn = true,
  camOn = true,
  user = null,
  aiActive,
  meetingCode,
  onAlert,
}) {

  const [selectedId, setSelectedId] = useState(null);
  const mainVideoRef =
  useRef(null);

  const frameIntervalRef =
  useRef(null);

  const AI_URL =
  import.meta.env.VITE_AI_URL;
  console.log("[AI URL]",AI_URL);
  const stripRef = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const selectedRemote =
    selectedId !== null
      ? remoteStreams.find((r) => r.id === selectedId) ?? null
      : null;

  // Auto-fallback if viewed remote disconnects
  useEffect(() => {
    if (selectedId !== null && !selectedRemote) setSelectedId(null);
  }, [remoteStreams, selectedId, selectedRemote]);

  /* ---- scroll arrow visibility ---- */
  const updateScrollState = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const t = setTimeout(updateScrollState, 50);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, remoteStreams]);

  const scroll = (dir) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const mainStream = selectedRemote ? selectedRemote.stream : localStream;
  const mainName   = selectedRemote ? selectedRemote.name  : `${localName} (You)`;
  // ===== VIDEO FRAME MODERATION =====

useEffect(() => {

  if (
    frameIntervalRef.current
  ) {

    clearInterval(
      frameIntervalRef.current
    );

  }

  console.log(
  "[VIDEO EFFECT]",
  {
    aiActive,
    hasMainStream:
      !!mainStream
  }
);

  if (
    !aiActive ||
    !mainStream
  ) return;

  const canvas =
    document.createElement(
      "canvas"
    );

  const ctx =
    canvas.getContext("2d");

  frameIntervalRef.current =
    setInterval(async () => {

      const video =
        mainVideoRef.current;
      console.log(
      "[FRAME TICK]",
    {
    aiActive,
    AI_URL,
    hasVideo: !!video,
    readyState:
      video?.readyState
    }
  );

      if (
        !video ||
        video.readyState < 2
      ) return;

      try {

        canvas.width =
          video.videoWidth || 640;

        canvas.height =
          video.videoHeight || 480;

        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const blob =
          await new Promise(
            (resolve) =>

              canvas.toBlob(
                resolve,
                "image/jpeg",
                0.7
              )
          );

        if (!blob) return;

        const formData =
          new FormData();

        formData.append(
          "file",
          blob,
          "frame.jpg"
        );

        const response =
          await fetch(

            `${AI_URL}/moderation/image`,

            {

              method: "POST",

              headers: {

                "X-Meeting-Code":
                  meetingCode,

                "X-User-Uid":
                  user?.uid ||
                  "unknown",

                "X-User-Name":
                  localName ||
                  "unknown",

              },

              body: formData,
            }
          );

        const data =
          await response.json();

        if (
          data.is_harmful
        ) {

          onAlert(

            `🎥 ${localName}: `
            + `${data.label}`

          );

        }

      } catch (err) {

        console.log(
          "Video moderation error:",
          err
        );

      }

    }, 5000);

  return () => {

    clearInterval(
      frameIntervalRef.current
    );
    
    frameIntervalRef.current =
    null;

  };

}, [
  aiActive,
  mainStream,
  meetingCode,
  localName,
  user,
  onAlert
]);

  /* =========================================
     🔧 FIXED LAYOUT CONSTANTS
  ========================================= */
  const CARD_HEIGHT   = 110;  // Total card height
  const VIDEO_HEIGHT  = 72;  // Video/avatar area
  const STRIP_HEIGHT  = CARD_HEIGHT; // Strip container

  const cardStyle = (active) => ({
    position: "relative",
    width: 120,
    minWidth: 120,
    height: CARD_HEIGHT,
    flexShrink: 0,
    borderRadius: 10,
    background: "#0f172a",
    border: active ? "2px solid #6366f1" : "2px solid #1e293b",
    cursor: "pointer",
    scrollSnapAlign: "start",
    boxSizing: "border-box",
    // 🔧 CRITICAL: Don't use overflow:hidden on the card itself!
    // The button needs to overflow outside the card boundaries
  });

  const overlayBtn = (active) => ({
    position: "absolute",
    bottom: 8,
    left: "50%",
    transform: "translateX(-50%)",
    padding: "5px 18px",
    border: "none",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    zIndex: 20,
    whiteSpace: "nowrap",
    background: active ? "#6366f1" : "#1e293b",
    color: "#fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
    transition: "all 0.2s ease",
  });

  const nameTag = {
    position: "absolute",
    bottom: 40,  // Position above the button
    left: 8,
    right: 8,
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 4,
    zIndex: 20,
    pointerEvents: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const videoStyle = {
    width: "100%",
    height: VIDEO_HEIGHT,
    objectFit: "cover",
    display: "block",
    borderRadius: "8px 8px 0 0",
  };

  return (
    <div className="video-area">

      {/* =========================================
          MAIN VIDEO
      ========================================= */}
      <div
      className="video-primary"
      style={{
      position: "relative",
      height: "58vh",
      minHeight: "58vh",
    }}
>
        {mainStream ? (

  <video

    ref={(el) => {

      mainVideoRef.current = el;

      if (el) {

        el.srcObject =
          mainStream;

      }

    }}

    autoPlay
    playsInline
    muted={!selectedRemote}

    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
      background: "#000",
      borderRadius: 18,
    }}

  />

) : (

          <div style={{
            width: "100%", height: "100%", background: "#111",
            borderRadius: 18, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#555", fontSize: 18,
          }}>
            Waiting for video…
          </div>
        )}

        {/* Name tag on main video */}
        <div style={{
          position: "absolute", bottom: 16, left: 16,
          background: "rgba(0,0,0,0.6)", padding: "8px 14px",
          borderRadius: 10, color: "#fff", fontWeight: 600, zIndex: 10,
        }}>
          {mainName}
        </div>

        {/* Back button */}
        {selectedRemote && (
          <button
            onClick={() => setSelectedId(null)}
            style={{
              position: "absolute", top: 16, right: 16,
              padding: "8px 14px", border: "none", borderRadius: 10,
              background: "#111827", color: "#fff", cursor: "pointer", zIndex: 10,
              fontWeight: 600,
            }}
          >
            ← Back to You
          </button>
        )}
      </div>

      {/* =========================================
          THUMBNAIL STRIP
      ========================================= */}
      <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>

        <ScrollArrow direction="left"  onClick={() => scroll("left")}  visible={canScrollLeft} />
        <ScrollArrow direction="right" onClick={() => scroll("right")} visible={canScrollRight} />

        <div
          ref={stripRef}
          className="thumb-strip"
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            gap: 10,
            overflowX: "auto",
            overflowY: "visible",  // 🔧 CRITICAL: Must be visible for buttons
            padding: "10px 36px",
            height: 140,
            alignItems: "flex-start",
            boxSizing: "border-box",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "thin",
            scrollbarColor: "#334155 transparent",
            WebkitOverflowScrolling: "touch",
          }}
        >

          {/* ===== LOCAL TILE ===== */}
          <div
            style={cardStyle(!selectedRemote)}
            onClick={() => setSelectedId(null)}
          >
            {/* 🔧 Video area has its own overflow:hidden */}
            <div style={{
              width: "100%",
              height: VIDEO_HEIGHT,
              borderRadius: "8px 8px 0 0",
              overflow: "hidden",
              background: "#1e293b",
            }}>
              {camOn && localStream ? (
                <VideoTile stream={localStream} muted style={videoStyle} />
              ) : (
                <CamOffAvatar name={localName} photoURL={user?.photoURL || ""} />
              )}
            </div>

            <div style={nameTag}>{localName} (You)</div>

            {/* 🔧 Button is absolutely positioned and can overflow the card */}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
              style={overlayBtn(!selectedRemote)}
            >
              {!selectedRemote ? "● Viewing" : "View"}
            </button>
          </div>

          {/* ===== REMOTE TILES ===== */}
          {remoteStreams.map((remote) => {
            const {
              id,
              stream,
              name = "Participant",
              profileImage = "",
              cam = true,
            } = remote;
            const isViewing = selectedId === id;

            return (
              <div
                key={id}
                style={cardStyle(isViewing)}
                onClick={() => setSelectedId(id)}
              >
                <div style={{
                  width: "100%",
                  height: VIDEO_HEIGHT,
                  borderRadius: "8px 8px 0 0",
                  overflow: "hidden",
                  background: "#1e293b",
                }}>
                  {stream && cam ? (

  <VideoTile
    stream={stream}
    muted={false}
    style={videoStyle}
  />

) : (

  <CamOffAvatar
    name={name}
    photoURL={profileImage}
  />

)}
                </div>

                <div style={nameTag}>{name}</div>

                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedId(id); }}
                  style={overlayBtn(isViewing)}
                >
                  {isViewing ? "● Viewing" : "View"}
                </button>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}