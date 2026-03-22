'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, Upload, X, Plus, Minus, ChevronLeft, ChevronRight, UploadCloud, Loader2 } from 'lucide-react';
import { createAssignment } from '@/utils/axios';

const questionTypeSchema = z.object({
  type: z.string(),
  count: z.number().min(1).max(20),
  marks: z.number().min(1).max(10),
});

const schema = z.object({
  title: z.string().optional(),
  dueDate: z.date(),
  questionTypes: z.array(questionTypeSchema).min(1, 'At least one question type required'),
  additionalInstructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
  'True/False',
] as const;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      questionTypes: [
        { type: 'Multiple Choice Questions', count: 4, marks: 1 },
      ],
      additionalInstructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questionTypes',
  });

  const questionTypes = watch('questionTypes');
  const dueDate = watch('dueDate');
  
  const totalQuestions = questionTypes.reduce((sum, q) => sum + q.count, 0);
  const totalMarks = questionTypes.reduce((sum, q) => sum + (q.count * q.marks), 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'text/plain'];
      const allowedExtensions = ['.pdf', '.txt'];
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (allowedTypes.includes(selectedFile.type) || allowedExtensions.includes(fileExtension)) {
        if (selectedFile.size <= 10 * 1024 * 1024) { 
          setFile(selectedFile);
        } else {
          alert('File size must be under 10MB');
        }
      } else {
        alert('Only PDF and TXT files are allowed');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const allowedTypes = ['application/pdf', 'text/plain'];
      const allowedExtensions = ['.pdf', '.txt'];
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (allowedTypes.includes(selectedFile.type) || allowedExtensions.includes(fileExtension)) {
        if (selectedFile.size <= 10 * 1024 * 1024) {
          setFile(selectedFile);
        } else {
          alert('File size must be under 10MB');
        }
      } else {
        alert('Only PDF and TXT files are allowed');
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await createAssignment({
        title: data.title,
        file: file ?? undefined,
        dueDate: data.dueDate,
        questionTypes: data.questionTypes.map(q => q.type),
        numberOfQuestions: totalQuestions,
        totalMarks: totalMarks,
        additionalInstructions: data.additionalInstructions || '',
      });

      router.push(`/assignments/`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create assignment';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
        <div className="mb-8 px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Assignment</h1>
          <p className="text-sm text-gray-500">Set up a new assignment for your students</p>
        </div>
      <div className="max-w-4xl mx-auto p-8">

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 ">
          <div className="bg-[#FFFFFF80] rounded-xl p-8 border-white border">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Assignment Details</h2>
            <p className="text-sm text-gray-500 mb-8">Basic information about your assignment</p>

            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-900 mb-3">Title</label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Physics Laws of Motion"
                className="w-full px-5 py-3 border border-gray-300 rounded-full outline-none text-sm hover:border-gray-400 transition-colors"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">Leave blank to auto-generate from file name</p>
            </div>

            <div className="mb-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer bg-white
                  ${isDragging ? 'bg-gray-100' : 'border-gray-300 hover:border-gray-400 hover:bg-[#FFFFFF]'}
                `}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.txt"
                  id="file-upload"
                />
                <div className="space-y-4 flex flex-col items-center justify-center">
                    <UploadCloud className="w-8 h-8 text-black" />
                  <div>
                    <p className="text-base font-medium text-[#303030] mb-1">
                      {file ? file.name : 'Choose a file or drag & drop it here'}
                    </p>
                    <p className="text-sm text-[#A9A9A9]">PDF, TXT upto 10MB</p>
                  </div>
                  {!file && (
                    <label 
                      htmlFor="file-upload"
                      className="inline-block px-6 py-2.5 bg-[#F6F6F6]  text-[#303030] font-medium rounded-full hover:bg-[#ececec] transition-colors cursor-pointer"
                    >
                      Browse Files
                    </label>
                  )}
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }}
                      className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-3">Upload images of your preferred document/image</p>
            </div>

            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-900 mb-3">Due Date</label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className="relative w-full" ref={calendarRef}>
                    <div
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="flex items-center justify-between w-full px-5 py-3 border border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 bg-white transition-all duration-200 hover:shadow-sm"
                    >
                      <span className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                        {value ? format(value, 'dd-MM-yyyy') : 'DD-MM-YYYY'}
                      </span>
                      <Calendar className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isCalendarOpen && (
                      <div className="absolute z-50 mt-3 left-0 right-0 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                        <style>{`
                          .calendar-wrapper .rdp {
                            --rdp-cell-size: 40px;
                            --rdp-accent-color: #1f2937;
                            --rdp-background-color: #dbeafe;
                          }
                          .calendar-wrapper .rdp-month {
                            width: 100%;
                          }
                          .calendar-wrapper .rdp-caption {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 1.5rem;
                            padding: 0;
                          }
                          .calendar-wrapper .rdp-caption_label {
                            font-size: 1rem;
                            font-weight: 700;
                            color: #111827;
                          }
                          .calendar-wrapper .rdp-nav {
                            display: flex;
                            gap: 0.5rem;
                          }
                          .calendar-wrapper .rdp-nav_button {
                            width: 36px;
                            height: 36px;
                            padding: 0;
                            background: #f3f4f6;
                            border: none;
                            border-radius: 0.5rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background-color 0.15s;
                          }
                          .calendar-wrapper .rdp-nav_button:hover {
                            background: #e5e7eb;
                          }
                          .calendar-wrapper .rdp-head_cell {
                            font-size: 0.75rem;
                            font-weight: 700;
                            color: #4b5563;
                            text-transform: uppercase;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 0;
                          }
                          .calendar-wrapper .rdp-cell {
                            padding: 0;
                            text-align: center;
                          }
                          .calendar-wrapper .rdp-day {
                            width: 40px;
                            height: 40px;
                            border-radius: 0.5rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.15s;
                          }
                          .calendar-wrapper .rdp-day:hover:not(.rdp-day_disabled) {
                            background: #eff6ff;
                          }
                          .calendar-wrapper .rdp-day_selected {
                            background: #1f2937;
                            color: white;
                            font-weight: 700;
                          }
                          .calendar-wrapper .rdp-day_selected:hover {
                            background: #111827;
                          }
                          .calendar-wrapper .rdp-day_today {
                            background: #dbeafe;
                            color: #1f2937;
                            font-weight: 700;
                            box-shadow: inset 0 0 0 2px #3b82f6;
                          }
                          .calendar-wrapper .rdp-day_outside {
                            color: #d1d5db;
                            opacity: 0.5;
                          }
                          .calendar-wrapper .rdp-day_disabled {
                            color: #d1d5db;
                            opacity: 0.5;
                            cursor: not-allowed;
                          }
                        `}</style>
                        <div className="calendar-wrapper">
                          <DayPicker
                            mode="single"
                            selected={value}
                            onSelect={(date) => {
                              if (date) {
                                onChange(date);
                                setIsCalendarOpen(false);
                              }
                            }}
                            disabled={{ before: new Date() }}
                          />
                        </div>
                        <div className="border-t border-gray-100 mt-4 pt-4 flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                          >
                            Cancel
                          </button>
                          {value && (
                            <button
                              type="button"
                              onClick={() => {
                                onChange(undefined);
                                setIsCalendarOpen(false);
                              }}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-150"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
              {errors.dueDate && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
              </div>

              <div className="flex items-center justify-between mb-2 px-4">
                <span className="flex-1 block text-base font-semibold text-gray-900">Question Type</span>
                <span className="text-sm font-semibold text-gray-700 w-36 text-center">No. of Questions</span>
                <span className="text-sm font-semibold text-gray-700 w-28 text-center">Marks</span>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3  rounded-xl px-4 py-3 transition-colors">
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        {...register(`questionTypes.${index}.type`)}
                        className="flex-1 px-5 py-2.5 border border-gray-300 rounded-full outline-none text-sm bg-white appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => fields.length > 1 && remove(index)}
                        className={`p-1.5 rounded-full transition-colors ${fields.length > 1 ? 'text-stone-900 hover:text-red-600 hover:bg-red-50 cursor-pointer' : 'text-stone-900 cursor-not-allowed'}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 px-1 space-x-3 rounded-full justify-center bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          const currentValue = questionTypes[index].count;
                          if (currentValue > 1) {
                            setValue(`questionTypes.${index}.count`, currentValue - 1);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <span className="text-xl leading-none">−</span>
                      </button>
                      <span className="w-8 text-center text-base font-semibold text-gray-900 tabular-nums">
                        {questionTypes[index]?.count ?? 0}
                      </span>
                      <input type="hidden" {...register(`questionTypes.${index}.count`, { valueAsNumber: true })} />
                      <button
                        type="button"
                        onClick={() => {
                          const currentValue = questionTypes[index].count;
                          if (currentValue < 20) {
                            setValue(`questionTypes.${index}.count`, currentValue + 1);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <span className="text-xl leading-none">+</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-full px-1 justify-center bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          const currentValue = questionTypes[index].marks;
                          if (currentValue > 1) {
                            setValue(`questionTypes.${index}.marks`, currentValue - 1);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <span className="text-xl leading-none">−</span>
                      </button>
                      <span className="w-8 text-center text-lg font-semibold text-gray-900 tabular-nums">
                        {questionTypes[index]?.marks ?? 0}
                      </span>
                      <input type="hidden" {...register(`questionTypes.${index}.marks`, { valueAsNumber: true })} />
                      <button
                        type="button"
                        onClick={() => {
                          const currentValue = questionTypes[index].marks;
                          if (currentValue < 10) {
                            setValue(`questionTypes.${index}.marks`, currentValue + 1);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <span className="text-xl leading-none">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => append({ type: 'Short Questions', count: 3, marks: 2 })}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-full">
                  <Plus className="w-6 h-6" />
                </div>
                Add Question Type
              </button>

              <div className="flex justify-end gap-2 pt-4 text-sm flex-col">
                <div className="text-right">
                  <span className="text-stone-950">Total Questions : </span>
                  <span className="font-semibold text-stone-950">{totalQuestions}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-950">Total Marks : </span>
                  <span className="font-semibold text-stone-950">{totalMarks}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-base font-semibold text-gray-900 mb-3">
                Additional Information (For better output)
              </label>
              <div className="relative">
                <textarea
                  {...register('additionalInstructions')}
                  rows={4}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg outline-none resize-none text-sm"
                />
                <button
                  type="button"
                  className="absolute bottom-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                 
                </button>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-500 text-center">{submitError}</p>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full bg-white cursor-pointer transition-colors flex items-center gap-2 group disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              Previous
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors flex items-center gap-2 cursor-pointer group shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create Assignment
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}