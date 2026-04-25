import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export const createMeeting = (uid) => API.post("/meeting/create", { uid });
export const joinMeeting = (code, uid) => API.post("/meeting/join", { code, uid });