# VedaAI Backend - AI Assessment Creator

A production-grade Node.js + Express backend for generating AI-powered assessment papers with real-time updates, background job processing, and PDF generation.

---

## 🏗️ Architecture Overview

### **System Design**

```
┌─────────────┐
│   Frontend  │
│ (WebSocket) │
└──────┬──────┘
       │
       │ HTTP API + WebSocket
       ▼
┌─────────────────────────────────────┐
│     Express Server                  │
│  ├─ Routes                          │
│  ├─ Controllers                     │
│  ├─ WebSocket Handler (Socket.IO)   │
│  └─ Redis Pub/Sub Subscriber        │
└──────────┬──────────────────────────┘
           │
      ┌────┴────┬──────────┬──────────┐
      ▼         ▼          ▼          ▼
   ┌─────┐  ┌──────┐  ┌────────┐  ┌────────┐
   │ DB  │  │Redis │  │BullMQ  │  │Upload  │
   │(Mon)│  │Cache │  │Queue   │  │Thing   │
   └─────┘  └──────┘  └──┬─────┘  └────────┘
                         │
                    ┌────▼─────┐
                    │  Worker   │
                    │ (separate │
                    │  process) │
                    └────┬──────┘
                         │
                    ┌────▼──────────┐
                    │ Redis Pub/Sub  │
                    │ (broadcasts    │
                    │ to Socket.IO)  │
                    └────────────────┘
```

---

## 🔑 Key Architectural Decisions

### **1. Redis Pub/Sub + Socket.IO Bridge**

**Problem in Docker:**
- Worker runs in a separate container/process
- Cannot directly access the Socket.IO server instance
- Need real-time communication from worker to clients

**Solution:**
```
Worker → Redis Pub/Sub → Socket.IO Server → Client (WebSocket)
```

**Why this works:**
- Redis acts as a message broker
- Worker publishes events: `socket:assessment:${id}:${event}`
- Socket.IO server subscribes to pattern: `socket:*:*`
- Socket.IO forwards to clients in specific rooms

**Files involved:**
- [src/utils/socketEmitter.ts](src/utils/socketEmitter.ts) - Publishing & subscribing logic
- [src/config/socket.ts](src/config/socket.ts) - Socket.IO server setup
- [src/workers/worker.ts](src/workers/worker.ts) - Worker emitting events

---

### **2. BullMQ for Background Job Processing**

**Why BullMQ:**
- Reliable job queue with persistence (Redis-backed)
- Automatic retries (3 attempts with exponential backoff)
- Job progress tracking
- Separation of concerns (API fast, processing async)

**Flow:**
```
1. API Request → Create Assignment
2. Add Job to Queue (BullMQ)
3. Return 202 (Accepted) immediately
4. Worker processes async
5. Frontend polls or waits for WebSocket events
```

**Job Lifecycle:**
```typescript
Status: pending → queued → generating → completed/failed
Progress: 10% → 30% → 50% → 60% → 75% → 95% → 100%
```

---

## 📡 Routes & Endpoints

### **1. Create Assignment**
```
POST /api/assignment
Content-Type: multipart/form-data

Body:
{
  "title": "Math Quiz",
  "dueDate": "2024-03-25T10:00:00Z",
  "questionTypes": ["MCQ", "Short Answer"],
  "numberOfQuestions": 10,
  "totalMarks": 50,
  "additionalInstructions": "Attempt all questions",
  "file": <PDF or TXT file (optional)>
}

Response (202 Accepted):
{
  "success": true,
  "message": "Assignment generation started",
  "data": {
    "assignmentId": "507f1f77bcf86cd799439011",
    "jobId": "assign_507f1f77bcf86cd799439011",
    "status": "queued",
    "estimatedTime": "30-60 seconds"
  }
}
```

**Validation:**
- ✅ dueDate must be in future
- ✅ questionTypes: at least 1
- ✅ numberOfQuestions: 1-100
- ✅ totalMarks: 1-100
- ✅ title: 3-200 characters

---

### **2. Get All Assignments**
```
GET /api/assignment?search=math&sortBy=createdAt&sortOrder=desc&limit=10&skip=0

Response (200 OK):
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 45,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

**Query Params:**
- `search` - Search in title (case-insensitive)
- `sortBy` - createdAt | dueDate | title | status (default: createdAt)
- `sortOrder` - asc | desc (default: desc)
- `limit` - 1-100 (default: 10)
- `skip` - ≥0 (default: 0)

---

### **3. Get Assignment by ID**
```
GET /api/assignment/:assessmentId
Here i am also caching it.
Response (200 OK):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Math Quiz",
    "status": "completed",
    "generatedQuestions": {
      "sections": [
        {
          "title": "Section A",
          "instruction": "Attempt all questions",
          "questions": [
            {
              "text": "What is 2+2?",
              "difficulty": "easy",
              "marks": 2
            }
          ]
        }
      ]
    },
    "createdAt": "2024-03-22T10:00:00Z"
  },
  "source": "db" | "cache"
}
```

**Status Values:**
- `pending` - Waiting to be processed
- `generating` - Worker processing
- `completed` - Questions generated successfully
- `failed` - Generation failed (see errorMessage)

---

### **4. Regenerate Assignment**
```
POST /api/assignment/:assessmentId/regenerate

Response (202 Accepted):
{
  "success": true,
  "message": "Regeneration started",
  "data": {
    "assignmentId": "507f1f77bcf86cd799439011",
    "jobId": "assign_regen_507f1f77bcf86cd799439011_1711100400000",
    "status": "queued"
  }
}
```

**Effects:**
- Clears previous questions
- Resets status to pending
- Adds new job to queue

---

### **5. Download Assignment as PDF**
```
GET /api/assignment/download/:assessmentId

Response (200 OK):
{
  "success": true,
  "message": "PDF generated successfully" or "PDF retrieved successfully",
  "data": {
    "assignmentId": "507f1f77bcf86cd799439011",
    "pdfUrl": "https://uploadthing.com/...",
    "fileName": "Math_Quiz.pdf",
    "cachedAt": "2024-03-22T10:05:30Z"
  }
}
```

**Process:**
1. Check if PDF already cached in database
2. If cached → Return cached URL immediately ⚡
3. If not cached:
   - Generate PDF using PDFKit (in-memory)
   - Upload to UploadThing
   - Save URL and timestamp to database
   - Return URL

**Caching Strategy:**
- First request: Generate & cache (30-60 seconds)
- Subsequent requests: Return cached URL instantly
- Cache invalidates on regeneration
- Users can request PDF multiple times without overhead

---

### **6. Delete Assignment**
```
DELETE /api/assignment/:assessmentId

Response (200 OK):
{
  "success": true,
  "message": "Assignment deleted successfully",
  "data": {
    "assignmentId": "507f1f77bcf86cd799439011"
  }
}
```

---

## 🔌 WebSocket Events

### **Client → Server**

**Join Assessment Room**
```typescript
socket.emit("join:assessment", "507f1f77bcf86cd799439011")
```

Expected behavior:
- Client joins room: `assessment:507f1f77bcf86cd799439011`
- Receives all events for this assignment

---

### **Server → Client (Real-time Updates)**

**1. Progress Event**
```typescript
socket.on("assessment:progress", (data) => {
  console.log(data.progress); // 0-100
  console.log(data.message); // "Starting Generation..."
  console.log(data.status);  // "generating"
})
```

**Sample Events:**
- 10% - "Starting Generation..."
- 30% - "File content extracted..."
- 50% - "Prompt built, calling AI..."
- 60% - "AI response received..."
- 75% - "Parsing response..."
- 100% - "Completed"

---

**2. Completion Event**
```typescript
socket.on("assessment:completed", (data) => {
  console.log(data.assignmentId);
  console.log(data.status); // "completed"
  console.log(data.data);   // Full assignment object with questions
})
```

---

**3. Failure Event**
```typescript
socket.on("assessment:failed", (data) => {
  console.log(data.error); // Error message
  console.log(data.status); // "failed"
})
```

---

## 🔄 BullMQ Job Queue Details

### **Queue Configuration**

```typescript
// src/config/queue.ts
const assignmentQueue = new Queue("assignment-generation", {
  connection: { url: REDIS_URL },
  defaultJobOptions: {
    removeOnComplete: 10,      // Keep last 10 completed jobs
    removeOnFail: 5,           // Keep last 5 failed jobs
    attempts: 3,               // Retry 3 times
    backoff: {
      type: "exponential",
      delay: 2000              // Start with 2s, exponential increase
    }
  }
})
```

### **Job Processing Flow**

```
1. API receives request
   ↓
2. Service: CreateAssignmentService()
   - Validate data
   - Create Assignment in DB (status: pending)
   - Add job to queue
   - Return jobId & assignmentId
   ↓
3. Return 202 Accepted (async)
   ↓
4. Worker picks up job:
   - Update status to "generating"
   - Extract file content (if provided)
   - Build prompt with parameters
   - Call Sarvam AI
   - Parse AI response into sections/questions
   - Save to DB
   - Cache result (Redis)
   ↓
5. Emit WebSocket events throughout (via Redis pub/sub)
```

### **Job ID Strategy**

```typescript
// Create job
jobId: `assign_${assignmentId}`

// Regenerate job
jobId: `assign_regen_${assessmentId}_${Date.now()}`
```

**Why idempotent IDs?**
- Prevents duplicate jobs if API called twice
- Easy tracking in logs

---

## 🤖 AI Integration (Sarvam AI)

### **Prompt Building**

```typescript
// src/utils/buildPromt.ts
buildPrompt(data, fileContent)
```

**Input:**
```
{
  title: "Math Quiz",
  dueDate: "2024-03-25",
  questionTypes: ["MCQ", "Short Answer"],
  numberOfQuestions: 10,
  totalMarks: 50,
  additionalInstructions: "Focus on geometry",
  fileUrl: "https://..." (optional)
}
```

**Output Prompt:**
```
Create an assessment with:
- Title: Math Quiz
- Number of questions: 10
- Total marks: 50
- Question types: MCQ, Short Answer
- Additional instructions: Focus on geometry

Generate sections (A, B, etc.) with:
- Section title
- Instructions for that section
- Questions with difficulty (easy/medium/hard) and marks

Format: JSON with sections containing questions.
```

---

### **AI Response Parsing**

```typescript
// src/utils/parseAiResponse.ts
parseAIResponse(aiResponse)
```

**Expected AI Response Format:**
```json
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions",
      "questions": [
        {
          "text": "What is 2+2?",
          "difficulty": "easy",
          "marks": 2
        }
      ]
    }
  ]
}
```

**Parser:**
- Extracts JSON from AI text
- Validates structure
- Calculates total marks
- Ensures question count matches request

---

## 📄 PDF Generation

### **Current Implementation**

```typescript
// src/utils/generateAssignmentPDF.ts
const pdfBuffer = await generateAssignmentPDF(assignment)
```

**Process:**
1. Use PDFKit to create document
2. Add header (title, due date, instructions)
3. Iterate sections:
   - Section title (bold, larger font)
   - Instructions
   - Questions with marks and difficulty
4. Add student info section (blank for filling)
5. Generate buffer
6. Upload to UploadThing
7. Return URL

**Features:**
- ✅ Structured layout
- ✅ Sections with instructions
- ✅ Difficulty badges
- ✅ Marks displayed
- ✅ Student info section
- ✅ Mobile-friendly dimensions

**Future Enhancement:**
- Could add worker for async PDF generation
- Currently synchronous (fast for small papers)

---

## 💾 PDF Caching Strategy

### **Problem**
- Regenerating PDF on every request wastes resources
- Network calls to UploadThing
- PDF generation takes 30-60 seconds

### **Solution**
- Cache PDF URL in MongoDB after first generation
- Return cached URL on subsequent requests
- Invalidate cache when assignment is regenerated

### **Database Fields**
```typescript
pdfUrl: String          // Cached PDF URL
pdfGeneratedAt: Date    // When PDF was generated
```

### **Caching Flow**

**First Request:**
```
GET /api/assignment/download/:id
  ↓
Check DB for pdfUrl (not found)
  ↓
Generate PDF (PDFKit)
  ↓
Upload to UploadThing
  ↓
Save pdfUrl to DB
  ↓
Return URL to client
(Total: 30-60 seconds)
```

**Subsequent Requests:**
```
GET /api/assignment/download/:id
  ↓
Check DB for pdfUrl (found!)
  ↓
Return cached URL immediately ⚡
(Total: <100ms)
```

### **Cache Invalidation**
```typescript
// When regenerating assignment
await Assignment.findByIdAndUpdate(assessmentId, {
    pdfUrl: null,           // Clear cached PDF
    pdfGeneratedAt: null,   // Clear timestamp
})
```

Caches are invalidated when:
- ✅ Assignment is regenerated
- ✅ Assignment is deleted

### **Performance Improvement**
- **Without caching:** Every download = 30-60s wait
- **With caching:** After first generation, all downloads instant
- **Uptime improvement:** 60x faster on cached requests

---

## 🗄️ MongoDB Schema

### **Assignment Document**

```typescript
{
  _id: ObjectId,
  title: String,                  // 3-200 chars
  subject: String,
  class: String,
  file: String,                   // UploadThing URL
  fileName: String,
  fileSize: Number,
  dueDate: Date,                  // Must be future
  questionTypes: String[],        // At least 1
  numberOfQuestions: Number,      // 1-100
  totalMarks: Number,             // 1-100
  additionalInstructions: String, // Max 1000 chars
  
  // Generated output
  generatedQuestions: {
    sections: [
      {
        title: String,
        instruction: String,
        questions: [
          {
            text: String,
            difficulty: "easy" | "medium" | "hard",
            marks: Number
          }
        ]
      }
    ],
    totalTime: Number,
    maxMarks: Number
  },
  
  // Status tracking
  status: "pending" | "generating" | "completed" | "failed",
  jobId: String,
  errorMessage: String,
  
  // PDF Caching
  pdfUrl: String,        // Cached PDF URL from UploadThing
  pdfGeneratedAt: Date,  // Timestamp of PDF generation
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### **Indexes**

```typescript
- { status: 1, createdAt: -1 }  // For status queries
- { dueDate: 1 }                 // For due date filtering
- { subject: 1, class: 1 }       // For batch operations
- { jobId: 1 }                   // For job tracking
```

---

## 💾 Redis Usage

### **Caching Strategy**

```typescript
// Cache completed assessments
key: `assessment:${assignmentId}`
ttl: indefinite (until regenerated)
```

**When to Cache:**
- ✅ Assignment marked as "completed"
- ✅ User fetches same assignment again

**When to Invalidate:**
- ✅ Regeneration starts
- ✅ Assignment deleted

---

### **BullMQ Job State**

```
Redis stores:
- Job data
- Job progress (0-100)
- Job status (queued, active, completed, failed)
- Retry attempts
```

---

## 🚀 Deployment (Docker)

### **Current Setup**

```yaml
# docker-compose.yml
services:
  backend:       # Express server + Socket.IO + Subscriber
  worker:        # BullMQ Worker (processes jobs)
  mongodb:       # Database
  redis:         # Cache + Pub/Sub + BullMQ
```

### **Why Separate Worker?**

**Problem:**
- Heavy AI operations block the Express server
- Need to scale processing independently
- Multiple workers needed for high load

**Solution:**
- Worker is separate Docker service
- Subscribes to BullMQ queue
- Publishes events via Redis pub/sub
- Express server remains responsive

---

## 🔒 Error Handling

### **Validation Errors (400)**
```json
{
  "message": "Limit must be between 1 and 100"
}
```

### **Not Found (404)**
```json
{
  "message": "Assessment not found"
}
```

### **Server Errors (500)**
```json
{
  "message": "Failed to create assignment: ..."
}
```

### **Job Failure**
- Automatically retried (3 attempts)
- Error logged to assignment.errorMessage
- WebSocket event: `assessment:failed`
- Assignment status: `failed`

---

## 📦 Third-Party Services

### **UploadThing**
```typescript
// File upload (PDF, TXT)
await uploadFileToUploadThing(buffer, filename, mimeType)
```
- Manages file storage
- Returns public URL
- Used for: assignment files, generated PDFs

---

### **Sarvam AI**
```typescript
// AI question generation
await generateQuestionWithAI(prompt)
```
- LLM API for generating questions
- Input: structured prompt
- Output: JSON with sections and questions

---

## 🧪 Development

### **Setup**

```bash
# Install dependencies
npm install

# Environment variables (.env)
MONGO_URI=mongodb://...
REDIS_URL=redis://...
CLIENT_URL=http://localhost:3000
SARVAM_API_KEY=...
UPLOADTHING_TOKEN=...
PORT=5000

# Development
npm run dev

# Build
npm run build

# Start
npm start
```

---

## 📊 Monitoring

### **Logs**

```
[Socket] Client connected: abc123
[Worker] Starting job for assignment: 507f1f77bcf86cd799439011
[SocketEmitter] Published event "assessment:progress" to room "assessment:507f1f77bcf86cd799439011"
[Worker] Job completed successfully
```

### **Check Queue Status**

```bash
# Use Redis CLI
redis-cli
> KEYS bull:assignment-generation:*
```

---

## 🎯 Summary of Approach

### **Why This Architecture?**

1. **BullMQ for Background Jobs**
   - Long-running AI operations don't block API
   - Automatic retries for reliability
   - Job persistence across restarts

2. **Redis Pub/Sub Bridge**
   - Worker (separate process) → Redis → Socket.IO → Client
   - Solves Docker isolation problem
   - Enables real-time updates

3. **MongoDB for Persistence**
   - Store assignments and generated questions
   - Track status and errors
   - Support pagination and search

4. **Redis Caching**
   - Cache completed assignments
   - Fast retrieval for repeated access
   - Invalidate on regeneration

5. **UploadThing for File Management**
   - Reliable file upload/storage
   - Public URLs for PDFs
   - No need to manage S3/storage

6. **Socket.IO + WebSocket**
   - Real-time progress updates
   - Room-based broadcasting (one user per assignment)
   - Graceful error handling

---

## 🐛 Common Issues & Solutions

### **Issue: Worker not sending updates to frontend**

**Cause:** Redis pub/sub not connected or Socket.IO not subscribed

**Fix:**
```
1. Check Redis is running
2. Check Socket.IO subscriber in logs: "[SocketEmitter] Socket event subscriber connected"
3. Verify emitSocketEvent() is being called
4. Check client is listening for events with correct room name
```

### **Issue: Job stuck in queue**

**Cause:** Worker crashed or not running

**Fix:**
```
1. Check worker logs
2. Ensure MongoDB is accessible
3. Verify Redis connection
4. Restart worker: docker-compose restart worker
```

### **Issue: PDF generation fails**

**Cause:** UploadThing token invalid or network issue

**Fix:**
```
1. Verify UPLOADTHING_TOKEN in .env
2. Check file size not too large
3. Ensure UploadThing account has quota
```

---

**Built with ❤️ for VedaAI**
