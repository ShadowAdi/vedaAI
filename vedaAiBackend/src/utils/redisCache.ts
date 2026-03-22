import { logger } from "../config/logger.js";
import { redisConnection } from "../config/redis.js";

const CACHE_TTL = 60 * 60 * 24;

export const cacheSet = async (key: string, value: unknown) => {
    try {
        await redisConnection.set(key, JSON.stringify(value), "EX", CACHE_TTL)
        logger.info(`[Cache] SET ${key}`);
    } catch (error) {
        logger.warn(`[Cache] SET failed for: ${key}: ${error}`)
    }
}

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    try {
        const data = await redisConnection.get(key);
        if (!data) return null;
        logger.info(`[Cache] HIT ${key}`);
        return JSON.parse(data) as T;
    } catch (error) {
        logger.warn(`[Cache] GET failed for ${key}: ${error}`);
        return null;
    }
};

export const cacheDelete = async (key: string): Promise<void> => {
    try {
        await redisConnection.del(key);
        logger.info(`[Cache] DEL ${key}`);
    } catch (error) {
        logger.warn(`[Cache] DEL failed for ${key}: ${error}`);
    }
};