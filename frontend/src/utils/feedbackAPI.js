import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://logistics-and-fleet-management-backend.onrender.com/api';

// Create axios instance with default config
const feedbackAPI = axios.create({
  baseURL: `${API_BASE_URL}/feedback`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
feedbackAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
feedbackAPI.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    throw new Error(message);
  }
);

export const feedbackService = {
  // Create feedback for a ride
  createFeedback: async (feedbackData) => {
    return await feedbackAPI.post('/', feedbackData);
  },

  // Check if a ride can be rated
  canRateRide: async (rideId) => {
    return await feedbackAPI.get(`/can-rate/${rideId}`);
  },

  // Get feedback for a specific ride
  getRideFeedback: async (rideId) => {
    return await feedbackAPI.get(`/ride/${rideId}`);
  },

  // Get customer's own feedback
  getMyFeedback: async (page = 1, limit = 10) => {
    return await feedbackAPI.get(`/my-feedback?page=${page}&limit=${limit}`);
  },

  // Get driver's feedback (for drivers and admins)
  getDriverFeedback: async (driverId, page = 1, limit = 10) => {
    return await feedbackAPI.get(`/driver/${driverId}?page=${page}&limit=${limit}`);
  },

  // Get all feedback (admin only)
  getAllFeedback: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return await feedbackAPI.get(`/all?${params}`);
  },

  // Admin response to feedback
  respondToFeedback: async (feedbackId, message) => {
    return await feedbackAPI.put(`/respond/${feedbackId}`, { message });
  }
};

export default feedbackService;
