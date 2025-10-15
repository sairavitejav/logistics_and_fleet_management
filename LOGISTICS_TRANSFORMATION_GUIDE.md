# Logistics & Fleet Management Transformation Guide

## Overview
Transform the ride-sharing app into a logistics and fleet management system with weight-based vehicle selection.

## Changes Made

### 1. Backend - Vehicle Model (`backend/models/vehicle.js`)
✅ **COMPLETED**
- Changed vehicle types from `['bike', 'auto', 'car', 'van']` to `['bike', 'auto', 'mini_truck', 'lorry']`
- Renamed `capacity` to `weightCapacity` (in kg)

### 2. Frontend - DriverVehicles Component
✅ **PARTIALLY COMPLETED** - Needs completion
- Added `VEHICLE_CAPACITY` constant with weight mappings:
  - bike: 20 kg
  - auto: 100 kg
  - mini_truck: 500 kg
  - lorry: 2000 kg
- Removed `capacity` from formData state

**TODO**: Complete the following in `frontend/src/components/DriverVehicles.jsx`:

1. Update `handleSubmit` to auto-set weightCapacity:
```javascript
const vehicleData = {
  ...formData,
  weightCapacity: VEHICLE_CAPACITY[formData.type], // Auto-set based on type
  drivingLicense: {
    licenseNumber: formData.licenseNumber,
    expiryDate: formData.licenseExpiry,
    licenseImage: formData.licenseImage
  }
};
```

2. Remove capacity input field from the form (around line 336-348)

3. Update vehicle type options in the select dropdown (around line 313-317):
```javascript
<option value="bike">Bike (20 kg)</option>
<option value="auto">Auto (100 kg)</option>
<option value="mini_truck">Mini Truck (500 kg)</option>
<option value="lorry">Lorry (2000 kg)</option>
```

4. Update vehicle card display to show weight capacity (around line 220-223):
```javascript
<div className="detail-row">
  <span>Weight Capacity:</span>
  <strong>{vehicle.weightCapacity} kg</strong>
</div>
```

5. Reset formData after submission (remove capacity field from reset, around line 112-123)

### 3. Frontend - BookRide Component (`frontend/src/components/BookRide.jsx`)

**TODO**: Major updates needed:

1. Add delivery weight input field in step 1 or 2:
```javascript
const [deliveryWeight, setDeliveryWeight] = useState('');
```

2. Add weight input UI after location selection:
```javascript
<div className="form-group">
  <label htmlFor="deliveryWeight">Delivery Item Weight (kg)</label>
  <input
    type="number"
    id="deliveryWeight"
    value={deliveryWeight}
    onChange={(e) => setDeliveryWeight(e.target.value)}
    placeholder="Enter weight in kg"
    required
    min="1"
    className="input"
  />
</div>
```

3. Update vehicle selection (step 3) to show weight-based options:
```javascript
const VEHICLE_OPTIONS = [
  { type: 'bike', capacity: 20, icon: '🏍️', rate: 10 },
  { type: 'auto', capacity: 100, icon: '🛺', rate: 15 },
  { type: 'mini_truck', capacity: 500, icon: '🚚', rate: 25 },
  { type: 'lorry', capacity: 2000, icon: '🚛', rate: 40 }
];

// Filter vehicles based on delivery weight
const availableVehicles = VEHICLE_OPTIONS.filter(v => v.capacity >= parseFloat(deliveryWeight));
```

4. Update vehicle card display to show capacity:
```javascript
{availableVehicles.map((vehicle) => (
  <motion.div
    key={vehicle.type}
    className={`vehicle-card ${selectedVehicleType === vehicle.type ? 'selected' : ''} ${vehicle.capacity < parseFloat(deliveryWeight) ? 'disabled' : ''}`}
    onClick={() => vehicle.capacity >= parseFloat(deliveryWeight) && setSelectedVehicleType(vehicle.type)}
  >
    <div className="vehicle-icon">{vehicle.icon}</div>
    <h3>{vehicle.type.replace('_', ' ').toUpperCase()}</h3>
    <p className="vehicle-capacity">Max: {vehicle.capacity} kg</p>
    <p className="vehicle-price">₹{vehicle.rate}/km</p>
    {vehicle.capacity < parseFloat(deliveryWeight) && (
      <span className="capacity-warning">⚠️ Insufficient capacity</span>
    )}
  </motion.div>
))}
```

5. Update fare calculation to use new rates:
```javascript
const perKmRate = selectedVehicleType === 'bike' ? 10 : 
                  selectedVehicleType === 'auto' ? 15 : 
                  selectedVehicleType === 'mini_truck' ? 25 : 40;
```

6. Include deliveryWeight in the booking request:
```javascript
await deliveryAPI.request({
  pickupLocation: { ... },
  dropoffLocation: { ... },
  vehicleType: selectedVehicleType,
  deliveryWeight: parseFloat(deliveryWeight),
  distance,
  fare
});
```

### 4. Backend - Delivery Model (`backend/models/delivery.js`)

**TODO**: Add deliveryWeight field:
```javascript
deliveryWeight: {
    type: Number,
    required: true,
    min: 0
},
```

### 5. Backend - Vehicle Controller (`backend/controllers/vehicleController.js`)

**TODO**: Update vehicle creation to auto-set weightCapacity:
```javascript
const VEHICLE_CAPACITY = {
  bike: 20,
  auto: 100,
  mini_truck: 500,
  lorry: 2000
};

// In addVehicle function:
const weightCapacity = VEHICLE_CAPACITY[type] || 20;
const newVehicle = new Vehicle({
  ...vehicleData,
  weightCapacity
});
```

### 6. UI Text Updates

**TODO**: Update all references:
- "Ride" → "Delivery"
- "Passenger" → "Cargo/Load"
- "Book Ride" → "Request Delivery"
- "My Rides" → "My Deliveries"

### 7. CSS Updates (`frontend/src/styles/BookRide.css`)

**TODO**: Add styles for:
```css
.vehicle-capacity {
  font-size: 0.85rem;
  color: var(--gray);
  margin: 0.25rem 0;
}

.capacity-warning {
  display: block;
  font-size: 0.75rem;
  color: var(--danger);
  margin-top: 0.5rem;
}

.vehicle-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vehicle-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
```

## Testing Checklist

- [ ] Driver can add vehicle without entering capacity (auto-calculated)
- [ ] Vehicle types show: Bike, Auto, Mini Truck, Lorry (no Car)
- [ ] Customer sees weight input when booking delivery
- [ ] Only vehicles with sufficient capacity are selectable
- [ ] Vehicle cards show weight capacity (e.g., "Max: 100 kg")
- [ ] Fare calculation uses logistics rates
- [ ] Backend validates deliveryWeight field
- [ ] All "ride" terminology updated to "delivery"

## Priority Order

1. ✅ Backend vehicle model (DONE)
2. ⚠️ DriverVehicles component (IN PROGRESS - needs completion)
3. 🔴 BookRide component (CRITICAL - main customer flow)
4. 🔴 Delivery model update
5. 🔴 Vehicle controller update
6. 🟡 UI text updates
7. 🟡 CSS styling

## Notes

- Weight capacity is automatically determined by vehicle type
- Drivers don't input capacity - it's set by the system
- Customers choose vehicles based on their delivery item weight
- The system prevents booking if no vehicle can handle the weight
