import { create } from 'zustand';
import { IAssignment, ICreateAssignmentDto } from '@/types/assignment';

interface AssignmentState {
  assignments: IAssignment[];
  currentAssignment: IAssignment | null;
  isLoading: boolean;
  error: string | null;
  
  setAssignments: (assignments: IAssignment[]) => void;
  addAssignment: (assignment: IAssignment) => void;
  updateAssignment: (id: string, assignment: Partial<IAssignment>) => void;
  deleteAssignment: (id: string) => void;
  setCurrentAssignment: (assignment: IAssignment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,

  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) => set((state) => ({ 
    assignments: [...state.assignments, assignment] 
  })),
  updateAssignment: (id, assignment) => set((state) => ({
    assignments: state.assignments.map((a) => 
      a._id === id ? { ...a, ...assignment } : a
    ),
    currentAssignment: state.currentAssignment?._id === id 
      ? { ...state.currentAssignment, ...assignment }
      : state.currentAssignment
  })),
  deleteAssignment: (id) => set((state) => ({
    assignments: state.assignments.filter((a) => a._id !== id)
  })),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));