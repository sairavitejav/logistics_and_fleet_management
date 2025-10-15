import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaMapPin, FaCar, FaSpinner, FaSearch } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { deliveryAPI, vehicleAPI } from '../utils/api';
import { useToast } from './Toast'; 
import 'leaflet/dist/leaflet.css';
import '../styles/BookRide.css';

// Fix for default marker icon
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition, label }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>{label}</Popup>
    </Marker>
  ) : null;
};
const BookRide = ({ onBookingSuccess }) => {
  const { showToast } = useToast(); 
  const [step, setStep] = useState(1);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]); // Hyderabad coordinates 
  const mapRef = useRef(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // Vehicle options with weight capacity (in kg)
  const VEHICLE_OPTIONS = [
    { type: 'bike', capacity: 20, icon: '🏍️', rate: 10, label: 'Bike', isCustomIcon: false },
    { type: 'auto', capacity: 100, icon: '🛺', rate: 15, label: 'Auto', isCustomIcon: false },
    { type: 'mini_truck', capacity: 500, icon: '🚚', rate: 25, label: 'Mini Truck', isCustomIcon: false },
    { type: 'lorry', capacity: 2000, icon: '🚛', rate: 40, label: 'Lorry', isCustomIcon: false }
  ];

  // 🔥 NEW: Search location using Nominatim (OpenStreetMap)
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      console.log('🔍 Searching for location:', query);

      // Try multiple approaches to handle CORS and API issues
      let data = null;

      // Approach 1: Use CORS proxy
      try {
        const proxyResponse = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1&dedupe=1`)}`
        );

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          data = JSON.parse(proxyData.contents);
        }
      } catch (proxyError) {
        console.warn('CORS proxy failed:', proxyError);
      }

      // Approach 2: Direct API call (might be blocked by CORS in some browsers)
      if (!data) {
        try {
          const directResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1&dedupe=1`,
            {
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            }
          );

          if (directResponse.ok) {
            data = await directResponse.json();
          }
        } catch (directError) {
          console.warn('Direct API call failed:', directError);
        }
      }

      // Approach 3: Alternative geocoding service (fallback)
      if (!data || !Array.isArray(data)) {
        try {
          const fallbackResponse = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=demo&limit=5`
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            data = fallbackData.results?.map(result => ({
              lat: result.geometry.lat,
              lon: result.geometry.lng,
              display_name: result.formatted,
              place_id: result.place_id
            })) || [];
          }
        } catch (fallbackError) {
          console.warn('Fallback service failed:', fallbackError);
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        console.log('✅ Location search successful:', data.length, 'results');
      } else {
        setSearchResults([]);
        console.warn('⚠️ No search results found for:', query);
      }

    } catch (error) {
      console.error('❌ Location search failed:', error);
      showToast('Location search failed. Please check your internet connection and try again.', 'error');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch route when both pickup and drop locations are selected
  useEffect(() => {
    if (pickupLocation && dropLocation) {
      fetchRoute(pickupLocation, dropLocation);
    } else {
      setRouteCoordinates([]);
    }
  }, [pickupLocation, dropLocation]);

  // Fetch route between pickup and drop locations using OSRM
  const fetchRoute = async (pickup, drop) => {
    if (!pickup || !drop) {
      setRouteCoordinates([]);
      return;
    }

    setRouteLoading(true);
    try {
      // OSRM API expects coordinates as longitude,latitude
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
        const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRouteCoordinates(coords);
      } else {
        // Fallback to straight line if routing fails
        setRouteCoordinates([pickup, drop]);
      }
    } catch (error) {
      console.error('Route fetch failed:', error);
      // Fallback to straight line
      setRouteCoordinates([pickup, drop]);
    } finally {
      setRouteLoading(false);
    }
  };

  // Select location from search results
  const selectSearchResult = (result) => {
    try {
      console.log('📍 Selecting location:', result);

      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lon)) {
        console.error('❌ Invalid coordinates:', result.lat, result.lon);
        showToast('Invalid location data. Please try another location.', 'error');
        return;
      }

      const address = result.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      if (step === 1) {
        setPickupLocation([lat, lon]);
        setPickupAddress(address);
        setMapCenter([lat, lon]);
        console.log('✅ Pickup location set:', [lat, lon]);
      } else if (step === 2) {
        setDropLocation([lat, lon]);
        setDropAddress(address);
        setMapCenter([lat, lon]);
        console.log('✅ Drop location set:', [lat, lon]);
      }

      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('❌ Error selecting location:', error);
      showToast('Failed to select location. Please try again.', 'error');
    }
  };

  const calculateFare = () => {
    if (!pickupLocation || !dropLocation) return 0;
    
    // Simple distance calculation (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = (dropLocation[0] - pickupLocation[0]) * Math.PI / 180;
    const dLon = (dropLocation[1] - pickupLocation[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupLocation[0] * Math.PI / 180) * Math.cos(dropLocation[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Base fare calculation with logistics rates
    const baseFare = 50;
    const vehicle = VEHICLE_OPTIONS.find(v => v.type === selectedVehicleType);
    const perKmRate = vehicle ? vehicle.rate : 10;
    
    return Math.round(baseFare + (distance * perKmRate));
  };

  const handleBookRide = async () => {
    if (!pickupLocation || !dropLocation || !selectedVehicleType) {
      showToast('Please select pickup, drop locations and vehicle type', 'warning');
      return;
    }

    setLoading(true);
    try {
      const distance = calculateDistance();
      const fare = calculateFare();
      
      // Get vehicle capacity based on selected type
      const vehicle = VEHICLE_OPTIONS.find(v => v.type === selectedVehicleType);
      const deliveryWeight = vehicle ? vehicle.capacity : 0;

      // 🔥 FIXED: Match backend schema structure (pickupLocation.location.coordinates)
      await deliveryAPI.request({
        pickupLocation: {
          address: pickupAddress || `${pickupLocation[0].toFixed(4)}, ${pickupLocation[1].toFixed(4)}`,
          location: {
            type: 'Point',
            coordinates: [pickupLocation[1], pickupLocation[0]] // [longitude, latitude]
          }
        },
        dropoffLocation: {
          address: dropAddress || `${dropLocation[0].toFixed(4)}, ${dropLocation[1].toFixed(4)}`,
          location: {
            type: 'Point',
            coordinates: [dropLocation[1], dropLocation[0]] // [longitude, latitude]
          }
        },
        vehicleType: selectedVehicleType,
        deliveryWeight,
        distance,
        fare
      });

      showToast('Delivery requested successfully! Waiting for driver acceptance...', 'success');
      
      // 🔥 NEW: Navigate to Track Ride tab
      if (onBookingSuccess) {
        onBookingSuccess();
      }
      
      // Reset form
      setStep(1);
      setPickupLocation(null);
      setDropLocation(null);
      setPickupAddress('');
      setDropAddress('');
      setSelectedVehicleType('');
    } catch (error) {
      console.error('Failed to book ride:', error);
      showToast(error.message || 'Failed to book ride', 'error'); // ✨ Toast notification
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!pickupLocation || !dropLocation) return 0;
    
    const R = 6371;
    const dLat = (dropLocation[0] - pickupLocation[0]) * Math.PI / 180;
    const dLon = (dropLocation[1] - pickupLocation[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickupLocation[0] * Math.PI / 180) * Math.cos(dropLocation[0] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  return (
    <motion.div
      className="book-ride-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="booking-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <span>Pickup</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <span>Drop</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Vehicle</span>
        </div>
      </div>

      <div className="booking-content">
        {step === 1 && (
          <motion.div
            className="map-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2><FaMapMarkerAlt /> Select Pickup Location</h2>
            <p className="instruction">Search for a location or click on the map</p>
            
            {/* 🔥 NEW: Location Search Bar */}
            <div className="location-search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="location-search-input"
                  placeholder="Search for pickup location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchLoading && <FaSpinner className="search-spinner spin" />}
              </div>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, index) => {
                    console.log('🔍 Search result:', index, result);
                    return (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => selectSearchResult(result)}
                      >
                        <FaMapMarkerAlt className="result-icon" />
                        <div className="result-text">
                          <strong>{result.display_name?.split(',')[0] || 'Unknown Location'}</strong>
                          <small>{result.display_name || `Lat: ${result.lat}, Lon: ${result.lon}`}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {pickupAddress && (
              <div className="selected-address">
                <FaMapMarkerAlt /> <strong>Selected:</strong> {pickupAddress}
              </div>
            )}

            <div className="map-wrapper">
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: '400px', width: '100%' }}
                key={`pickup-${mapCenter[0]}-${mapCenter[1]}`}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationMarker 
                  position={pickupLocation} 
                  setPosition={(pos) => {
                    setPickupLocation(pos);
                    setPickupAddress('');
                  }}
                  label="Pickup Location"
                />
              </MapContainer>
            </div>
            {pickupLocation && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <motion.button
                  className="btn btn-primary"
                  onClick={() => setStep(2)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next: Select Drop Location
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            className="map-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2><FaMapPin /> Select Drop Location</h2>
            <p className="instruction">Search for a location or click on the map</p>
            
            {/* 🔥 NEW: Location Search Bar */}
            <div className="location-search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="location-search-input"
                  placeholder="Search for drop location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchLoading && <FaSpinner className="search-spinner spin" />}
              </div>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, index) => {
                    console.log('🔍 Drop search result:', index, result);
                    return (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => selectSearchResult(result)}
                      >
                        <FaMapPin className="result-icon" />
                        <div className="result-text">
                          <strong>{result.display_name?.split(',')[0] || 'Unknown Location'}</strong>
                          <small>{result.display_name || `Lat: ${result.lat}, Lon: ${result.lon}`}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {dropAddress && (
              <div className="selected-address">
                <FaMapPin /> <strong>Selected:</strong> {dropAddress}
              </div>
            )}

            <div className="map-wrapper">
              <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: '400px', width: '100%' }}
                key={`drop-${mapCenter[0]}-${mapCenter[1]}`}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {pickupLocation && (
                  <Marker position={pickupLocation}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                )}
                <LocationMarker 
                  position={dropLocation} 
                  setPosition={(pos) => {
                    setDropLocation(pos);
                    setDropAddress('');
                  }}
                  label="Drop Location"
                />
                {/* Route visualization */}
                {routeCoordinates.length > 0 && (
                  <Polyline 
                    positions={routeCoordinates} 
                    color="#4F46E5" 
                    weight={4}
                    opacity={0.7}
                  />
                )}
              </MapContainer>
            </div>
            {routeLoading && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--primary)' }}>
                <FaSpinner className="spin" /> Calculating route...
              </div>
            )}
            <div className="button-group">
              <button className="btn btn-outline" onClick={() => setStep(1)}>
                Back
              </button>
              {dropLocation && (
                <motion.button
                  className="btn btn-primary"
                  onClick={() => setStep(3)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next: Select Vehicle
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            className="vehicle-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2><FaCar /> Select Vehicle Type</h2>
            <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
              Choose the vehicle type based on your delivery needs
            </p>
            <div className="vehicle-grid">
              {VEHICLE_OPTIONS.map((vehicle) => (
                <motion.div
                  key={vehicle.type}
                  className={`vehicle-card ${selectedVehicleType === vehicle.type ? 'selected' : ''}`}
                  onClick={() => setSelectedVehicleType(vehicle.type)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="vehicle-icon" style={{ fontSize: '3rem' }}>{vehicle.icon}</div>
                  <h3>{vehicle.label}</h3>
                  <p className="vehicle-capacity" style={{ fontSize: '0.85rem', color: 'var(--gray)', margin: '0.5rem 0' }}>
                    Capacity: {vehicle.capacity} kg
                  </p>
                  <p className="vehicle-price">₹{vehicle.rate}/km</p>
                </motion.div>
              ))}
            </div>

            {selectedVehicleType && (
              <div className="fare-summary">
                <h3>Delivery Summary</h3>
                <div className="summary-item">
                  <span>Vehicle:</span>
                  <strong>{VEHICLE_OPTIONS.find(v => v.type === selectedVehicleType)?.label}</strong>
                </div>
                <div className="summary-item">
                  <span>Capacity:</span>
                  <strong>{VEHICLE_OPTIONS.find(v => v.type === selectedVehicleType)?.capacity} kg</strong>
                </div>
                <div className="summary-item">
                  <span>Distance:</span>
                  <strong>{calculateDistance()} km</strong>
                </div>
                <div className="summary-item">
                  <span>Estimated Fare:</span>
                  <strong>₹{calculateFare()}</strong>
                </div>
              </div>
            )}

            <div className="button-group">
              <button className="btn btn-outline" onClick={() => setStep(2)}>
                Back
              </button>
              <motion.button
                className="btn btn-primary"
                onClick={handleBookRide}
                disabled={loading || !selectedVehicleType}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spin" /> Requesting...
                  </>
                ) : (
                  'Request Delivery'
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BookRide;