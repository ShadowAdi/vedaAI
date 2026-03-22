import { useEffect } from 'react';
import {
  getSocket,
  joinAssessmentRoom,
  onAssessmentProgress,
  onAssessmentCompleted,
  onAssessmentFailed,
  offAssessmentProgress,
  offAssessmentCompleted,
  offAssessmentFailed,
} from '@/utils/socket';

interface AssessmentProgressData {
  assignmentId: string;
  status: string;
  progress: number;
  message: string;
}

interface AssessmentCompletedData {
  assignmentId: string;
  status: string;
  progress: number;
  data: any;
}

interface AssessmentFailedData {
  assignmentId: string;
  status: string;
  error: string;
}

interface UseAssessmentSocketOptions {
  onProgress?: (data: AssessmentProgressData) => void;
  onCompleted?: (data: AssessmentCompletedData) => void;
  onFailed?: (data: AssessmentFailedData) => void;
}

export const useAssessmentSocket = (
  assignmentId: string | null,
  options: UseAssessmentSocketOptions = {}
) => {
  const { onProgress, onCompleted, onFailed } = options;

  useEffect(() => {
    if (!assignmentId) return;

    const socket = getSocket();
    if (!socket) {
      console.warn('[useAssessmentSocket] Socket not initialized');
      return;
    }

    // Join the assessment room
    joinAssessmentRoom(assignmentId);

    // Set up event listeners
    if (onProgress) {
      onAssessmentProgress(onProgress);
    }

    if (onCompleted) {
      onAssessmentCompleted(onCompleted);
    }

    if (onFailed) {
      onAssessmentFailed(onFailed);
    }

    // Cleanup on unmount
    return () => {
      offAssessmentProgress();
      offAssessmentCompleted();
      offAssessmentFailed();
    };
  }, [assignmentId, onProgress, onCompleted, onFailed]);
};
