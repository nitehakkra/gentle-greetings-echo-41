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
      // In development (localhost), use port 3002 for backend
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3002';
      }
      // In production, use the same domain as frontend
      return window.location.origin;
    };
    
    const socketUrl = getSocketUrl();
    
    console.log('🔍 Current window location:', {
      hostname: window.location.hostname,
      port: window.location.port,
      origin: window.location.origin
    });
    console.log('🔌 Connecting to WebSocket server at:', socketUrl);
    
    // Force backend URL in development
    const finalSocketUrl = window.location.hostname === 'localhost' ? 'http://localhost:3002' : socketUrl;
    console.log('🎯 Final socket URL:', finalSocketUrl);
    
    const newSocket = io(finalSocketUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true
    });

    const onConnect = () => {
      console.log('✅ Socket connected successfully:', newSocket.id);
      console.log('🔗 Socket transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('❌ Socket connection error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        name: error.name,
        socketUrl: finalSocketUrl
      });
    };
    
    const onReconnect = (attemptNumber: number) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    };
    
    const onReconnectAttempt = (attemptNumber: number) => {
      console.log(`🔄 Attempting to reconnect... (${attemptNumber})`);
    };
    
    const onReconnectError = (error: Error) => {
      console.error('🔄 Socket reconnection error:', error);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);
    newSocket.on('reconnect', onReconnect);
    newSocket.on('reconnect_attempt', onReconnectAttempt);
    newSocket.on('reconnect_error', onReconnectError);

    setSocket(newSocket);
    setIsConnected(newSocket.connected);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onConnectError);
      newSocket.off('reconnect', onReconnect);
      newSocket.off('reconnect_attempt', onReconnectAttempt);
      newSocket.off('reconnect_error', onReconnectError);
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
