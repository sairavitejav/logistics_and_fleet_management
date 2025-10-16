import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const RoutingMachine = ({ start, end, color = '#3388ff' }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    // Create routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      createMarker: () => null, // Don't create default markers
      lineOptions: {
        styles: [
          {
            color: color,
            weight: 4,
            opacity: 0.8
          }
        ]
      },
      show: false, // Hide the instruction panel
      collapsible: false,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      })
    }).addTo(map);

    // Hide the routing instructions container
    const routingContainer = routingControl.getContainer();
    if (routingContainer) {
      routingContainer.style.display = 'none';
    }

    // Cleanup function
    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, start, end, color]);

  return null;
};

export default RoutingMachine;
