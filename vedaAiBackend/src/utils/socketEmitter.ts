import { redisConnection } from "../config/redis.js";
import { logger } from "../config/logger.js";

/**
 * Emits socket events via Redis pub/sub
 * Used by workers to communicate with Socket.IO server
 */
export const emitSocketEvent = async (
  room: string,
  event: string,
  data: any
): Promise<void> => {
  try {
    const payload = JSON.stringify({
      room,
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    await redisConnection.publish(`socket:${room}:${event}`, payload);
    logger.debug(`[SocketEmitter] Published event "${event}" to room "${room}"`);
  } catch (error) {
    logger.error(
      `[SocketEmitter] Failed to emit event "${event}" to room "${room}": ${error}`
    );
    throw error;
  }
};

/**
 * Subscribe to socket events (for Socket.IO server)
 */
export const subscribeToSocketEvents = async (
  callback: (room: string, event: string, data: any) => void
): Promise<() => void> => {
  try {
    const subscriber = redisConnection.duplicate();
    
    // Subscribe to all socket events using the new ioredis API
    subscriber.psubscribe("socket:*:*");

    subscriber.on("pmessage", (pattern: string, channel: string, message: string) => {
      try {
        const { room, event, data } = JSON.parse(message);
        callback(room, event, data);
      } catch (error) {
        logger.error(
          `[SocketEmitter] Failed to parse message from channel "${channel}": ${error}`
        );
      }
    });

    subscriber.on("ready", () => {
      logger.info(`[SocketEmitter] Socket event subscriber connected`);
    });

    subscriber.on("error", (error) => {
      logger.error(`[SocketEmitter] Subscriber error: ${error.message}`);
    });

    // Return unsubscribe function
    return async () => {
      await subscriber.punsubscribe();
      subscriber.disconnect();
    };
  } catch (error) {
    logger.error(
      `[SocketEmitter] Failed to subscribe to socket events: ${error}`
    );
    throw error;
  }
};
