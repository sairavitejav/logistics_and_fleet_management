// 🔥 Socket.IO utility for real-time communication
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false
    });
  }
  return socket;
};

export const connectSocket = (userId, role) => {
  if (!socket) {
    socket = initSocket();
  }
  
  socket.connect();
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    socket.emit('join', { userId, role });
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();    
  }
};

export const getSocket = () => socket;

export default {
  initSocket,
  connectSocket,
  disconnectSocket,
  getSocket
};