import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { MEETING_CSS } from "../components/meetingStyles";
import VideoGrid from "../components/VideoGrid";
import ChatBox from "../components/ChatBox";
import Participants from "../components/Participants";
import ControlBar from "../components/ControlBar";
import AlertPanel from "../components/AlertPanel";
import { useScreenShare } from "../components/ScreenShare";

import { createPeer, getUserMediaStream } from "../webrtc/peer";
import socket from "../socket/socket";
  
const BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://meeting-backend-v3xj.onrender.com";

export default function Meeting({ user }) {

  const { code } = useParams();

  const navigate = useNavigate();

  const peersRef = useRef({});

  const [remoteStreams, setRemoteStreams] =
    useState([]);

  const [messages,setMessages] = useState([]);

  const [localStream, setLocalStream] =
    useState(null);

  const [micOn, setMicOn] =
    useState(true);

  const [camOn, setCamOn] =
    useState(true);

  // FIX 1: Added participantsRef alongside participants state
  const [participants, setParticipants] =
    useState([]);

  const [hostUid, setHostUid] =
    useState("");

  const participantsRef =
    useRef([]);
  
  const hostUidRef =
    useRef("");

  const [alerts, setAlerts] =
    useState([]);

  const [sidebarTab, setSidebarTab] =
    useState("chat");

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [seconds, setSeconds] =
    useState(0);

  const [aiActive, setAiActive] =
    useState(false);

  const aiActiveRef = useRef(false);

  const addAlert = (msg) => {

    setAlerts((prev) => [
      msg,
      ...prev.slice(0, 9),
    ]);

  };

  const [profileName, setProfileName] =
    useState(user?.displayName || "");

  const profileNameRef =
    useRef(user?.displayName || "");

  const profileImageRef =
    useRef("");

  /* =========================================
     AI TOGGLE
  ========================================= */

  const toggleAI = () => {

    const newVal = !aiActive;

    setAiActive(newVal);

    aiActiveRef.current = newVal;

    addAlert(
      newVal
        ? "🤖 AI Moderation started"
        : "🛑 AI Moderation stopped"
    );
    socket.emit("toggle-ai", {

    roomId: code,

    enabled: newVal,

    user: {

      uid: user.uid,

      name:
        profileNameRef.current ||
        user.displayName ||
        user.email,

    },
  }); 

  };

  /* =========================================
     TIMER
  ========================================= */

  useEffect(() => {

    if (!code) return;

    axios
    .get(
      `${BASE_URL}/api/meeting/${code}`
    )

    .then((res) => {

      const fetchedHostUid =
        res.data?.host?.uid || "";

      setHostUid(
        fetchedHostUid
      );

      hostUidRef.current =
        fetchedHostUid;

      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          host:
            p.uid ===
            fetchedHostUid,
        }))
      );

      participantsRef.current =
        participantsRef.current.map(
          (p) => ({
            ...p,
            host:
              p.uid ===
              fetchedHostUid,
          })
        );

    })

    .catch((err) => {

      console.log(
        "HOST FETCH ERROR:",
        err
      );

    });

  const interval = setInterval(() => {

    setSeconds((s) => s + 1);

  }, 1000);

  return () => clearInterval(interval);

}, [code]);
  const formatTime = () => {

    const h = String(
      Math.floor(seconds / 3600)
    ).padStart(2, "0");

    const m = String(
      Math.floor((seconds % 3600) / 60)
    ).padStart(2, "0");

    const s = String(seconds % 60)
      .padStart(2, "0");

    return `${h}:${m}:${s}`;

  };

  /* =========================================
     LOAD PROFILE
  ========================================= */

  useEffect(() => {

    if (!user?.uid) return;

    axios
      .get(
        `${BASE_URL}/api/profile/${user.uid}`
      )

      .then((res) => {

        if (res.data?.user) {

          if (res.data.user.name) {

            setProfileName(
              res.data.user.name
            );

            profileNameRef.current =
              res.data.user.name;

          }

          profileImageRef.current =
            res.data.user.logoURL || "";

        }

      })

      .catch(() => {

        setProfileName(
          user?.displayName || ""
        );

      });

  }, [user]);

  /* =========================================
     INIT MEDIA
  ========================================= */

  useEffect(() => {

    async function init() {

      try {

        const media =
          await getUserMediaStream();

        setLocalStream(media);

        const joinRoom = () => {

          socket.emit(
            "join-room",
          {
            roomId: code,
            user:{
              uid: user.uid,

              name:
                profileNameRef.current ||
                user.displayName ||
                user.email,

              profileImage:
                profileImageRef.current || "",
            },
          }
          );

        };

        socket.on(
          "participants",
          

          (list) => {

            const mapped =
              list.map((p) => ({

                id: p.id,

                uid: p.uid,

                name: p.name,

                profileImage:
                  p.profileImage || "",

                initials: p.name
                  ? p.name[0].toUpperCase()
                  : "?",

                host:
                  p.uid === hostUidRef.current,

                micOn:
                  p.micOn ?? true,

                camOn:
                  p.camOn ?? true,

                speaking: false,

              }));

            // FIX 2: Keep ref in sync with state
            setParticipants(mapped);

            participantsRef.current =
              mapped;

          }
        );

        socket.on(
          "ai-warning",

          ({ user: warnUser, message }) => {

            addAlert(
              `🚨 ${warnUser}: ${message}`
            );

          }
        );
if (!socket.connected) {

  socket.connect();

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    joinRoom();
  });

} else {

  joinRoom();

}
        
        
      } catch (err) {

        console.log(
          "Camera error:",
          err
        );

      }

    }

    if (user) {

      init();

    }

    return () => {

      socket.off("connect");

      socket.off("participants");

      socket.off("ai-warning");

      setParticipants([]);

    };

  }, [code, user]);

  /* =========================================
     WEBRTC
  ========================================= */

  useEffect(() => {

    if (!localStream) return;

    const handleUserJoined =
      async ({ id }) => {

        console.log(
        "USER JOINED EVENT:",
        id
        );

        if (id === socket.id)
          return;
        if (peersRef.current[id]) {

        peersRef.current[id].close();

        delete peersRef.current[id];

}

        const peer =
          createPeer();

        peersRef.current[id] =
          peer;

        localStream
          .getTracks()
          .forEach((track) => {

            peer.addTrack(
              track,
              localStream
            );

          });

        peer.onicecandidate =
          (e) => {

            if (
              e.candidate
            ) {

              socket.emit(
                "ice-candidate",

                {
                  to: id,

                  candidate:
                    e.candidate,
                }
              );

            }

          };

        peer.ontrack = (e) => {
          console.log("TRACK RECEIVED", id, e.streams);

          // FIX 3: Use ref instead of stale participants state
          const participantData =
            participantsRef.current.find(
              (p) =>
                p.id === id
            );

          setRemoteStreams(
            (prev) => {

              const exists =
                prev.find(
                  (x) =>
                    x.id === id
                );

              const remoteData =
                {

                  id,

                  stream: new MediaStream(
                      e.streams[0].getTracks()
                ),

                  name:
                    participantData?.name ||
                    "Participant",

                  profileImage:
                    participantData?.profileImage ||
                    "",

                  cam:
                    participantData?.camOn ??
                    true,
                };

              if (
                exists
              ) {

                return prev.map(
                  (p) =>

                    p.id ===
                    id

                      ? remoteData

                      : p
                );

              }

              return [
                ...prev,
                remoteData,
              ];

            }
          );
        };

        const offer =
          await peer.createOffer();

        await peer.setLocalDescription(
          offer
        );

        socket.emit(
          "offer",

          {
            to: id,
            offer,
          }
        );

      };

    const handleOffer =
      async ({
        offer,
        from,
      }) => {
        

      if (peersRef.current[from]) {

      peersRef.current[from].close();

      delete peersRef.current[from];

    }

const peer =
  createPeer();

        peersRef.current[
          from
        ] = peer;

        localStream
          .getTracks()
          .forEach((track) => {

            peer.addTrack(
              track,
              localStream
            );

          });

        peer.onicecandidate =
          (e) => {

            if (
              e.candidate
            ) {

              socket.emit(
                "ice-candidate",

                {
                  to: from,

                  candidate:
                    e.candidate,
                }
              );

            }

          };

        peer.ontrack = (e) => {
          console.log("TRACK RECEIVED", from, e.streams);

          // FIX 4: Use ref instead of stale participants state
          const participantData =
            participantsRef.current.find(
              (p) =>
                p.id ===
                from
            );

          setRemoteStreams(
            (prev) => {

              const exists =
                prev.find(
                  (x) =>
                    x.id ===
                    from
                );

              const remoteData =
                {

                  id: from,

                  stream: new MediaStream(
                      e.streams[0].getTracks()
                  ),

                  name:
                    participantData?.name ||
                    "Participant",

                  profileImage:
                    participantData?.profileImage ||
                    "",

                  cam:
                    participantData?.camOn ??
                    true,
                };

              if (
                exists
              ) {

                return prev.map(
                  (p) =>

                    p.id ===
                    from

                      ? remoteData

                      : p
                );

              }

              return [
                ...prev,
                remoteData,
              ];

            }
          );
        };

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        socket.emit(
          "answer",

          {
            to: from,
            answer,
          }
        );

      };

    const handleAnswer =
      async ({
        answer,
        from,
      }) => {

        const peer =
          peersRef.current[
            from
          ];

        if (peer) {

          await peer.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );

        }

      };

    const handleIce =
      ({
        candidate,
        from,
      }) => {

        const peer =
          peersRef.current[
            from
          ];

        if (peer.remoteDescription) {

          peer
            .addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            )
            .catch((e) =>
              console.log("ICE add error:", e)
            );

        }

      };

    const handleUserLeft =
      (socketId) => {

        const peer =
          peersRef.current[
            socketId
          ];

        if (peer) {

          peer.close();

          delete peersRef.current[
            socketId
          ];

        }

        setRemoteStreams(
          (prev) =>

            prev.filter(
              (p) =>
                p.id !==
                socketId
            )
        );

      };

    socket.on(
      "user-joined",
      handleUserJoined
    );

    socket.on("offer", handleOffer);

    socket.on("answer", handleAnswer);

    socket.on(
    "ice-candidate",
    handleIce
  );

    socket.on(
      "user-left",
      handleUserLeft
  );

    return () => {

  socket.off(
    "user-joined",
    handleUserJoined
  );

  socket.off(
    "offer",
    handleOffer
  );

  socket.off(
    "answer",
    handleAnswer
  );

  socket.off(
    "ice-candidate",
    handleIce
  );

  socket.off(
    "user-left",
    handleUserLeft
  );

};

  // FIX 5: Removed participants from dependency array to prevent duplicate peers
  }, [
    localStream,
  ]);

  /* =========================================
     🔧 FIXED: MIC TOGGLE — NOW EMITS TO BACKEND
  ========================================= */
  const handleToggleMic = () => {
    setMicOn((prev) => {
      const newMicOn = !prev;

      // Update local audio track
      const track = localStream?.getAudioTracks()[0];
      if (track) {
        track.enabled = newMicOn;
      }

      // ✅ CRITICAL FIX: Notify backend so other participants see the update
      socket.emit("update-participant", {
        roomId: code,
        micOn: newMicOn,
        camOn: camOn, // Send current camera state too
      });

      return newMicOn;
    });
  };

  /* =========================================
     🔧 FIXED: CAMERA TOGGLE — NOW EMITS TO BACKEND
  ========================================= */
  const handleToggleCam = () => {
    setCamOn((prev) => {
      const newCamOn = !prev;

      // Update local video track
      const track = localStream?.getVideoTracks()[0];
      if (track) {
        track.enabled = newCamOn;
      }

      // ✅ CRITICAL FIX: Notify backend so other participants see the update
      socket.emit("update-participant", {
        roomId: code,
        micOn: micOn, // Send current mic state too
        camOn: newCamOn,
      });

      return newCamOn;
    });
  };

  const { startScreenShare } =
    useScreenShare(
      (screenStream) =>
        setLocalStream(
          screenStream
        ),

      () =>
        setLocalStream(null)
    );

  const toggleSidebar = (tab) => {

    if (
      sidebarOpen &&
      sidebarTab === tab
    ) {

      setSidebarOpen(false);

    } else {

      setSidebarTab(tab);

      setSidebarOpen(true);

    }

  };

  const leaveMeeting = () => {

    localStream
      ?.getTracks()
      .forEach((t) => t.stop());

    Object.values(
      peersRef.current
    ).forEach((peer) =>
      peer.close()
    );

    socket.disconnect();

    navigate("/home");

  };

  if (!localStream)

    return (
      <div className="h-screen flex items-center justify-center bg-black text-cyan-400 text-xl">
        Initializing camera...
      </div>
    );

  return (

    <>
      <style>
        {MEETING_CSS}
      </style>

      <div className="meeting-root">

        <div className="topbar">

          <div className="topbar-logo">

            MEETUP

            <span
              style={{
                opacity: 0.4,
              }}
            >
              {" "}
              AI
            </span>

          </div>

          <div className="topbar-meta">

            <span>
              {
                participants.length
              } participants
            </span>

            <div className="meeting-id-badge">
              {code}
            </div>

            <span>
              {formatTime()}
            </span>

            <button
              onClick={toggleAI}

              style={{
                padding:
                  "4px 14px",

                borderRadius: 6,

                border:
                  "1px solid",

                fontSize: 11,

                fontWeight: 700,

                cursor: "pointer",

                background:
                  aiActive
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.1)",

                color:
                  aiActive
                    ? "#22c55e"
                    : "#ef4444",
              }}
            >

              {aiActive
                ? "🤖 AI ON"
                : "🛑 AI OFF"}

            </button>

          </div>

        </div>

        <div className="main-layout">

          <VideoGrid
            localStream={
              localStream
            }

            remoteStreams={
              remoteStreams
            }

            localName={
              profileName ||
              user.displayName ||
              user.email
            }

            micOn={micOn}

            camOn={camOn}

            aiActive={
              aiActive
            }

            user={{
              ...user,
              photoURL:
                profileImageRef.current,
            }}

            meetingCode={code}

            onAlert={addAlert}
          />

          <div
            className={`sidebar ${
              sidebarOpen
                ? ""
                : "closed"
            }`}
          >

            {sidebarOpen && (

              <>
                {sidebarTab ===
                  "chat" && (

                  <ChatBox
                    messages={messages}
                    setMessages={setMessages}

                    socket={
                      socket
                    }

                    roomId={
                      code
                    }

                    user={
                      profileName ||
                      user.displayName ||
                      "You"
                    }

                    onAlert={
                      addAlert
                    }
                  />

                )}

                {sidebarTab ===
                  "people" && (

                  <Participants
                    participants={
                      participants
                    }
                  />

                )}

              </>

            )}

            <AlertPanel
              alerts={alerts}
            />

          </div>

        </div>

        <ControlBar
          micOn={micOn}

          camOn={camOn}

          onToggleMic={
            handleToggleMic
          }

          onToggleCam={
            handleToggleCam
          }

          onShareScreen={
            startScreenShare
          }

          onLeave={
            leaveMeeting
          }

          toggleChat={() =>
            toggleSidebar(
              "chat"
            )
          }

          toggleParticipants={() =>
            toggleSidebar(
              "people"
            )
          }

          sidebarTab={
            sidebarTab
          }

          sidebarOpen={
            sidebarOpen
          }

          timer={
            formatTime()
          }
        />

      </div>

    </>

  );

}