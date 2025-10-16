import RideHistory from './RideHistory';

// Driver ride history uses the same component as customer
const DriverRideHistory = ({ onSelectRideForMap }) => {
  return <RideHistory onSelectRideForMap={onSelectRideForMap} />;
};

export default DriverRideHistory;