import { Redis } from "ioredis";
import { REDIS_URL } from "./dotenv.js";

export const redisConnection = new Redis(REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
})