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
  const connectionAttempts = useRef(0);

  useEffect(() => {
    const socketUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3002'
      : window.location.origin;
    
    console.log(' Initializing WebSocket connection to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
      forceNew: false
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      connectionAttempts.current = 0;
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
    
    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });
    
    newSocket.on('connect_error', (err) => {
      connectionAttempts.current++;
      console.error(`⚠️ WebSocket connection error (attempt ${connectionAttempts.current}):`, err.message);
      setIsConnected(false);
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      connectionAttempts.current = 0;
      setIsConnected(true);
      // Re-identify visitor on reconnect
      newSocket.emit('visitor-joined', {
        ipAddress: '',
        userAgent: navigator.userAgent
      });
    });
    
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Attempting to reconnect... (attempt ${attemptNumber})`);
    });
    
    newSocket.on('reconnect_error', (err) => {
      console.error('❌ WebSocket reconnection failed:', err.message);
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