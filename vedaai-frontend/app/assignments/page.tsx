'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, MoreVertical, Calendar, Clock, Eye, Trash2, Plus, SlidersHorizontal, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { IAssignment } from '@/types/assignment';
import { getAllAssignments, deleteAssignment, type PaginationMeta } from '@/utils/axios';
import { initializeSocket } from '@/utils/socket';

function AssignmentCard({ assignment, onDelete, progress }: { assignment: IAssignment; onDelete: (id: string) => void; progress?: { progress: number; message: string } }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAssignment(assignment._id);
      onDelete(assignment._id);
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      alert('Failed to delete assignment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative min-h-37.5 justify-between flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug">
            {assignment.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
            assignment.status === 'generating' ? 'bg-blue-100 text-blue-800' :
            assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            assignment.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
          </span>
          <div ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <Link
                  href={`/assignments/${assignment._id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="w-4 h-4" />
                  View Assignment
                </Link>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
        {assignment.status === 'failed' && assignment.errorMessage && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mt-2">
            {assignment.errorMessage}
          </p>
        )}
        {assignment.status === 'generating' && progress && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-gray-600">{progress.message}</p>
              <p className="text-xs text-gray-500 font-medium">{progress.progress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            <span className="font-medium text-gray-700">Assigned on</span>{' '}
            {format(assignment.createdAt, 'dd-MM-yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>
            <span className="font-medium text-gray-700">Due</span>{' '}
            {format(assignment.dueDate, 'dd-MM-yyyy')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, { progress: number; message: string }>>({});

  const LIMIT = 10;

  // Initialize socket on mount
  useEffect(() => {
    const socket = initializeSocket();
    console.log('[AssignmentsPage] Socket initialized:', socket?.id);
  }, []);

  // Set up socket event listeners for all assignments
  useEffect(() => {
    const loadSocketListeners = async () => {
      const { onAssessmentProgress, onAssessmentCompleted, onAssessmentFailed } = await import('@/utils/socket');

      const handleProgress = (data: any) => {
        console.log('[AssignmentsPage] Progress event:', data);
        setProgressMap(prev => ({
          ...prev,
          [data.assignmentId]: { progress: data.progress, message: data.message }
        }));
        setAssignments(prev =>
          prev.map(a =>
            a._id === data.assignmentId ? { ...a, status: 'generating' } : a
          )
        );
      };

      const handleCompleted = (data: any) => {
        console.log('[AssignmentsPage] Completed event:', data);
        setProgressMap(prev => {
          const newMap = { ...prev };
          delete newMap[data.assignmentId];
          return newMap;
        });
        setAssignments(prev =>
          prev.map(a =>
            a._id === data.assignmentId ? { ...a, status: 'completed' } : a
          )
        );
      };

      const handleFailed = (data: any) => {
        console.log('[AssignmentsPage] Failed event:', data);
        setProgressMap(prev => {
          const newMap = { ...prev };
          delete newMap[data.assignmentId];
          return newMap;
        });
        setAssignments(prev =>
          prev.map(a =>
            a._id === data.assignmentId
              ? { ...a, status: 'failed', errorMessage: data.error }
              : a
          )
        );
      };

      onAssessmentProgress(handleProgress);
      onAssessmentCompleted(handleCompleted);
      onAssessmentFailed(handleFailed);
    };

    loadSocketListeners();
  }, []);

  // Join assessment rooms when assignments load
  useEffect(() => {
    const joinRooms = async () => {
      const { joinAssessmentRoom } = await import('@/utils/socket');
      assignments.forEach(assignment => {
        joinAssessmentRoom(assignment._id);
      });
    };

    if (assignments.length > 0) {
      joinRooms();
    }
  }, [assignments]);

  const fetchAssignments = useCallback(async (search: string, skip = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAllAssignments({
        search: search || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: LIMIT,
        skip,
      });
      setAssignments(res.data);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load assignments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteAssignment = useCallback((assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a._id !== assignmentId));
    if (pagination) {
      setPagination(prev => prev ? { ...prev, total: prev.total - 1 } : null);
    }
  }, [pagination]);

  useEffect(() => {
    fetchAssignments('');
  }, [fetchAssignments]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAssignments(searchTerm);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm, fetchAssignments]);

  const handleNextPage = () => {
    if (pagination?.hasMore) {
      fetchAssignments(searchTerm, pagination.skip + LIMIT);
    }
  };

  const handlePrevPage = () => {
    if (pagination && pagination.skip > 0) {
      fetchAssignments(searchTerm, Math.max(0, pagination.skip - LIMIT));
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen p-4 sm:p-6 lg:p-8 ">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <h1 className="text-xl font-bold text-gray-900">Assignments</h1>
          </div>
          <p className="text-sm text-gray-500 pl-4">Manage and create assignments for your classes.</p>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3 bg-white rounded-3xl py-3 px-5">
          <button className="flex items-center gap-2 text-sm text-[#A9A9A9] font-semibold hover:text-gray-700 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            Filter By
          </button>

          <div className="relative w-full max-w-xs sm:max-w-sm rounded-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Assignment"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-white focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={() => fetchAssignments(searchTerm)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        ) : assignments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <AssignmentCard 
                  key={assignment._id} 
                  assignment={assignment}
                  onDelete={handleDeleteAssignment}
                  progress={progressMap[assignment._id]}
                />
              ))}
            </div>

            {pagination && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.skip === 0}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  {pagination.skip + 1}–{Math.min(pagination.skip + LIMIT, pagination.total)} of {pagination.total}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-125 py-20">
            <div className="mb-8">
              <img 
                src="/VedaNoAssignment.png" 
                alt="No assignments yet" 
                className="w-64 h-auto object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-sm text-gray-600 max-w-md text-center mb-8">
              Create your first assignment to start collecting and grading student submissions. You can set up marking criteria and let AI assist with grading.
            </p>
            <Link
              href="/assignments/create"
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Your First Assignment
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}