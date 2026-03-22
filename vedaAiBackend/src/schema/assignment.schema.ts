import mongoose, { Document, Schema } from "mongoose";
import { IAssignment } from "../interface/assignment.interface.js";

export interface IQuestion extends Document {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
}

const QuestionSchema: Schema<IQuestion> = new Schema({
    text: {
        type: String,
        required: [true, "Question Text is required"],
        trim: true,
        minLength: [10, "Question text must be at least 10 characters"],
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: [true, 'Difficulty level is required'],
        default: 'medium',
    },
    marks: {
        type: Number,
        required: [true, 'Marks are required'],
        min: [0.5, 'Marks cannot be less than 0.5'],
        max: [20, 'Marks cannot exceed 20 for a single question'],
    },
}, { _id: true })

export interface ISection extends Document {
    title: string;
    instruction: string;
    questions: IQuestion[];
}

const SectionSchema: Schema<ISection> = new Schema({
    title: {
        type: String,
        required: [true, 'Section title is required'],
        trim: true,
        uppercase: true,
    },
    instruction: {
        type: String,
        required: [true, 'Section instruction is required'],
        trim: true,
    },
    questions: {
        type: [QuestionSchema],
        required: [true, 'At least one question is required'],
        validate: {
            validator: function (questions: IQuestion[]) {
                return questions.length > 0;
            },
            message: 'Section must contain at least one question',
        },
    },
}, { _id: true })

// Question Paper Interface (embedded or separate)
export interface IQuestionPaper extends Document {
    sections: ISection[];
    totalTime?: number; // in minutes
    maxMarks?: number;
}

const QuestionPaperSchema: Schema<IQuestionPaper> = new Schema({
    sections: {
        type: [SectionSchema],
        required: [true, "At least one is required"],
        validate: {
            validator: function (sections: ISection[]) {
                return sections.length > 0
            },
            message: 'Question paper must have at least one section',
        }
    },
    totalTime: {
        type: Number,
        min: [5, 'Minimum time is 5 minutes'],
        max: [180, 'Maximum time is 180 minutes'],
    },
    maxMarks: {
        type: Number,
        min: [0, 'Marks cannot be negative'],
    },
}, { _id: false })

const AssignmentSchema: Schema<IAssignment> = new Schema({
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
        type: String,
        trim: true,
        uppercase: true,
    },
    class: {
        type: String,
        trim: true,
    },
    file: {
        type: String,
        default: null,
    },
    fileName: {
        type: String,
        default: null,
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
        validate: {
            validator: function (value: Date) {
                return value > new Date();
            },
            message: 'Due date must be in the future',
        },
    },
    questionTypes: {
        type: [String],
        required: [true, 'At least one question type is required'],
        validate: {
            validator: function (types: string[]) {
                return types.length > 0;
            },
            message: 'At least one question type must be selected',
        },
    },
    numberOfQuestions: {
        type: Number,
        required: [true, 'Number of questions is required'],
        min: [1, 'Must have at least 1 question'],
        max: [100, 'Cannot have more than 100 questions'],
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks are required'],
        min: [1, 'Total marks must be at least 1'],
        max: [100, 'Total marks cannot exceed 100'],
    },
    additionalInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, 'Instructions cannot exceed 1000 characters'],
    },
    generatedQuestions: {
        type: QuestionPaperSchema,
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed'],
        default: 'pending',
        required: true,
    },
    jobId: {
        type: String,
        default: null,
    },
    errorMessage: {
        type: String,
        default: null,
    },
    pdfUrl: {
        type: String,
        default: null,
    },
    pdfGeneratedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

// Indexes for performance
AssignmentSchema.index({ status: 1, createdAt: -1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ subject: 1, class: 1 });
AssignmentSchema.index({ jobId: 1 });

// Virtual for checking if assignment is overdue
AssignmentSchema.virtual('isOverdue').get(function () {
    return this.status !== 'completed' && new Date() > this.dueDate;
});

AssignmentSchema.virtual('progressPercentage').get(function () {
    if (!this.generatedQuestions || !this.generatedQuestions.sections) return 0;
    const totalQuestions = this.getQuestionCount();
    return Math.min(100, Math.round((totalQuestions / this.numberOfQuestions) * 100));
});

AssignmentSchema.methods.calculateTotalMarks = function (): number {
    if (!this.generatedQuestions || !this.generatedQuestions.sections) {
        return 0;
    }

    return this.generatedQuestions.sections.reduce((total: number, section: ISection) => {
        return total + section.questions.reduce((sectionTotal, question) => {
            return sectionTotal + question.marks;
        }, 0);
    }, 0);
};

AssignmentSchema.methods.getQuestionCount = function (): number {
    if (!this.generatedQuestions || !this.generatedQuestions.sections) {
        return 0;
    }

    return this.generatedQuestions.sections.reduce((total: number, section: ISection) => {
        return total + section.questions.length;
    }, 0);
};

// Static Methods
AssignmentSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

AssignmentSchema.statics.getOverdueAssignments = function() {
  return this.find({
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() },
  }).sort({ dueDate: 1 });
};

// Pre-save middleware
AssignmentSchema.pre('save', function(next) {
  // Validate that generated questions match the requested count
  if (this.generatedQuestions && this.generatedQuestions.sections) {
    const actualCount = this.getQuestionCount();
    if (actualCount !== this.numberOfQuestions) {
      console.warn(`Question count mismatch: expected ${this.numberOfQuestions}, got ${actualCount}`);
    }
  }
  next();
});

// Create and export the model
export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;