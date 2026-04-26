import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { createMeeting, joinMeeting } from "../services/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://meeting-backend-v3xj.onrender.com";

export default function Home({ user }) {

  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [profile, setProfile] = useState(null);

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {

    if (!user?.uid) return;

    const loadProfile = async () => {

      try {

        const res = await axios.get(
          `${BASE_URL}/api/profile/${user.uid}`
        );

        if (res.data?.user) {
          setProfile(res.data.user);
        }

      } catch (err) {

        console.log(
          "PROFILE LOAD ERROR:",
          err
        );

        setProfile({

          name:
            user.displayName ||
            "User",

          email:
            user.email,

          logoURL: "",

        });

      }

    };

    loadProfile();

  }, [user]);

  if (!user) {

    return (

      <div className="h-screen flex items-center justify-center bg-black text-white">

        Loading user...

      </div>

    );

  }

  // =====================================
  // CREATE MEETING
  // =====================================

  const create = async () => {

    // =====================================
    // PREVENT MULTIPLE CLICKS
    // =====================================

    if (creating) return;

    try {

      setCreating(true);

      const res = await createMeeting(
        user.uid
      );

      const meetingCode =
        res.data.code;

      setToast({
        code: meetingCode
      });

      setTimeout(() => {

        navigate(
          `/meeting/${meetingCode}`
        );

      }, 2000);

    } catch (err) {

      console.log(
        "CREATE ERROR:",
        err
      );

      alert(
        "Failed to create meeting"
      );

    } finally {

      setCreating(false);

    }

  };

  // =====================================
  // JOIN MEETING
  // =====================================

  const join = async () => {

    try {

      const meetingCode =
        code.trim();

      if (
        meetingCode.length !== 4
      ) {

        alert(
          "Meeting code must be 4 digits"
        );

        return;

      }

      setJoining(true);

      const res =
        await joinMeeting(
          meetingCode,
          user.uid
        );

      navigate(
        `/meeting/${res.data.code}`
      );

    } catch (err) {

      console.log(
        "JOIN ERROR:",
        err
      );

      alert(
        "Meeting not found"
      );

    } finally {

      setJoining(false);

    }

  };

  // =====================================
  // COPY CODE
  // =====================================

  const copyCode = () => {

    if (!toast?.code) return;

    navigator.clipboard.writeText(
      toast.code
    );

    setCopied(true);

    setTimeout(() => {

      setCopied(false);

    }, 1500);

  };

  const displayName =
    profile?.name ||
    user.displayName ||
    "User";

  const initial =
    displayName[0]?.toUpperCase() ||
    "U";

  return (

    <div className="min-h-screen bg-[#050810] text-white">

      {/* HEADER */}

      <div className="flex items-center justify-between px-10 py-5 border-b border-white/10">

        <h1 className="text-2xl font-bold text-cyan-400">

          MeetUp AI

        </h1>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-3 bg-white/5 px-3 py-1 rounded-full">

            {profile?.logoURL ? (

              <img
                src={profile.logoURL}
                className="w-8 h-8 rounded-full object-cover"
                alt="avatar"
              />

            ) : (

              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold">

                {initial}

              </div>

            )}

            <span className="text-sm">

              {displayName}

            </span>

          </div>

          <button

            onClick={() =>
              signOut(auth)
            }

            className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600"

          >

            Logout

          </button>

        </div>

      </div>

      {/* MAIN */}

      <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}

        <div className="lg:col-span-2 bg-[#0f1424] rounded-2xl p-8 border border-white/10">

          <h2 className="text-xl font-semibold mb-8 text-emerald-300">

            Start or Join a Meeting

          </h2>

          <div className="mb-10">

            <button

              onClick={create}

              disabled={creating}

              className="px-8 py-4 rounded-xl bg-emerald-500 text-black font-bold text-lg hover:bg-emerald-400 transition disabled:opacity-50"

            >

              {creating
                ? "Creating..."
                : "+ Create Meeting"}

            </button>

          </div>

          <div className="flex items-center gap-3">

            <input

              type="text"

              inputMode="numeric"

              maxLength={4}

              value={code}

              onChange={(e) =>

                setCode(

                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4)

                )

              }

              placeholder="Enter 4-digit code"

              className="flex-1 p-3 rounded-lg border border-white/10 bg-black text-yellow-400 tracking-widest outline-none"

            />

            <button

              onClick={join}

              disabled={
                joining ||
                code.length !== 4
              }

              className="px-6 py-3 rounded-lg bg-violet-500 text-black font-semibold hover:bg-violet-400 transition disabled:opacity-50"

            >

              {joining
                ? "Joining..."
                : "Join"}

            </button>

          </div>

        </div>

        {/* RIGHT */}

        <div className="bg-[#0f1424] rounded-2xl p-8 border border-white/10">

          <h2 className="text-xl font-semibold mb-6 text-violet-300">

            Account

          </h2>

          <div className="flex items-center gap-4">

            {profile?.logoURL ? (

              <img
                src={profile.logoURL}
                className="w-16 h-16 rounded-full object-cover"
                alt="profile"
              />

            ) : (

              <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-2xl font-bold">

                {initial}

              </div>

            )}

            <div>

              <p className="font-semibold text-lg">

                {displayName}

              </p>

              <p className="text-sm text-gray-400">

                {profile?.email ||
                  user.email}

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* TOAST */}

      {toast && (

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0f1424] border border-cyan-500/30 px-6 py-3 rounded-xl flex items-center gap-4 shadow-xl">

          <span className="text-sm text-gray-400">

            Meeting code:

          </span>

          <span className="text-cyan-400 font-mono text-lg tracking-widest">

            {toast.code}

          </span>

          <button

            onClick={copyCode}

            className="px-3 py-1 text-xs bg-cyan-600 rounded hover:bg-cyan-500"

          >

            {copied
              ? "Copied"
              : "Copy"}

          </button>

        </div>

      )}

    </div>

  );

}