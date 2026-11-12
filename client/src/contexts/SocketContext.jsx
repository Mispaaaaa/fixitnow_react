import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }
    const instance = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    setSocket(instance);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    instance.on('connect', onConnect);
    instance.on('disconnect', onDisconnect);
    return () => {
      instance.off('connect', onConnect);
      instance.off('disconnect', onDisconnect);
      instance.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}