import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const visitorSent = useRef(false);

  useEffect(() => {
    const socketUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3001'
      : window.location.origin;
    const newSocket = io(socketUrl, {
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Send visitor-joined only once per session
      if (!visitorSent.current) {
        newSocket.emit('visitor-joined', {
          ipAddress: '', // Optionally fill with real IP if available
          userAgent: navigator.userAgent
        });
        visitorSent.current = true;
      }
    });
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      // Optionally emit visitor-left if needed
    });
    newSocket.on('connect_error', (err) => {
      setIsConnected(false);
      // Optionally show error to user
      // console.error('WebSocket connection error:', err);
    });
    newSocket.on('reconnect', () => {
      setIsConnected(true);
      // Re-identify visitor on reconnect
      newSocket.emit('visitor-joined', {
        ipAddress: '',
        userAgent: navigator.userAgent
      });
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};