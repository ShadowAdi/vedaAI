'use client';

import React, { useEffect, ReactNode } from 'react';
import { initializeSocket } from '@/utils/socket';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    const socket = initializeSocket();
    
    return () => {
      // Optional: Disconnect on unmount if needed
      // socket?.disconnect();
    };
  }, []);

  return <>{children}</>;
};
