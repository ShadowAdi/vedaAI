import axios from "axios";
import type {
  IAssignment,
  ICreateAssignmentDto,
} from "@/types/assignment";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api/"
    : "http://localhost:5000/api/");

const api = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});


export interface PaginationMeta {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

export interface GetAllAssignmentsResponse {
  success: boolean;
  data: IAssignment[];
  pagination: PaginationMeta;
}

export interface GetAssignmentByIdResponse {
  success: boolean;
  data: IAssignment;
  source: "cache" | "db";
}

export interface CreateAssignmentResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    jobId: string;
    status: string;
    estimatedTime: string;
  };
}

export interface RegenerateAssignmentResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    jobId: string;
    status: string;
  };
}

export interface DeleteAssignmentResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
  };
}

export interface DownloadAssignmentResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    pdfUrl: string;
    fileName: string;
  };
}

export interface GetAllAssignmentsParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  skip?: number;
}


export const getAllAssignments = async (
  params: GetAllAssignmentsParams = {}
): Promise<GetAllAssignmentsResponse> => {
  const { data } = await api.get<GetAllAssignmentsResponse>("/assignment", {
    params,
  });
  return data;
};

export const getAssignmentById = async (
  assessmentId: string
): Promise<GetAssignmentByIdResponse> => {
  const { data } = await api.get<GetAssignmentByIdResponse>(
    `/assignment/${assessmentId}`
  );
  return data;
};

export const createAssignment = async (
  payload: ICreateAssignmentDto
): Promise<CreateAssignmentResponse> => {
  const formData = new FormData();

  if (payload.title) formData.append("title", payload.title);
  formData.append("dueDate", new Date(payload.dueDate).toISOString());
  formData.append("numberOfQuestions", String(payload.numberOfQuestions));
  formData.append("totalMarks", String(payload.totalMarks));
  if (payload.additionalInstructions) {
    formData.append("additionalInstructions", payload.additionalInstructions);
  }

  payload.questionTypes.forEach((qt) =>
    formData.append("questionTypes", qt)
  );

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const { data } = await api.post<CreateAssignmentResponse>(
    "/assignment",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
};

export const regenerateAssignment = async (
  assessmentId: string
): Promise<RegenerateAssignmentResponse> => {
  const { data } = await api.post<RegenerateAssignmentResponse>(
    `/assignment/${assessmentId}/regenerate`
  );
  return data;
};

export const deleteAssignment = async (
  assessmentId: string
): Promise<DeleteAssignmentResponse> => {
  const { data } = await api.delete<DeleteAssignmentResponse>(
    `/assignment/${assessmentId}`
  );
  return data;
};

export const downloadAssignmentPDF = async (
  assessmentId: string
): Promise<DownloadAssignmentResponse> => {
  const { data } = await api.get<DownloadAssignmentResponse>(
    `/assignment/download/${assessmentId}`
  );
  return data;
};

export default api;
