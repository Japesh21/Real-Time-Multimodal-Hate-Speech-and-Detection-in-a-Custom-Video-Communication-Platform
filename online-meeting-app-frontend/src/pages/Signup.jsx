import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../ui/AuthLayout";
import axios from "axios";

export default function Signup() {
  const navigate = useNavigate();

  const googleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("AUTH USER:", user);

      const res = await axios.post(
        "http://localhost:5000/api/auth/google-login",
        {
          googleId: user.uid,
          email: user.email
        }
      );

      console.log("API RESPONSE:", res.data);

      if (res.data.status === "READY") {
        navigate("/home");
      } else {
        navigate("/profile-setup");
      }

    } catch (err) {
      console.log("Signup error:", err);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl px-8 py-10 shadow-2xl">
        <h1 className="text-center text-3xl font-bold text-cyan-400 mb-8">
          MeetUp AI
        </h1>

        <h2 className="text-2xl font-semibold text-white">
          Create account
        </h2>

        <p className="text-white/50 text-sm mt-1">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>

        <button
          onClick={googleSignup}
          className="mt-8 w-[90%] mx-auto flex items-center justify-center gap-10
                     px-6 py-3.5 rounded-xl bg-white hover:bg-gray-200
                     text-black font-semibold transition"
        >
          <img src="/google.png" alt="google" className="auth-icon" />
          Sign up with Google
        </button>
      </div>
    </AuthLayout>
  );
}