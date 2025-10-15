# 🚛 Logistics and Fleet Management System

A comprehensive full-stack application for managing logistics operations, fleet vehicles, and ride bookings with real-time tracking capabilities.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [User Roles & Permissions](#user-roles--permissions)
- [Real-time Features](#real-time-features)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)

## 🌟 Project Overview

This is a modern logistics and fleet management platform that connects customers, drivers, and administrators in a seamless ecosystem. The system enables:

- **Customers** to book rides and track deliveries in real-time
- **Drivers** to manage their status, accept rides, and update locations
- **Administrators** to oversee vehicles, users, and system statistics

Built with a responsive design that works across all devices, featuring real-time updates via WebSocket connections.

## ✨ Features

### 🔐 Multi-Role Authentication System
- Secure JWT-based authentication
- Role-based access control (Admin, Driver, Customer)
- Protected routes and middleware

### 🚗 Vehicle Management
- Vehicle registration and approval system
- Real-time vehicle status tracking
- License verification and document management
- Fleet analytics and reporting

### 📦 Ride Management
- Interactive ride booking system
- Real-time ride tracking with maps
- Driver-customer communication
- Ride history and analytics

### 📊 Analytics Dashboard
- Comprehensive statistics for all user types
- Revenue tracking and reporting
- Performance metrics and insights
- Interactive charts and graphs

### 🔄 Real-Time Features
- Live location tracking
- Real-time notifications
- WebSocket-based updates
- Instant status synchronization

### 📱 Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Progressive Web App features

## 🛠 Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations and transitions
- **React Icons** - Beautiful icon library
- **Leaflet & React Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **Axios** - HTTP client for API calls
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB & Mongoose** - NoSQL database and ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting and formatting
- **Nodemon** - Auto-restart for development
- **Vite Dev Server** - Fast development experience

## 📁 Project Structure

```
Logistics_And_Fleet_Management/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── AdminRides.jsx
│   │   │   ├── AdminStats.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminVehicles.jsx
│   │   │   ├── BookRide.jsx
│   │   │   ├── DriverRideHistory.jsx
│   │   │   ├── DriverStatistics.jsx
│   │   │   ├── DriverVehicles.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── PendingRides.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RideHistory.jsx
│   │   │   ├── RideTracking.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ...
│   │   ├── pages/           # Main application pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CustomerDashboard.jsx
│   │   │   ├── DriverDashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── styles/          # CSS and styling files
│   │   ├── utils/           # Utility functions and API calls
│   │   ├── Context/         # React context providers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
│
├── backend/                  # Node.js backend API
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── deliveryController.js
│   │   └── vehicleController.js
│   ├── middleware/          # Authentication middleware
│   ├── models/              # MongoDB models
│   │   ├── user.js
│   │   ├── vehicle.js
│   │   ├── delivery.js
│   │   └── tracking.js
│   ├── routes/              # API route definitions
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   └── deliveries.js
│   ├── services/            # Business logic services
│   ├── sockets/             # Socket.IO handlers
│   ├── server.js            # Main server file
│   └── package.json
│
└── README.md                # Project documentation
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env` (if exists)
   - Update environment variables (see [Environment Variables](#environment-variables))

4. **Start MongoDB:**
   - Ensure MongoDB is running locally, or
   - Update connection string for MongoDB Atlas

5. **Start the server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

   Backend will run on `http://localhost:5001`

### Frontend Setup

1. **Open new terminal and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

4. **Access the application:**
   - Open browser and navigate to `http://localhost:5173`
   - Default credentials for testing may be available

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/logistics_db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://logistics-and-fleet-management-backend.onrender.com/api
VITE_SOCKET_URL=https://logistics-and-fleet-management-backend.onrender.com
```

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Vehicle Routes (`/api/vehicles`)
- `GET /` - Get all vehicles
- `GET /:id` - Get vehicle by ID
- `POST /` - Create new vehicle
- `PUT /:id` - Update vehicle
- `DELETE /:id` - Delete vehicle
- `PUT /:id/approve` - Approve vehicle
- `PUT /:id/reject` - Reject vehicle

### Delivery Routes (`/api/deliveries`)
- `GET /` - Get all deliveries
- `GET /:id` - Get delivery by ID
- `POST /` - Create new delivery
- `PUT /:id` - Update delivery
- `PUT /:id/status` - Update delivery status
- `PUT /:id/assign` - Assign delivery to driver

## 👥 User Roles & Permissions

### 🔐 Admin Role
- **Full System Access**
- **Vehicle Management:** Approve/reject vehicle registrations
- **User Management:** View and manage all users
- **Analytics:** Access comprehensive system statistics
- **Ride Oversight:** Monitor all rides and deliveries

### 🚗 Driver Role
- **Vehicle Management:** Register and manage personal vehicles
- **Ride Operations:** Accept rides, update status, manage deliveries
- **Location Tracking:** Real-time location updates
- **Earnings Tracking:** Personal statistics and earnings

### 👤 Customer Role
- **Ride Booking:** Book rides and select vehicles
- **Real-time Tracking:** Track delivery progress
- **Ride History:** View past rides and ratings
- **Profile Management:** Manage personal information

## 🔄 Real-Time Features

### WebSocket Events
- **User Connection:** Real-time user status updates
- **Location Updates:** Driver location broadcasting
- **Ride Status:** Instant ride status notifications
- **Vehicle Status:** Real-time vehicle availability

### Socket.IO Integration
```javascript
// Client-side connection
import io from 'socket.io-client';
const socket = io('https://logistics-and-fleet-management-backend.onrender.com');

// Join user room
socket.emit('join', { userId, role });

// Listen for location updates
socket.on('driver_location', (location) => {
  // Update map with new location
});
```

## 💻 Development Guidelines

### Code Style
- **ESLint** configuration for consistent code style
- **Responsive Design** principles for all components
- **Component-based Architecture** for reusability

### Git Workflow
1. Create feature branches: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -m "Add new feature"`
3. Push to remote: `git push origin feature/new-feature`
4. Create pull request for review

### Component Structure
```jsx
// Standard React component pattern
import React, { useState, useEffect } from 'react';

const ComponentName = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Side effects and API calls
  }, [dependencies]);

  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

## 🚀 Deployment

### Current Live Deployment

**🚛 Backend API:** `https://logistics-and-fleet-management-backend.onrender.com`

**🖥️ Frontend App:** *Deploy to Netlify/Vercel with the updated environment variables above*

### Backend Deployment (Render)
✅ **Deployed and Active**
- **Service URL:** `https://logistics-and-fleet-management-backend.onrender.com`
- **Status:** ✅ Live and operational
- **Database:** MongoDB Atlas (production)

### Frontend Deployment
1. **Deploy to Netlify or Vercel using the monorepo structure**
2. **Set environment variables:**
   ```env
   VITE_API_BASE_URL=https://logistics-and-fleet-management-backend.onrender.com/api
   VITE_SOCKET_URL=https://logistics-and-fleet-management-backend.onrender.com
   ```

### Database
- **MongoDB Atlas** for cloud database
- **Local MongoDB** for development
- Ensure proper connection strings in production

## 📞 Support & Contributing

For questions, issues, or contributions:
1. Check existing documentation
2. Review open issues on GitHub
3. Create detailed bug reports
4. Follow contribution guidelines

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**Built with ❤️ for modern logistics management**
