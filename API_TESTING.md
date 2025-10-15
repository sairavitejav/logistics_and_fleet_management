# 🧪 API Testing Guide

## Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "customer"
}
```

**For Admin Registration:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "admin123",
  "phone": "1234567890",
  "role": "admin",
  "adminPin": "91827"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "Test User",
    "email": "test@example.com",
    "role": "customer",
    "phone": "1234567890"
  }
}
```

---

### 2. Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "Test User",
    "email": "test@example.com",
    "role": "customer"
  }
}
```

---

### 3. Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "user_id",
  "name": "Test User",
  "email": "test@example.com",
  "role": "customer",
  "phone": "1234567890"
}
```

---

## 🚗 Vehicle Endpoints

### 1. Get All Vehicles
**GET** `/vehicles`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (Optional):**
- `approvalStatus`: pending | approved | rejected
- `owner`: user_id

**Response:**
```json
[
  {
    "_id": "vehicle_id",
    "type": "bike",
    "model": "Honda Activa",
    "registrationNumber": "KA01AB1234",
    "color": "Black",
    "owner": {
      "_id": "user_id",
      "name": "Driver Name",
      "email": "driver@example.com"
    },
    "approvalStatus": "approved",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Add Vehicle
**POST** `/vehicles`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "bike",
  "model": "Honda Activa",
  "registrationNumber": "KA01AB1234",
  "color": "Black"
}
```

**Response:**
```json
{
  "_id": "vehicle_id",
  "type": "bike",
  "model": "Honda Activa",
  "registrationNumber": "KA01AB1234",
  "color": "Black",
  "owner": "user_id",
  "approvalStatus": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Update Vehicle Approval Status (Admin Only)
**PUT** `/vehicles/:id/approve`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "approvalStatus": "approved"
}
```

**Response:**
```json
{
  "_id": "vehicle_id",
  "approvalStatus": "approved",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Delete Vehicle
**DELETE** `/vehicles/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

---

## 🚕 Delivery (Ride) Endpoints

### 1. Get All Deliveries
**GET** `/deliveries`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters (Optional):**
- `status`: pending | accepted | on_route | completed | cancelled
- `customer`: user_id
- `driver`: user_id

**Response:**
```json
[
  {
    "_id": "delivery_id",
    "customer": {
      "_id": "customer_id",
      "name": "Customer Name",
      "phone": "1234567890"
    },
    "driver": {
      "_id": "driver_id",
      "name": "Driver Name",
      "phone": "9876543210"
    },
    "pickupLocation": {
      "address": "123 Main St",
      "coordinates": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "dropLocation": {
      "address": "456 Park Ave",
      "coordinates": {
        "lat": 12.9716,
        "lng": 77.5946
      }
    },
    "vehicleType": "bike",
    "fare": 50,
    "distance": 5.2,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Create Delivery (Book Ride)
**POST** `/deliveries`

**Headers:**
```
Authorization: Bearer <customer_token>
```

**Request Body:**
```json
{
  "pickupLocation": {
    "address": "123 Main St",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  },
  "dropLocation": {
    "address": "456 Park Ave",
    "coordinates": {
      "lat": 12.9816,
      "lng": 77.6046
    }
  },
  "vehicleType": "bike",
  "fare": 50,
  "distance": 5.2
}
```

**Response:**
```json
{
  "_id": "delivery_id",
  "customer": "customer_id",
  "pickupLocation": { ... },
  "dropLocation": { ... },
  "vehicleType": "bike",
  "fare": 50,
  "distance": 5.2,
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Accept Delivery (Driver)
**PUT** `/deliveries/:id/accept`

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Request Body:**
```json
{
  "vehicleId": "vehicle_id"
}
```

**Response:**
```json
{
  "_id": "delivery_id",
  "driver": "driver_id",
  "vehicle": "vehicle_id",
  "status": "accepted",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Delivery Status
**PUT** `/deliveries/:id/status`

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Request Body:**
```json
{
  "status": "on_route"
}
```

**Valid Status Values:**
- `pending`
- `accepted`
- `on_route`
- `completed`
- `cancelled`

**Response:**
```json
{
  "_id": "delivery_id",
  "status": "on_route",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Update Driver Location
**PUT** `/deliveries/:id/location`

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Request Body:**
```json
{
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  }
}
```

**Response:**
```json
{
  "_id": "delivery_id",
  "driverLocation": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 6. Get Delivery by ID
**GET** `/deliveries/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "delivery_id",
  "customer": { ... },
  "driver": { ... },
  "vehicle": { ... },
  "pickupLocation": { ... },
  "dropLocation": { ... },
  "driverLocation": { ... },
  "status": "on_route",
  "fare": 50,
  "distance": 5.2,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 📊 Admin Statistics Endpoint

### Get System Statistics
**GET** `/deliveries/stats/admin`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "totalRides": 150,
  "totalVehicles": 45,
  "totalRevenue": 7500,
  "pendingApprovals": 5,
  "activeRides": 12,
  "completedRides": 138
}
```

---

## 🔌 Socket.IO Events

### Client → Server Events

#### 1. Join Room
```javascript
socket.emit('join', {
  userId: 'user_id',
  role: 'customer' // or 'driver' or 'admin'
});
```

#### 2. Update Driver Location
```javascript
socket.emit('update_location', {
  deliveryId: 'delivery_id',
  location: {
    lat: 12.9716,
    lng: 77.5946
  }
});
```

---

### Server → Client Events

#### 1. New Ride Request (to all online drivers)
```javascript
socket.on('new_ride_request', (data) => {
  // data contains ride details
  console.log('New ride:', data);
});
```

#### 2. Ride Status Update (to customer)
```javascript
socket.on('ride_status_update', (data) => {
  // data contains updated status
  console.log('Status:', data.status);
});
```

#### 3. Driver Location Update (to customer)
```javascript
socket.on('driver_location', (location) => {
  // location contains lat, lng
  console.log('Driver at:', location);
});
```

#### 4. Ride Accepted (to customer)
```javascript
socket.on('ride_accepted', (data) => {
  // data contains driver and vehicle details
  console.log('Driver accepted:', data);
});
```

---

## 🧪 Testing with cURL

### Register Customer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "customer@test.com",
    "password": "customer123",
    "phone": "1234567890",
    "role": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "customer123"
  }'
```

### Get Vehicles (with token)
```bash
curl -X GET http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Book Ride
```bash
curl -X POST http://localhost:5000/api/deliveries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLocation": {
      "address": "123 Main St",
      "coordinates": {"lat": 12.9716, "lng": 77.5946}
    },
    "dropLocation": {
      "address": "456 Park Ave",
      "coordinates": {"lat": 12.9816, "lng": 77.6046}
    },
    "vehicleType": "bike",
    "fare": 50,
    "distance": 5.2
  }'
```

---

## 🔒 Authorization Rules

### Customer Can:
- ✅ Create deliveries (book rides)
- ✅ View their own deliveries
- ✅ View all vehicles (approved only)
- ❌ Accept deliveries
- ❌ Approve vehicles

### Driver Can:
- ✅ Add vehicles
- ✅ View their own vehicles
- ✅ Accept deliveries
- ✅ Update delivery status
- ✅ Update driver location
- ✅ View deliveries assigned to them
- ❌ Approve vehicles

### Admin Can:
- ✅ View all vehicles
- ✅ Approve/reject vehicles
- ✅ View all deliveries
- ✅ View system statistics
- ✅ Manage users (future feature)
- ✅ Everything customers and drivers can do

---

## 📝 Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, token failed"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized as admin"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error message"
}
```

---

## 🎯 Testing Checklist

- [ ] Register admin with correct PIN
- [ ] Register driver without PIN
- [ ] Register customer without PIN
- [ ] Login with all three roles
- [ ] Driver adds vehicle (should be pending)
- [ ] Admin approves vehicle
- [ ] Customer books ride
- [ ] Driver accepts ride
- [ ] Driver updates status to on_route
- [ ] Driver updates location
- [ ] Customer sees real-time updates
- [ ] Driver completes ride
- [ ] Admin views statistics
- [ ] Test all filters (status, role, etc.)
- [ ] Test Socket.IO real-time events

---

## 🛠️ Postman Collection

You can import this into Postman for easier testing:

1. Create a new collection called "Ride Booking API"
2. Add environment variables:
   - `base_url`: http://localhost:5000/api
   - `token`: (will be set after login)
3. Add all endpoints from above
4. Use `{{base_url}}` and `{{token}}` in requests

---

**Happy Testing! 🚀**