import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://meeting-backend-v3xj.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
});

export default socket;