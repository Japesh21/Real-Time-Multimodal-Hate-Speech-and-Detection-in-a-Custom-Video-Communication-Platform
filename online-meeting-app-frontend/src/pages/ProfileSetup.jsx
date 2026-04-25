import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../ui/AuthLayout";
import axios from "axios";
import { auth } from "../services/firebase";

export default function ProfileSetup() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);

  // ===============================
  // PREVENT MULTIPLE SUBMITS
  // ===============================

  const [loading, setLoading] = useState(false);

  const handleLogoChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setLogo(file);

    setPreview(
      URL.createObjectURL(file)
    );

  };

  const handleContinue = async () => {

    // ===============================
    // STOP MULTIPLE CLICKS
    // ===============================

    if (loading) return;

    if (!name || !logo) {

      alert(
        "Please enter name and upload logo"
      );

      return;

    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append(
        "googleId",
        auth.currentUser.uid
      );

      formData.append(
        "name",
        name
      );

      formData.append(
        "logo",
        logo
      );

      await axios.post(

        "http://localhost:5000/api/profile/setup",

        formData

      );

      navigate("/home");

    } catch (err) {

      console.log(
        "PROFILE SETUP ERROR:",
        err
      );

      alert(
        "Failed to setup profile"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <AuthLayout>

      <div className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl px-8 py-10 shadow-2xl">

        <h2 className="text-2xl font-semibold text-white mb-6">

          Complete your profile

        </h2>

        {/* NAME INPUT */}

        <input
          type="text"

          placeholder="Enter your name"

          value={name}

          onChange={(e) =>
            setName(e.target.value)
          }

          className="
            w-full
            px-4 py-3
            rounded-xl
            bg-white/20
            text-white
            placeholder-white/50
            outline-none
            mb-4
          "
        />

        {/* LOGO UPLOAD */}

        <label className="block text-white/70 text-sm mb-2">

          Upload logo

        </label>

        <input
          type="file"

          accept="image/*"

          onChange={handleLogoChange}

          className="
            w-full
            text-white
            text-sm
            mb-4
          "
        />

        {/* IMAGE PREVIEW */}

        {preview && (

          <div className="flex justify-center mb-6">

            <div
              className="
                w-full
                max-w-[260px]
                h-[260px]

                bg-black/30

                rounded-2xl

                overflow-hidden

                flex
                items-center
                justify-center

                border
                border-white/10
              "
            >

              <img

                src={preview}

                alt="preview"

                className="
                  w-full
                  h-full
                  object-contain
                "
              />

            </div>

          </div>

        )}

        {/* BUTTON */}

        <button

          onClick={handleContinue}

          disabled={
            loading ||
            !name ||
            !logo
          }

          className="
            w-full
            py-3
            rounded-xl
            bg-cyan-400
            text-black
            font-semibold
            hover:bg-cyan-300
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          {loading
            ? "Uploading..."
            : "Continue"}

        </button>

      </div>

    </AuthLayout>

  );

}