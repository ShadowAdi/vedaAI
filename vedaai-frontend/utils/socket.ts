import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_SOCKET_URL || 'http://localhost:5000';

export const initializeSocket = (): Socket => {
  if (socket) return socket;

  socket = io(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from server');
  });

  socket.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinAssessmentRoom = (assignmentId: string) => {
  if (!socket) {
    console.warn('[Socket] Socket not initialized. Call initializeSocket first.');
    return;
  }
  socket.emit('join:assessment', assignmentId);
  console.log(`[Socket] Joined room: assessment:${assignmentId}`);
};

export const onAssessmentProgress = (
  callback: (data: {
    assignmentId: string;
    status: string;
    progress: number;
    message: string;
  }) => void
) => {
  if (!socket) {
    console.warn('[Socket] Socket not initialized');
    return;
  }
  socket.on('assessment:progress', callback);
};

export const onAssessmentCompleted = (
  callback: (data: {
    assignmentId: string;
    status: string;
    progress: number;
    data: any;
  }) => void
) => {
  if (!socket) {
    console.warn('[Socket] Socket not initialized');
    return;
  }
  socket.on('assessment:completed', callback);
};

export const onAssessmentFailed = (
  callback: (data: {
    assignmentId: string;
    status: string;
    error: string;
  }) => void
) => {
  if (!socket) {
    console.warn('[Socket] Socket not initialized');
    return;
  }
  socket.on('assessment:failed', callback);
};

export const offAssessmentProgress = () => {
  if (!socket) return;
  socket.off('assessment:progress');
};

export const offAssessmentCompleted = () => {
  if (!socket) return;
  socket.off('assessment:completed');
};

export const offAssessmentFailed = () => {
  if (!socket) return;
  socket.off('assessment:failed');
};
