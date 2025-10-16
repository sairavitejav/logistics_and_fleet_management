import { useState, useEffect } from 'react';
import { deliveryAPI } from '../utils/api';
import { getSocket } from '../utils/socket';

const DebugInfo = () => {
  const [apiStatus, setApiStatus] = useState('checking...');
  const [socketStatus, setSocketStatus] = useState('checking...');
  const [ridesCount, setRidesCount] = useState(0);

  useEffect(() => {
    // Test API connection
    const testAPI = async () => {
      try {
        const rides = await deliveryAPI.getAll();
        setApiStatus('✅ Connected');
        setRidesCount(Array.isArray(rides) ? rides.length : 0);
      } catch (error) {
        setApiStatus(`❌ Failed: ${error.message}`);
      }
    };

    // Test Socket connection
    const testSocket = () => {
      const socket = getSocket();
      if (socket) {
        if (socket.connected) {
          setSocketStatus('✅ Connected');
        } else {
          setSocketStatus('⚠️ Initialized but not connected');
        }
      } else {
        setSocketStatus('❌ Not initialized');
      }
    };

    testAPI();
    testSocket();

    // Check socket status every 2 seconds
    const interval = setInterval(testSocket, 2000);
    return () => clearInterval(interval);
  }, []);

  const forceRefresh = () => {
    window.location.reload();
  };

  const forceHistoryLoad = () => {
    // Try to force the history component to show data
    const event = new CustomEvent('forceHistoryLoad');
    window.dispatchEvent(event);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div><strong>Debug Info:</strong></div>
      <div>API: {apiStatus}</div>
      <div>Socket: {socketStatus}</div>
      <div>Rides: {ridesCount}</div>
      <div>URL: {import.meta.env.VITE_API_BASE_URL || 'localhost'}</div>
      <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexDirection: 'column' }}>
        <button 
          onClick={forceRefresh}
          style={{ 
            padding: '2px 6px', 
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Force Refresh
        </button>
        <button 
          onClick={forceHistoryLoad}
          style={{ 
            padding: '2px 6px', 
            fontSize: '10px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none'
          }}
        >
          Fix History
        </button>
      </div>
    </div>
  );
};

export default DebugInfo;
