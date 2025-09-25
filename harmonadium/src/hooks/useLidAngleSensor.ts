import { useState, useEffect, useCallback } from 'react';

// interface SensorData {
//   angle: number;
//   timestamp: number;
// }

interface UseLidAngleSensorReturn {
  currentAngle: number | null;
  isConnected: boolean;
  lastUpdate: number | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  isSupported: boolean;
}

export function useLidAngleSensor(): UseLidAngleSensorReturn {
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const checkSupport = useCallback((): boolean => {
    return typeof window !== 'undefined' && 'WebSocket' in window;
  }, []);

  const connect = useCallback(() => {
    if (!checkSupport()) {
      setError('WebSocket not supported');
      return;
    }

    try {
      const ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        console.log('🔗 Connected to lid angle sensor server');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'angle' && typeof data.angle === 'number') {
            setCurrentAngle(data.angle);
            setLastUpdate(data.timestamp);
            // console.log(`📐 Received angle: ${data.angle}°`);
          }
        } catch (parseError) {
          console.error('Failed to parse sensor data:', parseError);
          setError('Failed to parse sensor data');
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from lid angle sensor');
        setIsConnected(false);
        setCurrentAngle(null);
      };

      ws.onerror = (wsError) => {
        console.error('WebSocket error:', wsError);
        setError('Connection to sensor failed');
        setIsConnected(false);
      };

      setSocket(ws);
    } catch (connectionError) {
      console.error('Failed to connect to sensor:', connectionError);
      setError('Failed to connect to sensor');
    }
  }, [checkSupport]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setIsConnected(false);
    setCurrentAngle(null);
    setLastUpdate(null);
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  useEffect(() => {
    if (!isConnected && currentAngle === null && !error) {
      const autoConnectTimer = setTimeout(() => {
        connect();
      }, 2000);

      return () => clearTimeout(autoConnectTimer);
    }
  }, [isConnected, currentAngle, error, connect]);

  return {
    currentAngle,
    isConnected,
    lastUpdate,
    error,
    connect,
    disconnect,
    isSupported: checkSupport(),
  };
}