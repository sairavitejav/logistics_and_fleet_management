# 🧪 Complete Testing Guide

## Prerequisites
- Backend server running on port 5000
- Frontend running on port 5173
- MongoDB connected
- At least 2 browser windows/tabs for testing

---

## 🎯 Feature 1: Admin License Viewer

### Setup:
1. Create a driver account
2. Login as driver
3. Add a vehicle with license details:
   - Upload license image
   - Enter license number
   - Enter expiry date
   - Enter vehicle plate number

### Test Steps:
1. **Login as Admin**
   - Navigate to Vehicle Management section
   
2. **View Pending Vehicles**
   - Should see the vehicle submitted by driver
   - Status should be "pending"
   
3. **Click "View License Details"**
   - Modal should open
   - Should display:
     - ✅ Vehicle make and model
     - ✅ License plate number
     - ✅ Vehicle type
     - ✅ Owner name
     - ✅ License number
     - ✅ License expiry date
     - ✅ License image (full size)
   
4. **Approve from Modal**
   - Click "Approve" button in modal
   - Modal should close
   - Vehicle status should update to "approved"
   - Toast notification should appear
   
5. **Test Reject**
   - Add another vehicle as driver
   - Open license details modal
   - Click "Reject"
   - Vehicle status should update to "rejected"

### Expected Results:
✅ All vehicle and license details visible
✅ License image displays correctly
✅ Approve/Reject buttons work
✅ Modal closes after action
✅ Status updates in real-time

---

## 🎯 Feature 2: Ride End/Cancel Functionality

### Part A: Driver Complete Ride

#### Setup:
1. Login as customer
2. Book a ride
3. Login as driver (different browser/tab)
4. Accept the ride

#### Test Steps:
1. **As Driver - Navigate to Ride History**
   - Should see the accepted ride
   - Status should be "accepted" or "on_route"
   
2. **Click "Complete Ride" Button**
   - Button should show loading state
   - After completion:
     - ✅ Success toast appears
     - ✅ Ride status changes to "delivered"
     - ✅ Driver status becomes "online"
     - ✅ Vehicle status becomes "available"
   
3. **As Customer - Check Notification**
   - Should receive real-time notification
   - Toast: "Your ride has been completed!"
   - Ride should disappear from active rides

#### Test Edge Cases:
- ❌ Try completing another driver's ride (should fail)
- ❌ Try completing already completed ride (should fail)
- ❌ Try completing cancelled ride (should fail)

### Part B: Customer Cancel Ride

#### Setup:
1. Login as customer
2. Book a ride

#### Test Steps:
1. **Navigate to Track Ride**
   - Should see active ride
   - Status should be "pending" or "accepted"
   - "Cancel Ride" button should be visible
   
2. **Click "Cancel Ride"**
   - Confirmation dialog should appear
   - Click "OK" to confirm
   - Button should show loading state
   - After cancellation:
     - ✅ Success toast appears
     - ✅ Ride status changes to "cancelled"
     - ✅ Ride disappears from tracking view
   
3. **As Driver - Check Notification**
   - If ride was accepted, driver should receive notification
   - Driver status should become "online"
   - Vehicle status should become "available"

#### Test Edge Cases:
- ❌ Try cancelling ride with status "on_route" (should fail)
- ❌ Try cancelling ride with status "delivered" (should fail)
- ❌ Try cancelling another customer's ride (should fail)

### Expected Results:
✅ Driver can complete accepted/on_route rides
✅ Customer can cancel pending/accepted rides
✅ Real-time notifications work
✅ Status updates correctly
✅ Authorization prevents unauthorized actions

---

## 🎯 Feature 3: Vehicle Type Filtering

### Setup Phase:
Create multiple drivers with different vehicle types:

**Driver 1 (John):**
- Vehicle 1: Type = "bike", Status = "approved"
- Vehicle 2: Type = "auto", Status = "approved"

**Driver 2 (Sarah):**
- Vehicle 1: Type = "lorry", Status = "approved"

**Driver 3 (Mike):**
- Vehicle 1: Type = "auto", Status = "approved"
- Set status to "offline"

**Driver 4 (Lisa):**
- Vehicle 1: Type = "mini_truck", Status = "approved"

**Driver 5 (Tom):**
- Vehicle 1: Type = "bike", Status = "pending" (not approved)

### Test Scenario 1: Customer Books "Auto" Ride

#### Steps:
1. **Login as Customer**
2. **Book a Ride**
   - Select vehicle type: "auto"
   - Enter pickup and dropoff locations
   - Submit request

3. **Check Backend Console**
   - Should see: "📢 Sent auto delivery request to X matching drivers"
   - X should be 1 (only John, since Mike is offline)

4. **Check Driver Notifications**
   - ✅ John should receive notification (has auto, is online)
   - ❌ Sarah should NOT receive (has lorry, not auto)
   - ❌ Mike should NOT receive (has auto, but offline)
   - ❌ Lisa should NOT receive (has mini_truck, not auto)
   - ❌ Tom should NOT receive (has bike, not approved)

### Test Scenario 2: Driver Views Pending Rides

#### Steps:
1. **Login as John (has bike + auto)**
   - Navigate to Pending Rides
   - Should see rides requiring: bike OR auto
   - Should NOT see rides requiring: lorry OR mini_truck

2. **Login as Sarah (has lorry)**
   - Navigate to Pending Rides
   - Should see rides requiring: lorry only
   - Should NOT see rides requiring: bike, auto, mini_truck

3. **Login as Tom (has bike, but not approved)**
   - Navigate to Pending Rides
   - Should see: Empty list (no approved vehicles)

4. **Check Backend Console**
   - Should see: "📋 Driver [ID] has vehicle types: [types], found X matching rides"

### Test Scenario 3: Accept Ride Validation

#### Setup:
- Customer books "auto" ride
- John (has bike + auto) receives notification

#### Steps:
1. **John Accepts with Correct Vehicle**
   - Select auto vehicle
   - Click accept
   - ✅ Should succeed
   - Ride status → "accepted"

2. **Create Another "Auto" Ride**
3. **John Tries to Accept with Wrong Vehicle**
   - Select bike vehicle (wrong type)
   - Click accept
   - ❌ Should fail with error
   - Error message: "This ride requires a auto but you selected a bike"

### Test Scenario 4: Multiple Vehicle Types

#### Setup:
- John has both bike and auto (approved)
- Customer 1 books bike ride
- Customer 2 books auto ride
- Customer 3 books lorry ride

#### Expected Results:
- ✅ John receives notifications for bike and auto rides
- ❌ John does NOT receive notification for lorry ride
- ✅ John's pending rides list shows both bike and auto rides
- ❌ John's pending rides list does NOT show lorry ride

### Test Scenario 5: Real-time Updates

#### Steps:
1. **John is viewing Pending Rides page**
2. **Customer books "auto" ride**
3. **Check John's Screen**
   - ✅ New ride should appear in list immediately (Socket.IO)
   - ✅ Toast notification: "New ride request available!"
   - ✅ Ride should match John's vehicle types

### Expected Results Summary:
✅ Only drivers with matching vehicle types receive notifications
✅ Pending rides list filtered by driver's vehicle types
✅ Cannot accept ride with wrong vehicle type
✅ Real-time notifications work correctly
✅ Offline drivers don't receive notifications
✅ Unapproved vehicles don't count for filtering

---

## 🔍 Debugging Tips

### Check Backend Console:
Look for these log messages:
```
📢 Sent [vehicleType] delivery request to X matching drivers
📋 Driver [ID] has vehicle types: [types], found X matching rides
```

### Check Frontend Console:
- Socket.IO connection status
- API request/response logs
- Error messages

### Check MongoDB:
```javascript
// Check vehicle types
db.vehicles.find({ approvalStatus: "approved" }, { driver: 1, type: 1 })

// Check driver status
db.users.find({ role: "driver" }, { name: 1, driverStatus: 1 })

// Check pending rides
db.deliveries.find({ status: "pending" }, { vehicleType: 1, customer: 1 })
```

### Common Issues:

**Issue 1: Driver not receiving notifications**
- Check: Is driver online? (`driverStatus: "online"`)
- Check: Does driver have approved vehicle of matching type?
- Check: Is Socket.IO connected? (check browser console)

**Issue 2: Pending rides list empty**
- Check: Does driver have any approved vehicles?
- Check: Are there any pending rides in database?
- Check: Do pending rides match driver's vehicle types?

**Issue 3: Cannot accept ride**
- Check: Is ride still pending?
- Check: Does selected vehicle match ride's vehicleType?
- Check: Is vehicle approved?

---

## 📊 Test Results Checklist

### Feature 1: Admin License Viewer
- [ ] License details modal opens
- [ ] All information displays correctly
- [ ] License image loads properly
- [ ] Approve button works
- [ ] Reject button works
- [ ] Modal closes after action
- [ ] Status updates in real-time

### Feature 2: Ride End/Cancel
- [ ] Driver can complete accepted rides
- [ ] Driver can complete on_route rides
- [ ] Customer receives completion notification
- [ ] Customer can cancel pending rides
- [ ] Customer can cancel accepted rides
- [ ] Customer cannot cancel on_route rides
- [ ] Customer cannot cancel delivered rides
- [ ] Driver receives cancellation notification
- [ ] Driver status updates correctly
- [ ] Vehicle status updates correctly
- [ ] Authorization checks work

### Feature 3: Vehicle Type Filtering
- [ ] Socket.IO notifications filtered by vehicle type
- [ ] Pending rides list filtered by vehicle type
- [ ] Accept ride validates vehicle type
- [ ] Offline drivers don't receive notifications
- [ ] Unapproved vehicles don't count
- [ ] Multiple vehicle types work correctly
- [ ] Real-time updates work
- [ ] Console logs show correct filtering

---

## 🎉 Success Criteria

All features are working correctly if:
1. ✅ Admin can view complete license details before approval
2. ✅ Drivers can complete rides and customers are notified
3. ✅ Customers can cancel rides and drivers are notified
4. ✅ Drivers only see rides matching their vehicle types
5. ✅ Real-time notifications work for all events
6. ✅ Authorization prevents unauthorized actions
7. ✅ Status updates are consistent across the system

---

## 📝 Bug Report Template

If you find any issues, report them using this format:

```
**Feature:** [Feature name]
**Issue:** [Brief description]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Console Errors:** [Any error messages]
**Screenshots:** [If applicable]
```

---

**Happy Testing! 🚀**