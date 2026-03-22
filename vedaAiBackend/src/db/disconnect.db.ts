import mongoose from "mongoose";
import { logger } from "../config/logger.js";

export const disconnectDB = async () => {
    try {
        await mongoose.connection.close(false);
        console.log("MongoDB disconnected");
        logger.info(`MongoDB disconnected`)
    } catch (err) {
        console.error("Error closing MongoDB connection", err);
        logger.error(`Error closing MongoDB connection: ${err}`)
    }
};