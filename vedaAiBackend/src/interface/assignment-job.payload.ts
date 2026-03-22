// Job payload type
export interface AssignmentJobPayload {
    assignmentId: string;
    data: {
        title: string;
        fileUrl?: string;
        dueDate: Date;
        questionTypes: string[];
        numberOfQuestions: number;
        totalMarks: number;
        additionalInstructions: string;
    }
}