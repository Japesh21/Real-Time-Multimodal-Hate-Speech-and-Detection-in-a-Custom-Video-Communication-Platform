import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import axios from "axios";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import Meeting from "./pages/Meeting";

const BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://meeting-backend-v3xj.onrender.com";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("AUTH STATE:", u);

      if (u) {
        try {
          const res = await axios.post(
            `${BASE_URL}/api/auth/google-login`,
            { googleId: u.uid, email: u.email }
          );
          console.log("BACKEND:", res.data);
          setProfileStatus(res.data.status);
        } catch (err) {
          console.log("Backend error:", err);
        }
      }

      setUser(u ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/home" replace />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" replace />} />
        <Route path="/profile-setup" element={user ? <ProfileSetup /> : <Navigate to="/login" replace />} />
        <Route path="/home" element={
          user
            ? profileStatus === "READY"
              ? <Home user={user} />
              : <Navigate to="/profile-setup" replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="/meeting/:code" element={
          user
            ? profileStatus === "READY"
              ? <Meeting user={user} />
              : <Navigate to="/profile-setup" replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}