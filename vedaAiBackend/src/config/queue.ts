import { Queue, QueueEvents } from "bullmq";
import { REDIS_URL } from "./dotenv.js";

export const assignmentQueue = new Queue("assignment-generation", {
    connection: { url: REDIS_URL! },
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
    }
})

export const queueEvents = new QueueEvents("assignment-generation", {
    connection: {
        url: REDIS_URL!
    }
})