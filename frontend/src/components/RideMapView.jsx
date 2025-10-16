import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkedAlt, FaMapMarkerAlt, FaMapPin } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useToast } from '../components/Toast';
import RoutingMachine from './RoutingMachine';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/RideTracking.css';

const RideMapView = ({ ride, showDriverLocation = false, height = '400px' }) => {
  const { showToast } = useToast();
  const [driverLocation, setDriverLocation] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    // For active rides, try to get driver location if available
    if (showDriverLocation && ride?.driver?.currentLocation) {
      setDriverLocation([
        ride.driver.currentLocation.coordinates[1],
        ride.driver.currentLocation.coordinates[0]
      ]);
    } else {
      setDriverLocation(null);
    }
  }, [ride, showDriverLocation]);

  useEffect(() => {
    // Fix default marker icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Small delay to ensure map is fully loaded before showing markers
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!ride) {
    return (
      <motion.div
        className="no-ride-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FaMapMarkedAlt size={48} color="var(--gray)" />
        <p>No ride data available</p>
      </motion.div>
    );
  }

  const pickupCoords = [
    ride.pickupLocation?.location?.coordinates[1],
    ride.pickupLocation?.location?.coordinates[0]
  ];

  const dropCoords = [
    ride.dropoffLocation?.location?.coordinates[1],
    ride.dropoffLocation?.location?.coordinates[0]
  ];

  // Calculate center point between pickup and drop
  const centerCoords = [
    (pickupCoords[0] + dropCoords[0]) / 2,
    (pickupCoords[1] + dropCoords[1]) / 2
  ];

  // Custom marker icons
  const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const dropIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <motion.div
      className="ride-map-view-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="map-container" style={{ height }}>
        <MapContainer
          ref={mapRef}
          center={centerCoords}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => setIsMapReady(true)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {isMapReady && (
            <>
              {/* Pickup Marker */}
              <Marker position={pickupCoords} icon={pickupIcon}>
                <Popup>
                  <div>
                    <strong>🟢 Pickup Location</strong>
                    <br />
                    {ride.pickupLocation?.address || 'Location coordinates'}
                  </div>
                </Popup>
              </Marker>

              {/* Drop Marker */}
              <Marker position={dropCoords} icon={dropIcon}>
                <Popup>
                  <div>
                    <strong>🔴 Drop Location</strong>
                    <br />
                    {ride.dropoffLocation?.address || 'Location coordinates'}
                  </div>
                </Popup>
              </Marker>

              {/* Driver Location (for active rides) */}
              {showDriverLocation && driverLocation && (
                <Marker position={driverLocation} icon={driverIcon}>
                  <Popup>
                    <div>
                      <strong>🔵 Driver Location</strong>
                      <br />
                      Current position
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Actual Road Route */}
              <RoutingMachine 
                start={pickupCoords} 
                end={dropCoords} 
                color={showDriverLocation ? '#007bff' : '#28a745'}
              />
            </>
          )}
        </MapContainer>
      </div>

      <div className="ride-map-info">
        <div className="info-card">
          <div className="info-item">
            <FaMapMarkerAlt className="info-icon pickup" />
            <div>
              <strong>Pickup:</strong>
              <p>{ride.pickupLocation?.address || `${pickupCoords[0]?.toFixed(4)}, ${pickupCoords[1]?.toFixed(4)}`}</p>
            </div>
          </div>
          <div className="info-item">
            <FaMapPin className="info-icon drop" />
            <div>
              <strong>Drop:</strong>
              <p>{ride.dropoffLocation?.address || `${dropCoords[0]?.toFixed(4)}, ${dropCoords[1]?.toFixed(4)}`}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RideMapView;
