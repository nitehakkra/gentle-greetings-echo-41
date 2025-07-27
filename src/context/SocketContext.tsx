import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  on: () => {},
  off: () => {},
  emit: () => {},
  connected: false
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Dynamic socket URL based on environment
    const getSocketUrl = () => {
      // In development (localhost), use port 3001 for backend
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      // In production, use the same domain as frontend
      return window.location.origin;
    };
    
    const socketUrl = getSocketUrl();
    
    console.log('Connecting to WebSocket server at:', socketUrl);
    
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    const onConnect = () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);

    setSocket(newSocket);
    setIsConnected(newSocket.connected);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onConnectError);
      newSocket.disconnect();
    };
  }, []);

  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    on: (event: string, callback: (...args: any[]) => void) => {
      socket?.on(event, callback);
    },
    off: (event: string, callback?: (...args: any[]) => void) => {
      if (callback) {
        socket?.off(event, callback);
      } else {
        socket?.off(event);
      }
    },
    emit: (event: string, ...args: any[]) => {
      socket?.emit(event, ...args);
    },
    connected: socket?.connected || false
  }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
