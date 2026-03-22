import { logger } from "../config/logger.js";
import { assignmentQueue } from "../config/queue.js";
import { IAssignment, ICreateAssignmentDto } from "../interface/assignment.interface.js";
import Assignment from "../schema/assignment.schema.js";
import { AppError } from "../utils/AppError.js";
import { cacheDelete, cacheGet, cacheSet } from "../utils/redisCache.js";
import { generateAssignmentPDF } from "../utils/generateAssignmentPDF.js";
import { uploadFileToUploadThing } from "../utils/uploadthing-helper.js";

export const CreateAssignmentService = async (
    createAssignmentData: ICreateAssignmentDto,
) => {
    try {
        const isAssignmentAlreadyExists = await Assignment.exists({
            title: createAssignmentData.title,
        });
        if (isAssignmentAlreadyExists) {
            logger.error(`Assignment with this title already exists`);
            throw new AppError(`Assignment with this title already exists`, 409);
        }

        const createdAssignment = await Assignment.create({
            ...createAssignmentData,
        });

        // 2. Add job to BullMQ queue
        const job = await assignmentQueue.add("assignment-generation", {
            assignmentId: createdAssignment._id.toString(),
            data: {
                title: createAssignmentData.title ?? createdAssignment.title,
                dueDate: createAssignmentData.dueDate,
                questionTypes: createAssignmentData.questionTypes,
                numberOfQuestions: createAssignmentData.numberOfQuestions,
                totalMarks: createAssignmentData.totalMarks,
                additionalInstructions: createAssignmentData.additionalInstructions,
                fileUrl: createAssignmentData.file ?? undefined,
            },
        }, {
            jobId: `assign_${createdAssignment._id}`, // Idempotent job ID
            priority: 1, // Higher = more urgent
        });
        return {
            success: true,
            message: "Assignment generation started",
            data: {
                assignmentId: createdAssignment._id,
                jobId: job.id,
                status: "queued",
                estimatedTime: "30-60 seconds",
            },
        }

    } catch (error) {
        logger.error(`Failed to create assignment: ${error}`);
        throw new AppError(`Failed to create assignment: ${error}`, 500);
    }
};

export const GetAssessmentByIdService = async (assessmentId: string) => {
    try {
        const cached = await cacheGet<IAssignment>(`assessment:${assessmentId}`);
        if (cached) {
            return { success: true, data: cached, source: "cache" }
        }

        const assessment = await Assignment.findById(assessmentId);
        if (!assessment) {
            logger.error(`Failed to get assessment`)
            throw new AppError("Assessment not found", 404);
        }

        if (assessment.status === "completed") {
            await cacheSet(`assessment:${assessmentId}`, assessment);
        }

        return { success: true, data: assessment, source: "db" };
    } catch (error) {
        logger.error(`Failed to get assessment by id: ${assessmentId}`)
        throw new AppError(`Failed to get assessment by id: ${assessmentId}`, 500)
    }
}

export const GetAllAssessments = async ({
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit = 10,
    skip = 0,
}: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    skip?: number;
} = {}) => {
    try {
        const filter: any = {};
        if (search && search.trim()) {
            filter.title = { $regex: search.trim(), $options: 'i' }; // Case-insensitive search
        }

        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const totalCount = await Assignment.countDocuments(filter);

        const assessments = await Assignment.find(filter)
            .sort(sortObj)
            .limit(Number(limit))
            .skip(Number(skip));

        if (!assessments) {
            logger.error(`Failed to get assessment`)
            throw new AppError("Assessments not found", 404);
        }

        return {
            success: true,
            data: assessments,
            pagination: {
                total: totalCount,
                limit: Number(limit),
                skip: Number(skip),
                hasMore: Number(skip) + Number(limit) < totalCount,
            }
        };
    } catch (error) {
        logger.error(`Failed to get assessments`)
        throw new AppError(`Failed to get assessments`, 500)
    }
}

export const RegenerateAssessmentService = async (assessmentId: string) => {
    try {
        const assignment = await Assignment.findById(assessmentId);
        if (!assignment) {
            throw new AppError("Assessment not found", 404);
        }

        if (assignment.status === "generating") {
            throw new AppError("Assessment is already being generated", 400);
        }

        await Assignment.findByIdAndUpdate(assessmentId, {
            status: "pending",
            generatedQuestions: null,
            errorMessage: null,
            jobId: null,
            pdfUrl: null,           
            pdfGeneratedAt: null, 
        });

        await cacheDelete(`assessment:${assessmentId}`);

        const job = await assignmentQueue.add("assignment-generation", {
            assignmentId: assessmentId,
            data: {
                title: assignment.title,
                dueDate: assignment.dueDate,
                questionTypes: assignment.questionTypes,
                numberOfQuestions: assignment.numberOfQuestions,
                totalMarks: assignment.totalMarks,
                additionalInstructions: assignment.additionalInstructions,
                fileUrl: assignment.file ?? undefined,
            },
        }, {
            jobId: `assign_regen_${assessmentId}_${Date.now()}`,
        });

        await Assignment.findByIdAndUpdate(assessmentId, { jobId: job.id });

        return {
            success: true,
            message: "Regeneration started",
            data: {
                assignmentId: assessmentId,
                jobId: job.id,
                status: "queued",
            },
        };
    } catch (error) {
        logger.error(`Failed to regenerate assessment: ${error}`);
        throw error instanceof AppError
            ? error
            : new AppError(`Failed to regenerate assessment: ${error}`, 500);
    }
};

export const DeleteAssignmentService = async (assessmentId: string) => {
    try {
        const assignment = await Assignment.findById(assessmentId);
        if (!assignment) {
            throw new AppError("Assessment not found", 404);
        }

        await Assignment.findByIdAndDelete(assessmentId);

        await cacheDelete(`assessment:${assessmentId}`);

        logger.info(`Assignment deleted successfully: ${assessmentId}`);

        return {
            success: true,
            message: "Assignment deleted successfully",
            data: {
                assignmentId: assessmentId,
            },
        };
    } catch (error) {
        logger.error(`Failed to delete assignment: ${error}`);
        throw error instanceof AppError
            ? error
            : new AppError(`Failed to delete assignment: ${error}`, 500);
    }
};

export const DownloadAssignmentService = async (assessmentId: string) => {
    try {
        const assignment = await Assignment.findById(assessmentId);
        if (!assignment) {
            throw new AppError("Assessment not found", 404);
        }

        if (assignment.status !== "completed") {
            throw new AppError("Assignment is not yet generated. Please wait for generation to complete.", 400);
        }

        if (assignment.pdfUrl) {
            logger.info(`PDF retrieved from cache for assignment: ${assessmentId}`);
            return {
                success: true,
                message: "PDF retrieved successfully",
                data: {
                    assignmentId: assessmentId,
                    pdfUrl: assignment.pdfUrl,
                    fileName: `${assignment.title}.pdf`,
                    cachedAt: assignment.pdfGeneratedAt,
                },
            };
        }

        const pdfBuffer = await generateAssignmentPDF(assignment as IAssignment);

        const pdfUrl = await uploadFileToUploadThing(
            pdfBuffer,
            `${assignment.title.replace(/\s+/g, '_')}.pdf`,
            "application/pdf"
        );

        // Cache PDF URL in database
        await Assignment.findByIdAndUpdate(assessmentId, {
            pdfUrl: pdfUrl,
            pdfGeneratedAt: new Date(),
        });

        logger.info(`PDF generated and uploaded for assignment: ${assessmentId}`);

        return {
            success: true,
            message: "PDF generated successfully",
            data: {
                assignmentId: assessmentId,
                pdfUrl: pdfUrl,
                fileName: `${assignment.title}.pdf`,
                cachedAt: new Date(),
            },
        };
    } catch (error) {
        logger.error(`Failed to download assignment: ${error}`);
        throw error instanceof AppError
            ? error
            : new AppError(`Failed to download assignment: ${error}`, 500);
    }
};