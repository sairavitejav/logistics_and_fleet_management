// 🔥 Socket.IO utility for real-time communication
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace('/api', '');

console.log('🔌 Socket Configuration:', {
  API_BASE_URL,
  SOCKET_URL,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL
});

let socket = null;

export const initSocket = () => {
  if (!socket) {
    console.log('🔌 Initializing Socket.IO connection to:', SOCKET_URL);
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
      console.error('❌ Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
    });
  }
  return socket;
};

export const connectSocket = (userId, role) => {
  try {
    if (!socket) {
      socket = initSocket();
    }
    
    console.log('🔌 Attempting to connect socket for user:', userId, 'role:', role);
    
    // Remove existing listeners to prevent duplicates
    socket.off('connect');
    socket.off('connect_error');
    
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', socket.id);
      socket.emit('join', { userId, role });
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Failed to connect socket:', error.message);
      // Don't throw error, just log it - let the app continue working
    });
    
    socket.connect();
    
    return socket;
  } catch (error) {
    console.error('❌ Error in connectSocket:', error);
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