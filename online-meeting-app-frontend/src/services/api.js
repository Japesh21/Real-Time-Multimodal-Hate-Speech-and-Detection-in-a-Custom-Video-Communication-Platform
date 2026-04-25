import axios from "axios";

const BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://meeting-backend-v3xj.onrender.com/api";

const API = axios.create({
  baseURL: BASE_URL,
});

export const createMeeting = (uid) =>
  API.post("/meeting/create", { uid });

export const joinMeeting = (code, uid) =>
  API.post("/meeting/join", {
    code,
    uid,
  });