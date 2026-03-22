import { Job, Worker } from "bullmq";
import { AssignmentJobPayload } from "../interface/assignment-job.payload.js";
import { logger } from "../config/logger.js";
import Assignment from "../schema/assignment.schema.js";
import { extractFileContent } from "../utils/fetchFileContent.js";
import { buildPrompt } from "../utils/buildPromt.js";
import { generateQuestionWithAI } from "../utils/generateQuestionWithAI.js";
import { parseAIResponse } from "../utils/parseAiResponse.js";
import { cacheSet } from "../utils/redisCache.js";
import { emitSocketEvent } from "../utils/socketEmitter.js";
import { redisConnection } from "../config/redis.js";
import { REDIS_URL } from "../config/dotenv.js";

export const createAssignmentWorker = async () => {
    const worker = new Worker<AssignmentJobPayload, any, "assignment-generation">(
        "assignment-generation",
        async (job: Job) => {
            const { assignmentId, data } = job.data;

            try {
                logger.info(`[Worker] Starting job for assignment: ${assignmentId}`);
                await job.updateProgress(10);
                await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' });
                
                // Emit progress event via Redis pub/sub
                await emitSocketEvent(`assessment:${assignmentId}`, "assessment:progress", {
                    assignmentId, status: "generating", progress: 10,
                    message: "Starting Generation..."
                });

                let content = "";
                if (data.fileUrl) {
                    await job.updateProgress(30);
                    content = await extractFileContent(data.fileUrl);
                    await emitSocketEvent(`assessment:${assignmentId}`, "assessment:progress", {
                        assignmentId, status: "generating", progress: 30,
                        message: "File content extracted...",
                    });
                }

                await job.updateProgress(50);
                const prompt = buildPrompt(data, content);
                await emitSocketEvent(`assessment:${assignmentId}`, "assessment:progress", {
                    assignmentId, status: "generating", progress: 50,
                    message: "Prompt built, calling AI...",
                });

                const assignment = await Assignment.findById(assignmentId);
                if (!assignment) throw new Error('Assignment not found');

                await job.updateProgress(60);
                const aiResponse = await generateQuestionWithAI(prompt);
                
                // Log the full AI response for debugging
                logger.info("[Worker] Full AI response received", {
                    responseLength: aiResponse.length,
                    responsePreview: aiResponse.substring(0, 500),
                    responseSuffix: aiResponse.substring(Math.max(0, aiResponse.length - 300))
                });
                
                await emitSocketEvent(`assessment:${assignmentId}`, "assessment:progress", {
                    assignmentId, status: "generating", progress: 60,
                    message: "AI response received...",
                });

                await job.updateProgress(75);
                const questionPaper = parseAIResponse(aiResponse);
                await emitSocketEvent(`assessment:${assignmentId}`, "assessment:progress", {
                    assignmentId, status: "generating", progress: 75,
                    message: "Parsing response...",
                });

                await job.updateProgress(95);
                const updatedAssignment = await Assignment.findByIdAndUpdate(
                    assignmentId,
                    { generatedQuestions: questionPaper, status: 'completed' },
                    { new: true }
                );

                await cacheSet(`assessment:${assignmentId}`, updatedAssignment);

                await job.updateProgress(100);
                logger.info(`[Worker] Emitting completion event to room assessment:${assignmentId}`);
                await emitSocketEvent(`assessment:${assignmentId}`, "assessment:completed", {
                    assignmentId, status: "completed", progress: 100,
                    data: updatedAssignment,
                });

                return { success: true, assignmentId, questionPaper };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`[Worker] Job failed for assignment ${job.data.assignmentId}: ${errorMessage}`);
                
                await Assignment.findByIdAndUpdate(job.data.assignmentId, {
                    status: 'failed', errorMessage,
                });
                
                logger.info(`[Worker] Emitting failed event to room assessment:${job.data.assignmentId}`);
                await emitSocketEvent(`assessment:${job.data.assignmentId}`, "assessment:failed", {
                    assignmentId: job.data.assignmentId,
                    status: "failed",
                    error: errorMessage,
                });
                
                throw error;
            }
        },
        {
            connection: {
                url: REDIS_URL
            },
            concurrency: 5,
        }
    );

    worker.on("completed", (job) => {
        logger.info(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
        logger.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });

    logger.info("[Worker] Assignment worker started");
    return worker;
};

// Self-invoke when run directly as a standalone worker (Docker worker container)
const isDirectRun = process.argv[1]?.includes("worker");
if (isDirectRun) {
    import("../db/initialize.connection.js").then(({ initializeConnection }) => {
        initializeConnection().then(() => {
            createAssignmentWorker().then(() => {
                logger.info("[Worker] Standalone worker is running");
            });
        });
    });
}