import { Server } from "http";
import { logger } from "../config/logger.js";
import { disconnectDB } from "../db/disconnect.db.js";

export const shutdown = async (server: Server, signal: string) => {
    console.log(`\n Received ${signal}. Shutting down gracefully...`);
    logger.error(`\n Received ${signal}. Shutting down gracefully...`)

    server.close(async () => {
        console.log(`HTTP server closed`)
        logger.info(`HTTP server closed`)

        await disconnectDB()

        setTimeout(() => {
            console.error("Force shutdown after 10s");
            process.exit(1);
        }, 10_000);
    })
}