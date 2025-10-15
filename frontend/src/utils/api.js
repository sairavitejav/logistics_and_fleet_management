// 🔥 API utility for making HTTP requests
const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create headers with authorization
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// Generic fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    let data = null;

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      const errorMessage = data?.message || 'Something went wrong';
      throw new Error(errorMessage);
    }

    return data ?? null;
  } catch (error) {
    throw error;
  }
};

// Auth APIs
export const authAPI = {
  register: (userData) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  login: (credentials) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  getCurrentUser: () => fetchAPI('/auth/current-user'),

  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/auth/users${query ? `?${query}` : ''}`);
  },

  updateUserRole: (id, role) => fetchAPI(`/auth/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  }),

  toggleUserStatus: (id, isActive) => fetchAPI(`/auth/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive })
  })
};

// Vehicle APIs
export const vehicleAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/vehicles${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => fetchAPI(`/vehicles/${id}`),
  
  add: (vehicleData) => fetchAPI('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData)
  }),
  
  updateApproval: (id, approvalStatus) => fetchAPI(`/vehicles/${id}/approval`, {
    method: 'PUT',
    body: JSON.stringify({ approvalStatus })
  }),
  
  updateStatus: (id, status) => fetchAPI(`/vehicles/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  
  delete: (id) => fetchAPI(`/vehicles/${id}`, {
    method: 'DELETE'
  })
};

// Delivery/Ride APIs
export const deliveryAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/deliveries${query ? `?${query}` : ''}`);
  },
  
  getPending: () => fetchAPI('/deliveries/pending'),
  
  // 🔥 ALIAS: Get pending rides for drivers (same as getPending)
  getPendingRides: () => fetchAPI('/deliveries/pending'),
  
  request: (rideData) => fetchAPI('/deliveries/request', {
    method: 'POST',
    body: JSON.stringify(rideData)
  }),
  
  create: (deliveryData) => fetchAPI('/deliveries', {
    method: 'POST',
    body: JSON.stringify(deliveryData)
  }),
  
  accept: (id, vehicleId) => fetchAPI(`/deliveries/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ vehicleId })
  }),
  
  // 🔥 NEW: Accept ride (Driver)
  acceptRide: (id, vehicleId) => fetchAPI(`/deliveries/${id}/accept`, {
    method: 'POST',
    body: JSON.stringify({ vehicleId })
  }),
  
  updateStatus: (id, status) => fetchAPI(`/deliveries/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  
  track: (id) => fetchAPI(`/deliveries/${id}/track`),
  
  updateDriverLocation: (latitude, longitude) => fetchAPI('/deliveries/driver/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude })
  }),
  
  updateDriverStatus: (status) => fetchAPI('/deliveries/driver/status', {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  
  // 🔥 NEW: Complete ride (Driver)
  completeRide: (id) => fetchAPI(`/deliveries/${id}/complete`, {
    method: 'PUT'
  }),
  
  // 🔥 NEW: Cancel ride (Customer)
  cancelRide: (id) => fetchAPI(`/deliveries/${id}/cancel`, {
    method: 'PUT'
  }),
  
  // 🔥 NEW: Get driver statistics
  getDriverStatistics: (period = 'month') => fetchAPI(`/deliveries/driver/statistics?period=${period}`)
};

export default {
  authAPI,
  vehicleAPI,
  deliveryAPI
};