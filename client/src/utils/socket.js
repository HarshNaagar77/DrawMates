import { io } from "socket.io-client";
const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const socket = io(backendUrl, {
	transports: ['websocket'],
	withCredentials: true
});
export default socket;