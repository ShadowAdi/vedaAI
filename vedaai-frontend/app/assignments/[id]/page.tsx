'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { IAssignment, IQuestionPaper } from '@/types/assignment';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import dynamic from 'next/dynamic';
import { getAssignmentById, regenerateAssignment, downloadAssignmentPDF } from '@/utils/axios';

const DashboardLayout = dynamic(() => import('@/components/layout/DashboardLayout'), { ssr: false });

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'medium':
    case 'moderate':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'hard':
    case 'challenging':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function AssignmentOutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [questionPaper, setQuestionPaper] = useState<IQuestionPaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAssignment = async () => {
    if (!mounted) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAssignmentById(id);
      
      if (!res.data) {
        setError('Assignment not found');
        setTimeout(() => router.push('/assignments'), 2000);
        return;
      }
      
      setAssignment(res.data);
      if (res.data.generatedQuestions) {
        setQuestionPaper(res.data.generatedQuestions);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load assignment';
      setError(message);
      setTimeout(() => router.push('/assignments'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchAssignment();
    }
  }, [id, mounted]);

  const handleRegenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
            await regenerateAssignment(id);
      

      const pollInterval = setInterval(async () => {
        try {
          const res = await getAssignmentById(id);
          
          if (res.data.status === 'completed' && res.data.generatedQuestions) {
            setAssignment(res.data);
            setQuestionPaper(res.data.generatedQuestions);
            setIsGenerating(false);
            clearInterval(pollInterval);
          } else if (res.data.status === 'failed') {
            setError(res.data.errorMessage || 'Generation failed');
            setIsGenerating(false);
            clearInterval(pollInterval);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setIsGenerating(false);
          const message = err instanceof Error ? err.message : 'Polling failed';
          setError(message);
        }
      }, 2000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsGenerating(false);
      }, 300000);
    } catch (err) {
      setIsGenerating(false);
      const message = err instanceof Error ? err.message : 'Failed to regenerate assignment';
      setError(message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const response = await downloadAssignmentPDF(id);
      
      if (response.data.pdfUrl) {
        const link = document.createElement('a');
        link.href = response.data.pdfUrl;
        link.download = response.data.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download PDF';
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col py-6 px-4 md:px-6">
        {!mounted && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}

        {mounted && isLoading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        )}

        {mounted && !isLoading && error && (
          <div className="text-center py-32">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchAssignment}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {mounted && !isLoading && !error && assignment && !questionPaper && (
          <div className="text-center py-32">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {assignment.status === 'generating'
                ? 'Questions are being generated…'
                : assignment.status === 'failed'
                  ? assignment.errorMessage || 'Generation failed.'
                  : 'Waiting for generation to start…'}
            </p>
            {assignment.status === 'failed' && (
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={clsx('w-4 h-4', isGenerating && 'animate-spin')} />
                Regenerate
              </button>
            )}
            {(assignment.status === 'pending' || assignment.status === 'generating') && (
              <button
                onClick={fetchAssignment}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            )}
          </div>
        )}

        {mounted && !isLoading && !error && assignment && questionPaper && (
          <>
            <div className="mb-6 flex justify-between items-center print:hidden">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{assignment.title || 'Question Paper'}</h1>
                <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Download className={clsx('w-4 h-4', isDownloading && 'animate-spin')} />
                  Download as PDF
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={clsx('w-4 h-4', isGenerating && 'animate-spin')} />
                  Regenerate
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white shadow-lg p-8 md:p-12 print:shadow-none print:p-0 print:bg-white">
                <div className="text-center  pb-4 mb-6">
                  {assignment.subject && (
                    <p className="text-base text-gray-700">
                      <span className="font-semibold">Subject:</span> {assignment.subject}
                    </p>
                  )}
                  {assignment.class && (
                    <p className="text-base text-gray-700">
                      <span className="font-semibold">Class:</span> {assignment.class}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mb-6 text-sm md:text-base">
                  <div>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold">Maximum Marks:</span> {assignment.totalMarks}</p>
                  </div>
                </div>

                <div className="mb-6 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  <p>• All questions are compulsory unless stated otherwise.</p>
                  {assignment.additionalInstructions && <p>• {assignment.additionalInstructions}</p>}
                </div>

                <div className="mb-8 space-y-2 border-b border-gray-200 pb-6">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold w-40">Name:</span>
                    <div className="flex-1 border-b border-gray-400 min-h-6"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold w-40">Roll Number:</span>
                    <div className="flex-1 border-b border-gray-400 min-h-6"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold w-40">Class & Section:</span>
                    <div className="flex-1 border-b border-gray-400 min-h-6"></div>
                  </div>
                </div>

                {questionPaper.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-10">
                    <div className="mb-4">
                      <h3 className="text-center font-bold text-lg md:text-xl text-gray-900 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 italic text-center">
                        {section.instruction}
                      </p>
                    </div>

                    <div className="space-y-5">
                      {section.questions.map((question, qIndex) => {
                        const globalQIndex = questionPaper.sections
                          .slice(0, sectionIndex)
                          .reduce((acc, s) => acc + s.questions.length, 0) + qIndex + 1;
                        
                        return (
                          <div 
                            key={qIndex} 
                            className="flex gap-4 print:gap-3"
                          >
                            <div className="shrink-0">
                              <span className="font-semibold text-gray-900 text-lg">
                                {globalQIndex}.
                              </span>
                            </div>

                            <div className="flex-1">
                              <p className="text-gray-900 text-base leading-relaxed mb-2 print:text-sm">
                                {question.text}
                              </p>
                              
                              <div className="flex items-center gap-3 flex-wrap text-xs md:text-sm">
                                <span className={clsx(
                                  'px-2 py-1 rounded border font-medium capitalize inline-block',
                                  getDifficultyColor(question.difficulty)
                                )}>
                                  {question.difficulty}
                                </span>
                                <span className="text-gray-600 font-medium">
                                  [{question.marks} Mark{question.marks !== 1 ? 's' : ''}]
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {sectionIndex < questionPaper.sections.length - 1 && (
                      <div className="my-8 border-t border-gray-200"></div>
                    )}
                  </div>
                ))}

                <div className="mt-12 pt-8 border-t-2 border-gray-900 text-center">
                  <p className="font-bold text-gray-900 text-lg">End of Question Paper</p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}