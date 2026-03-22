# VedaAI Frontend - Complete Documentation

## 📋 Project Overview

**VedaAI Frontend** is a modern Next.js 16 application built with React 19, TypeScript, and Tailwind CSS. It's a dashboard system for creating and managing AI-generated assignments/assessments with real-time progress tracking via WebSockets.

---

## 🚀 Tech Stack

### Core Framework
- **Next.js**: 16.2.0 (App Router, Server & Client Components)
- **React**: 19.2.4 (Latest with new features)
- **TypeScript**: 5.x (Type-safe development)

### State Management
- **Zustand**: 5.0.12 (Lightweight state management for assignments)

### Form & Validation
- **React Hook Form**: 7.71.2 (Performant form handling)
- **Zod**: 4.3.6 (TypeScript-first schema validation)
- **@hookform/resolvers**: 5.2.2 (Zod integration with React Hook Form)

### Real-time Communication
- **Socket.IO Client**: 4.8.3 (WebSocket implementation for real-time updates)

### UI & Styling
- **Tailwind CSS**: 4.x (Utility-first CSS framework)
- **Lucide React**: 0.577.0 (Beautiful SVG icons)
- **Radix UI Components**: (@radix-ui/react-popover, @radix-ui/react-slot)
- **Tailwind Merge**: 3.5.0 (Smart class merging utility)

### Utilities
- **Axios**: 1.13.6 (HTTP client for API calls)
- **Date-fns**: 4.1.0 (Date manipulation library)
- **CLSX**: 2.1.1 (Conditional class names)

### Testing & Linting
- **ESLint**: 9.x (Code quality)
- **Next.js ESLint Config**: Integrated with Next.js 16

---

## 🏗️ Project Structure

```
vedaai-frontend/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Home page
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles
│   ├── not-found.tsx                 # 404 page
│   └── assignments/                  # Assignment routes
│       ├── page.tsx                  # List all assignments
│       ├── create/
│       │   └── page.tsx              # Create new assignment
│       └── [id]/
│           └── page.tsx              # View assignment details
│
├── components/                       # Reusable React components
│   ├── layout/
│   │   ├── DashboardLayout.tsx       # Main dashboard wrapper
│   │   ├── Header.tsx                # Navigation header
│   │   └── Sidebar.tsx               # Navigation sidebar
│   └── providers/
│       └── SocketProvider.tsx        # Socket.IO provider (wraps app)
│
├── hooks/                            # Custom React hooks
│   └── useAssessmentSocket.ts        # Socket event listener hook
│
├── store/                            # State management (Zustand)
│   └── assignmentStore.ts            # Assignment state & actions
│
├── types/                            # TypeScript interfaces & types
│   └── assignment.ts                 # Assignment data models
│
├── utils/                            # Utility functions
│   ├── axios.ts                      # Configured API client
│   ├── socket.ts                     # Socket.IO setup & helpers
│   └── [other utilities]
│
├── public/                           # Static assets
│
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies & scripts
└── eslint.config.mjs                 # ESLint rules

```

---

## 🔌 Socket.IO Implementation - The Socket Issue Solution

### Problem Solved
The initial challenge was implementing **real-time progress updates** for background AI tasks (assignment generation). Socket.IO was chosen to push progress updates from the backend to the frontend instantly without polling.

### Solution Architecture

#### 1. **Socket Initialization** (`utils/socket.ts`)

```typescript
// Initialize once when app loads
export const initializeSocket = (): Socket => {
  if (socket) return socket;

  socket = io(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection handlers
  socket.on('connect', () => console.log('Connected'));
  socket.on('disconnect', () => console.log('Disconnected'));
  socket.on('error', (error) => console.error('Error:', error));

  return socket;
};
```

**Key Features:**
- Singleton pattern (only one connection)
- Automatic reconnection with exponential backoff
- Error handling built-in

#### 2. **Socket Provider** (`components/providers/SocketProvider.tsx`)

```typescript
'use client';

export const SocketProvider = ({ children }) => {
  useEffect(() => {
    const socket = initializeSocket();
    return () => {
      // Socket persists across page navigation
    };
  }, []);

  return <>{children}</>;
};
```

**Implementation Details:**
- Wraps entire app to ensure Socket.IO is always active
- Client-side component (`'use client'`)
- Initialized once in root layout

#### 3. **Socket Helper Functions** (`utils/socket.ts`)

```typescript
// Join a specific room for assignment updates
export const joinAssessmentRoom = (assignmentId: string) => {
  socket.emit('join:assessment', assignmentId);
};

// Listen to progress updates
export const onAssessmentProgress = (callback) => {
  socket.on('assessment:progress', callback);
};

// Listen to completion
export const onAssessmentCompleted = (callback) => {
  socket.on('assessment:completed', callback);
};

// Listen to failures
export const onAssessmentFailed = (callback) => {
  socket.on('assessment:failed', callback);
};

// Cleanup listeners
export const offAssessmentProgress = () => {
  socket.off('assessment:progress');
};
```

#### 4. **useAssessmentSocket Hook** (`hooks/useAssessmentSocket.ts`)

```typescript
export const useAssessmentSocket = (
  assignmentId: string | null,
  options: UseAssessmentSocketOptions = {}
) => {
  const { onProgress, onCompleted, onFailed } = options;

  useEffect(() => {
    if (!assignmentId) return;

    joinAssessmentRoom(assignmentId);

    if (onProgress) onAssessmentProgress(onProgress);
    if (onCompleted) onAssessmentCompleted(onCompleted);
    if (onFailed) onAssessmentFailed(onFailed);

    return () => {
      offAssessmentProgress();
      offAssessmentCompleted();
      offAssessmentFailed();
    };
  }, [assignmentId, onProgress, onCompleted, onFailed]);
};
```

**Why This Approach Works:**
- ✅ Automatic room joining based on assignmentId
- ✅ Proper event listener cleanup (prevents memory leaks)
- ✅ Type-safe callbacks
- ✅ Reusable across components

### How It's Used in Pages

**In Assignment List Page** (`/assignments`):
```typescript
// Listen to progress for multiple assignments
useAssessmentSocket(assignment._id, {
  onProgress: (data) => {
    // Update UI with progress
    updateProgress(data.progress);
  },
  onCompleted: (data) => {
    // Refresh assignment data
    refreshAssignment();
  },
  onFailed: (data) => {
    // Show error message
    showError(data.error);
  },
});
```

**In Assignment Detail Page** (`/assignments/[id]`):
```typescript
// Polling + Socket for redundancy
const handleRegenerate = async () => {
  await regenerateAssignment(id);
  
  // Use polling as backup
  const pollInterval = setInterval(async () => {
    const res = await getAssignmentById(id);
    if (res.data.status === 'completed') {
      // Update UI
    }
  }, 2000);
};
```

### Environment Configuration

**`.env.local` (you need to set this):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
```

**Why split URLs:**
- API calls might need different path (with `/api/`)
- Socket.IO connects to root URL

---

## 📄 Pages Created

### 1. **Home Page** (`/` → `app/page.tsx`)
- Default Next.js starter page
- Could be extended to include landing page or redirect to dashboard
- Currently shows template content

### 2. **Assignments List Page** (`/assignments` → `app/assignments/page.tsx`)

**Features:**
- 📊 Display all assignments in card layout
- 🔍 Search assignments by title
- 📑 Pagination support
- 🎯 Status indicators (pending, generating, completed, failed)
- ⚡ Real-time progress updates via Socket.IO
- 👀 View assignment details
- 🗑️ Delete assignments
- ➕ Quick link to create new assignment

**Key Components:**
- `AssignmentCard`: Individual assignment display with:
  - Status badge
  - Progress bar (during generation)
  - Dropdown menu (View, Delete)
  - Error messages
  
**State Management:**
- Local state for assignments, pagination, search
- Zustand store integration for global state
- Socket.IO for real-time updates

**Example Progress Updates:**
```
Status: generating
Progress: 35%
Message: "Generating questions section 2/5"
```

### 3. **Create Assignment Page** (`/assignments/create` → `app/assignments/create/page.tsx`)

**Features:**
- 📋 Multi-step form for assignment creation
- 📄 File upload (PDF/TXT support, max 10MB)
- 🎯 Question type selection with count & marks per question
- 📅 Date picker for due date
- 💬 Additional instructions textarea
- 📊 Real-time calculation of total questions and marks
- ✅ Zod validation with detailed error messages

**Form Structure:**
```
Title (optional)
├── Due Date (required)
├── Question Types (minimum 1)
│   ├── Type selector (dropdown)
│   ├── Count of questions (1-20)
│   └── Marks per question (1-10)
├── File Upload (optional, PDF/TXT)
└── Additional Instructions (optional)
```

**Question Types Available:**
- Multiple Choice Questions
- Short Questions
- Diagram/Graph-Based Questions
- Numerical Problems
- Long Answer Questions
- True/False

**Validation:**
- At least one question type required
- Due date must be selected
- File size max 10MB
- Only PDF and TXT files allowed
- Dynamic calculation of total questions & marks

**On Submit:**
- Converts form data to FormData (for file upload)
- Calls `createAssignment` API
- Shows success message with job ID
- Redirects to assignments list

### 4. **Assignment Detail Page** (`/assignments/[id]` → `app/assignments/[id]/page.tsx`)

**Features:**
- 📖 Display generated question paper
- 📊 Organized by sections
- 🎯 Question difficulty levels (easy, medium, hard)
- 🔄 Regenerate assignment button
- ⬇️ Download as PDF
- ⏳ Polling for status updates (backup to Socket.IO)
- ❌ Error handling with auto-redirect

**Question Display:**
```
Section: English Literature
Instruction: Answer all questions
├── Question 1: [Text]
│   Difficulty: Medium (1 mark)
├── Question 2: [Text]
│   Difficulty: Hard (3 marks)
└── ...
```

**Status Display:**
- ⏳ Loading state with spinner
- 🟡 Pending (not yet generated)
- 🔵 Generating (with estimated time)
- ✅ Completed (display questions)
- ❌ Failed (show error message)

**Difficulty Color Coding:**
- 🟢 Easy: Green background
- 🟡 Medium/Moderate: Yellow background
- 🔴 Hard/Challenging: Red background

---

## 🔄 State Management (Zustand Store)

### Assignment Store (`store/assignmentStore.ts`)

```typescript
interface AssignmentState {
  // State
  assignments: IAssignment[];
  currentAssignment: IAssignment | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAssignments: (assignments: IAssignment[]) => void;
  addAssignment: (assignment: IAssignment) => void;
  updateAssignment: (id: string, assignment: Partial<IAssignment>) => void;
  deleteAssignment: (id: string) => void;
  setCurrentAssignment: (assignment: IAssignment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

**Usage Example:**
```typescript
const { assignments, isLoading } = useAssignmentStore();
const { updateAssignment } = useAssignmentStore();

// Update when socket progress received
updateAssignment(assignmentId, { 
  status: 'generating',
  progress: 50 
});
```

---

## 🌐 API Client (Axios Setup)

### Configuration (`utils/axios.ts`)

**Base Setup:**
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/',
  timeout: 30_000, // 30 seconds
  headers: { "Content-Type": "application/json" },
});
```

### API Endpoints

#### 1. Get All Assignments
```typescript
getAllAssignments(params?: GetAllAssignmentsParams)
// GET /assignment
// Query params: search, sortBy, sortOrder, limit, skip
// Returns: { success, data, pagination }
```

#### 2. Get Assignment by ID
```typescript
getAssignmentById(assessmentId: string)
// GET /assignment/{id}
// Returns: { success, data, source: 'cache' | 'db' }
```

#### 3. Create Assignment
```typescript
createAssignment(payload: ICreateAssignmentDto)
// POST /assignment (multipart/form-data)
// Form Fields: title, dueDate, numberOfQuestions, totalMarks, 
//              additionalInstructions, questionTypes[], file
// Returns: { success, message, data: { assignmentId, jobId, status, estimatedTime } }
```

#### 4. Regenerate Assignment
```typescript
regenerateAssignment(assessmentId: string)
// POST /assignment/{id}/regenerate
// Returns: { success, message, data: { assignmentId, jobId, status } }
```

#### 5. Delete Assignment
```typescript
deleteAssignment(assessmentId: string)
// DELETE /assignment/{id}
// Returns: { success, message, data: { assignmentId } }
```

#### 6. Download Assignment PDF
```typescript
downloadAssignmentPDF(assessmentId: string)
// GET /assignment/download/{id}
// Returns: { success, message, data: { assignmentId, pdfUrl, fileName } }
```

---

## 💾 TypeScript Types & Interfaces

### Assignment Interface
```typescript
interface IAssignment {
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
```

### Question Paper Structure
```typescript
interface IQuestion {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

interface IQuestionPaper {
  sections: ISection[];
}
```

### Create Assignment DTO
```typescript
interface ICreateAssignmentDto {
  title?: string;
  file?: File;
  dueDate: Date;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
}
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ (Next.js 16 requirement)
- npm or yarn package manager

### Installation Steps

```bash
# 1. Navigate to frontend directory
cd vedaai-frontend

# 2. Install dependencies
npm install

# 3. Create environment file
touch .env.local

# 4. Add environment variables to .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api/
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:3000
```

### Build for Production
```bash
npm run build  # Build optimized bundle
npm start      # Start production server
```

---

## 🛠️ Development Guide

### Running Locally

1. **Start Backend Service:**
   ```bash
   cd vedaAiBackend
   npm run dev
   ```
   (Ensure it runs on `http://localhost:5000`)

2. **Start Frontend:**
   ```bash
   cd vedaai-frontend
   npm run dev
   ```
   (Runs on `http://localhost:3000`)

3. **Open in Browser:**
   ```
   http://localhost:3000/assignments
   ```

### Hot Module Replacement (HMR)
- Next.js automatically reloads on file save
- Zustand state persists across HMR
- Socket connection is maintained

### Console Logging
- Socket connection logs: Check browser console
- API errors: Logged with axios interceptors
- Assignment progress: Visible in assignment cards

---

## 🔧 Common Tasks

### Adding a New Assignment Field

1. **Update Type** (`types/assignment.ts`):
   ```typescript
   interface IAssignment {
     // ... existing fields
     newField?: string; // Add here
   }
   ```

2. **Update Form** (`app/assignments/create/page.tsx`):
   ```typescript
   const schema = z.object({
     // ... existing fields
     newField: z.string().optional(),
   });
   ```

3. **Update API Call** (`utils/axios.ts`):
   ```typescript
   if (payload.newField) formData.append("newField", payload.newField);
   ```

### Listening to Socket Events

```typescript
import { onCustomEvent } from '@/utils/socket';

// Register listener
onCustomEvent((data) => {
  console.log('Event received:', data);
  // Update UI
});

// Later, cleanup
offCustomEvent();
```

### Adding Error Boundary

```typescript
'use client';

export default function AssignmentsLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

---

## 🎨 Styling Notes

### Tailwind CSS v4
- Utility classes for styling: `bg-blue-500`, `text-white`, etc.
- Responsive modifiers: `md:`, `lg:`, `sm:`
- Dark mode supported: `dark:bg-black`
- Custom colors in `tailwind.config.ts`

### Component Colors
- **Status Badges:**
  - Completed: Green (`bg-green-100 text-green-800`)
  - Generating: Blue (`bg-blue-100 text-blue-800`)
  - Pending: Yellow (`bg-yellow-100 text-yellow-800`)
  - Failed: Red (`bg-red-100 text-red-800`)

- **Difficulty Levels:**
  - Easy: Green (`bg-green-100`)
  - Medium: Yellow (`bg-yellow-100`)
  - Hard: Red (`bg-red-100`)

---

## 📊 Performance Optimizations

1. **Code Splitting:**
   - `dynamic()` for DashboardLayout to avoid SSR issues

2. **Socket Efficiency:**
   - Listeners attached only when needed
   - Proper cleanup on unmount prevents memory leaks
   - Singleton socket instance

3. **API Optimization:**
   - Zustand store caching
   - Backend-side caching (returned in response: `source: 'cache'`)
   - Pagination support to limit data

4. **Form Optimization:**
   - React Hook Form for minimal re-renders
   - Zod for compile-time type checking

---

## ⚠️ Troubleshooting

### Socket Not Connecting
- Check `NEXT_PUBLIC_BACKEND_SOCKET_URL` in `.env.local`
- Verify backend is running on port 5000
- Check CORS configuration in backend
- Look for errors in browser console

### API 404 Errors
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure backend endpoints are `/api/assignment`
- Verify backend is running

### Form Validation Not Working
- Check Zod schema in create page
- Verify React Hook Form resolver
- Look at browser console for validation errors

### Progress Not Updating
- Ensure Socket.IO provider wraps app in layout
- Check assignment is actually generating (status check)
- Verify backend emits `assessment:progress` events
- Check browser console for listener registration

---

## 📝 Best Practices

1. **Always use TypeScript types**
   ```typescript
   const assignmentId: string = '...'; // Good
   const assignmentId = '...'; // Avoid
   ```

2. **Use proper cleanup in hooks**
   ```typescript
   useEffect(() => {
     // Setup
     return () => {
       // Cleanup - always do this
     };
   }, [dependencies]);
   ```

3. **Handle async errors**
   ```typescript
   try {
     const result = await apiCall();
   } catch (error) {
     const message = error instanceof Error ? error.message : 'Unknown error';
     setError(message);
   }
   ```

4. **Use keys in lists**
   ```typescript
   sections.map((section) => (
     <div key={section._id}>{section}</div>
   ));
   ```

5. **Prefer Zustand over Context for state**
   - Easier to use
   - Better performance
   - Less boilerplate

---

## 📚 File Reference Quick Guide

| File | Purpose |
|------|---------|
| `utils/socket.ts` | Socket.IO setup & event handlers |
| `utils/axios.ts` | API client & endpoints |
| `components/providers/SocketProvider.tsx` | App-wide socket initialization |
| `hooks/useAssessmentSocket.ts` | Socket event listener hook |
| `store/assignmentStore.ts` | Global assignment state |
| `types/assignment.ts` | TypeScript interfaces |
| `app/assignments/page.tsx` | List assignments view |
| `app/assignments/create/page.tsx` | Create assignment form |
| `app/assignments/[id]/page.tsx` | Assignment detail view |

---

## 🤝 Contributing

When adding new features:
1. Add TypeScript types first
2. Update store if needed
3. Add Socket listeners if real-time needed
4. Add API endpoints if backend needed
5. Create/update pages
6. Test in development

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Check server logs
3. Verify `.env.local` configuration
4. Ensure both frontend and backend are running

---

**Last Updated:** March 2026  
**Version:** 0.1.0  
**Author:** VedaAI Team
