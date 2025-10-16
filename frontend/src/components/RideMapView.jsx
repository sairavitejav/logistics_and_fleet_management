import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkedAlt, FaMapMarkerAlt, FaMapPin } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useToast } from '../components/Toast';
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
              <Marker position={pickupCoords}>
                <Popup>
                  <div>
                    <strong>Pickup Location</strong>
                    <br />
                    {ride.pickupLocation?.address || 'Location coordinates'}
                  </div>
                </Popup>
              </Marker>

              {/* Drop Marker */}
              <Marker position={dropCoords}>
                <Popup>
                  <div>
                    <strong>Drop Location</strong>
                    <br />
                    {ride.dropoffLocation?.address || 'Location coordinates'}
                  </div>
                </Popup>
              </Marker>

              {/* Driver Location (for active rides) */}
              {showDriverLocation && driverLocation && (
                <Marker position={driverLocation}>
                  <Popup>
                    <div>
                      <strong>Driver Location</strong>
                      <br />
                      Current position
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Line (for active rides with driver location) */}
              {showDriverLocation && driverLocation && (
                <Polyline
                  positions={[pickupCoords, dropCoords]}
                  color="var(--primary)"
                  weight={3}
                  dashArray="5, 10"
                />
              )}

              {/* Route Line (for completed rides - just pickup to drop) */}
              {!showDriverLocation && (
                <Polyline
                  positions={[pickupCoords, dropCoords]}
                  color="var(--success)"
                  weight={3}
                />
              )}
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
