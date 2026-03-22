
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

export interface IAssignment {
  _id: string;
  title?: string;
  subject?: string;
  class?: string;
  file?: string;
  fileName?: string;
  fileSize?: number;
  dueDate: Date;
  questionTypes?: string[];
  numberOfQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  generatedQuestions?: IQuestionPaper;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  jobId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ICreateAssignmentDto {
  title?: string;
  file?: File;
  dueDate: Date;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
}

export interface IAssignmentSummary {
  _id: string;
  title?: string;
  dueDate: Date;
  status: string;
  createdAt: Date;
}