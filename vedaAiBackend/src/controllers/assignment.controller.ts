import { NextFunction, Response } from "express";
import type { Request as MulterRequest, Request } from "express";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import { ICreateAssignmentDto } from "../interface/assignment.interface.js";
import { uploadFileToUploadThing } from "../utils/uploadthing-helper.js";
import { CreateAssignmentService, GetAllAssessments, GetAssessmentByIdService, RegenerateAssessmentService, DeleteAssignmentService, DownloadAssignmentService } from "../services/assignment.service.js";

export const CreateAssignment = async (
    request: MulterRequest,
    response: Response,
    next: NextFunction
) => {
    try {
        const {
            title,
            dueDate,
            questionTypes,
            numberOfQuestions,
            totalMarks,
            additionalInstructions,
        }: ICreateAssignmentDto = request.body;

        if (!dueDate || !questionTypes?.length || !numberOfQuestions || !totalMarks) {
            throw new AppError("Missing required assignment fields", 400);
        }

        let fileUrl: string | undefined;

        if (request.file) {
            fileUrl = await uploadFileToUploadThing(
                request.file.buffer,
                request.file.originalname,
                request.file.mimetype
            );
        }

        const resolvedTitle = title?.trim()
            || (request.file ? request.file.originalname.replace(/\.[^.]+$/, '') : null)
            || `Assignment - ${new Date().toLocaleDateString()}`;

        const assignmentData: ICreateAssignmentDto = {
            title: resolvedTitle,
            file: fileUrl,
            dueDate: new Date(dueDate),
            questionTypes,
            numberOfQuestions: Number(numberOfQuestions),
            totalMarks: Number(totalMarks),
            additionalInstructions: additionalInstructions?.trim(),
        };

        const { data, message, success } = await CreateAssignmentService(assignmentData);

        if (!success) {
            logger.error(`Message : ${message}`)
            throw new AppError(`Failed to generate Assessment ${message}`, 500)
        }

        logger.info("Assignment creation request queued", { assignmentId: data.assignmentId });

        response.status(202).json({
            success: true,
            message: "Assignment generation started",
            data: { ...data }
        });
    } catch (error) {
        logger.error(`Failed to create assignment: ${error}`);
        next(error);
    }
};

export const GetAssessment = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const { search, sortBy = 'createdAt', sortOrder = 'desc', limit = 10, skip = 0 } = request.query;

        const parsedLimit = Number(limit);
        const parsedSkip = Number(skip);
        
        if (parsedLimit < 1 || parsedLimit > 100) {
            throw new AppError("Limit must be between 1 and 100", 400);
        }
        if (parsedSkip < 0) {
            throw new AppError("Skip cannot be negative", 400);
        }
        if (!['createdAt', 'dueDate', 'title', 'status'].includes(String(sortBy))) {
            throw new AppError("Invalid sortBy field", 400);
        }
        if (!['asc', 'desc'].includes(String(sortOrder))) {
            throw new AppError("SortOrder must be 'asc' or 'desc'", 400);
        }

        const data = await GetAllAssessments({
            search: String(search || ''),
            sortBy: String(sortBy),
            sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
            limit: parsedLimit,
            skip: parsedSkip,
        });

        return response.status(200).json({
            ...data
        })
    } catch (error) {
        logger.error(`Failed to get assessment: ${error}`);
        next(error);
    }
};

export const GetAssessmentById = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    const assessmentId = request.params.assessmentId
    try {
        if (!assessmentId || String(assessmentId).trim() === '') {
            throw new AppError("Assessment ID is required", 400);
        }
        
        if (!String(assessmentId).match(/^[0-9a-fA-F]{24}$/)) {
            throw new AppError("Invalid assessment ID format", 400);
        }
        
        const data = await GetAssessmentByIdService(String(assessmentId))
        return response.status(200).json({
            ...data
        })
    } catch (error) {
        logger.error(`Failed to get assessment by id:${assessmentId} and error is: ${error}`);
        next(error);
    }
};

export const RegenerateAssessment = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const { assessmentId } = request.params;

        if (!assessmentId || String(assessmentId).trim() === '') {
            throw new AppError("Assessment ID is required", 400);
        }
        
        if (!String(assessmentId).match(/^[0-9a-fA-F]{24}$/)) {
            throw new AppError("Invalid assessment ID format", 400);
        }

        const { success, message, data } = await RegenerateAssessmentService(String(assessmentId));

        logger.info("Assessment regeneration queued", { assessmentId, jobId: data.jobId });

        response.status(202).json({ success, message, data });
    } catch (error) {
        logger.error(`Failed to regenerate assessment: ${error}`);
        next(error);
    }
};

export const DeleteAssignment = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const { assessmentId } = request.params;

        if (!assessmentId || String(assessmentId).trim() === '') {
            throw new AppError("Assessment ID is required", 400);
        }
        
        if (!String(assessmentId).match(/^[0-9a-fA-F]{24}$/)) {
            throw new AppError("Invalid assessment ID format", 400);
        }

        const { success, message, data } = await DeleteAssignmentService(String(assessmentId));

        logger.info("Assignment deleted", { assessmentId });

        response.status(200).json({ success, message, data });
    } catch (error) {
        logger.error(`Failed to delete assignment: ${error}`);
        next(error);
    }
};

export const DownloadAssignment = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const { assessmentId } = request.params;

        if (!assessmentId || String(assessmentId).trim() === '') {
            throw new AppError("Assessment ID is required", 400);
        }
        
        if (!String(assessmentId).match(/^[0-9a-fA-F]{24}$/)) {
            throw new AppError("Invalid assessment ID format", 400);
        }

        const { success, message, data } = await DownloadAssignmentService(String(assessmentId));

        logger.info("Assignment PDF downloaded", { assessmentId, pdfUrl: data.pdfUrl });

        response.status(200).json({ success, message, data });
    } catch (error) {
        logger.error(`Failed to download assignment: ${error}`);
        next(error);
    }
};