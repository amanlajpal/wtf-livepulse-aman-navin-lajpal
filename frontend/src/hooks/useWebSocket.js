import { useEffect, useRef } from 'react';
import { useGymStore } from '../store/gymStore';

export function useWebSocket() {
  const wsRef = useRef(null);
  const setWsConnected = useGymStore((state) => state.setWsConnected);
  const handleWsEvent = useGymStore((state) => state.handleWsEvent);

  useEffect(() => {
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws`;
      } else {
        wsUrl = 'wss://wtf-livepulse-aman-navin-lajpal.onrender.com/ws';
      }
    }

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== 'CONNECTED') {
            handleWsEvent(payload);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setWsConnected(false);
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setWsConnected, handleWsEvent]);
}
