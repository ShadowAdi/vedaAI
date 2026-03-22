import { Server, Socket } from "socket.io";
import { logger } from "./logger.js";
import http from "http";
import { CLIENT_URL } from "./dotenv.js";
import { subscribeToSocketEvents } from "../utils/socketEmitter.js";


let io: Server | null = null;

export const initializeSocket = async (server: http.Server): Promise<Server> => {
    io = new Server(server, {
        cors: {
            origin: CLIENT_URL || "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket: Socket) => {
        logger.info(`[Socket] Client connected: ${socket.id}`);

        socket.on("join:assessment", (assignmentId: string) => {
            socket.join(`assessment:${assignmentId}`);
            logger.info(`[Socket] ${socket.id} joined room assessment:${assignmentId}`);
        });

        socket.on("disconnect", () => {
            logger.info(`[Socket] Client disconnected: ${socket.id}`);
        });

        socket.on("error", (error) => {
            logger.error(`Socket error: ${error}`);
        });
    });

    // Subscribe to Redis pub/sub for cross-process communication
    try {
        const unsubscribe = await subscribeToSocketEvents(
            (room: string, event: string, data: any) => {
                if (io) {
                    logger.debug(
                        `[Socket] Emitting event "${event}" to room "${room}" via Redis pub/sub`
                    );
                    io.to(room).emit(event, data);
                }
            }
        );

        // Store unsubscribe function for cleanup if needed
        (io as any).__unsubscribeSocket = unsubscribe;
    } catch (error) {
        logger.warn(`[Socket] Failed to subscribe to Redis events: ${error}`);
        // Continue anyway - events from current process will still work
    }

    return io;
};

export const getIO = (): Server | null => {
    return io;
};