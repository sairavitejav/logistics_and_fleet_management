// 🔥 Socket.IO utility for real-time communication
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace('/api', '');


let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      forceNew: true
    });

    // Add error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      // Silent disconnect handling
    });

    socket.on('reconnect', (attemptNumber) => {
      // Silent reconnect handling
    });
  }
  return socket;
};

export const connectSocket = (userId, role) => {
  try {
    if (!socket) {
      socket = initSocket();
    }
    
    // Remove existing listeners to prevent duplicates
    socket.off('connect');
    socket.off('connect_error');
    
    socket.on('connect', () => {
      socket.emit('join', { userId, role });
    });
    
    socket.on('connect_error', (error) => {
      // Silent error handling - let the app continue working
    });
    
    socket.connect();
    
    return socket;
  } catch (error) {
    console.error('Error in connectSocket:', error);
    return null;
  }
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