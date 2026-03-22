
import { Types } from "mongoose";

export interface IQuestion {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
}

export interface ISection {
    title: string;
    instruction: string;
    questions: IQuestion[];
}

export interface IQuestionPaper {
    sections: ISection[];
}

export interface IAssignment extends Document {
    title: string;
    subject?: string;
    class?: string;

    file?: string;
    fileName?: string;
    fileSize?: number;
    dueDate: Date;
    questionTypes: string[];
    numberOfQuestions: number;
    totalMarks: number;
    additionalInstructions?: string;
    generatedQuestions?: IQuestionPaper;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    jobId?: string; // BullMQ job ID
    errorMessage?: string;
    
    // PDF Caching
    pdfUrl?: string;
    pdfGeneratedAt?: Date;

    createdAt: Date;
    updatedAt: Date;

    // Methods
    calculateTotalMarks(): number;
    getQuestionCount(): number;

}


export interface ICreateAssignmentDto {
    title?: string;
    file?: string;
    dueDate: Date;
    questionTypes: string[];
    numberOfQuestions: number;
    totalMarks: number;
    additionalInstructions: string;
}

export interface IUpdateAssignmentDto {
    title?: string;
    file?: string;
    dueDate?: Date;
    questionTypes?: string[];
    numberOfQuestions?: number;
    totalMarks?: number;
    additionalInstructions?: string;
}

export interface IGetAssignmentDto extends IAssignment { }

export interface IGetAllAssignmentsDto {
    assignments: IAssignment[];
    total: number;
    page: number;
    limit: number;
}

export interface IAssignmentSummary {
    _id: string;
    title?: string;
    dueDate: Date;
    status: string;
    createdAt: Date;
}