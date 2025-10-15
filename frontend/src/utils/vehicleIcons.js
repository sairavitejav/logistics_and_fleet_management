import { FaMotorcycle, FaCar, FaTruck, FaShuttleVan } from 'react-icons/fa';

// Vehicle type to icon mapping
export const getVehicleIcon = (vehicleType) => {
  const iconMap = {
    bike: FaMotorcycle,
    auto: FaShuttleVan,
    mini_truck: FaTruck,
    lorry: FaTruck
  };

  return iconMap[vehicleType?.toLowerCase()] || FaCar;
};

// Vehicle type to emoji mapping (for BookRide component)
export const getVehicleEmoji = (vehicleType) => {
  const emojiMap = {
    bike: '🏍️',
    auto: '🛺',
    mini_truck: '🚚',
    lorry: '🚛'
  };

  return emojiMap[vehicleType?.toLowerCase()] || '🚗';
};

// Vehicle type display labels
export const getVehicleLabel = (vehicleType) => {
  const labelMap = {
    bike: 'Bike',
    auto: 'Auto',
    mini_truck: 'Mini Truck',
    lorry: 'Lorry'
  };

  return labelMap[vehicleType?.toLowerCase()] || vehicleType;
};

// Vehicle capacity mapping (in kg)
export const VEHICLE_CAPACITY = {
  bike: 20,
  auto: 100,
  mini_truck: 500,
  lorry: 2000
};

// Vehicle rate per km (in ₹)
export const VEHICLE_RATES = {
  bike: 10,
  auto: 15,
  mini_truck: 25,
  lorry: 40
};
