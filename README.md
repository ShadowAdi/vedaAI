# VedaAI - AI Assessment Creator (Full Stack Engineering Assignment)

A comprehensive AI-powered learning platform that allows teachers to create assignments and generate question papers using AI. This project combines a Next.js frontend with a Node.js backend.

## 🎯 Project Overview

This is a complete implementation of the **VedaAI – Full Stack Engineering Assignment**, including:

✅ **Assignment Creation** - Frontend form with file upload, due date, question types, and instructions  
✅ **AI Question Generation** - Structured prompt conversion and intelligent question paper creation  
✅ **Backend System** - Node.js + Express with MongoDB, Redis, BullMQ, and WebSocket support  
✅ **Enhanced Output Page** - Professional question paper display with sections, difficulty tags, and student info  
✅ **Bonus Features** - PDF export, real-time updates via WebSocket, and caching  

## Project Structure

```
vedaAI-Assignement/
├── vedaai-frontend/     # Next.js frontend application
├── vedaAiBackend/       # Node.js/Express backend application
├── package.json         # Root workspace configuration
└── README.md           # This file
```

## 📖 Implementation Details

**For detailed information about the project architecture, approach, and specific implementation details, please refer to the individual README files:**

- **Frontend README**: [vedaai-frontend/README.md](vedaai-frontend/README.md) - Next.js setup, components, state management, and UI implementation
- **Backend README**: [vedaAiBackend/README.md](vedaAiBackend/README.md) - Express setup, API routes, AI integration, database schema, and job processing

## 📋 Prerequisites

- Node.js (v18+)
- npm and yarn (frontend uses npm, backend uses yarn)
- Docker & Docker Compose (for containerized deployment)
- MongoDB (local or Atlas)
- Redis (local or cloud)

## Installation

This monorepo uses **npm for the frontend** and **yarn for the backend**.

```bash
# Install all dependencies for both frontend and backend
npm run install-all

# Or install them separately:
npm run frontend:install  # npm install for frontend
npm run backend:install   # yarn install for backend
```

## 🚀 Development

### Run both frontend and backend simultaneously
```bash
npm run dev
```

### Run frontend only
```bash
npm run frontend:dev
```

### Run backend only
```bash
npm run backend:dev
```

## 🏗️ Building for Production

### Build both applications
```bash
npm run build
```

### Build frontend only
```bash
npm run frontend:build
```

### Build backend only
```bash
npm run backend:build
```

## 📦 Deployment

### Docker Compose
The project includes Docker support with `docker-compose.yml` in the backend folder.

```bash
cd vedaAiBackend
docker-compose up --build
```

### Environment Variables

#### Backend (.env)
```
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=secret
MONGO_DB=vedaai
CLIENT_URL=http://localhost:3000
REDIS_PASSWORD=redispass
UPLOADTHING_API_KEY=sk_live
REDIS_URL=rediss
DB_URL=mongodb+srv://
PORT=5000
UPLOADTHING_TOKEN=eyJhcGlL
SARVAM_API_KEY=sk_
# Add your LLM API keys (OpenAI, Claude, etc.)
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/
NEXT_PUBLIC_BACKEND_SOCKET_URL=http://localhost:5000
NODE_ENV=development
```

## 🏛️ Architecture

### Frontend (vedaai-frontend)
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.io
- **Features**: Assignment creation, AI question preview, PDF export

### Backend (vedaAiBackend)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB (assignments, questions, metadata)
- **Cache**: Redis (prompt caching, state management)
- **Job Queue**: BullMQ (asynchronous AI generation, PDF creation)
- **Real-time Updates**: Socket.io
- **File Uploads**: Uploadthing
- **AI Integration**: LLM API integration for intelligent question generation

### Data Flow
1. Teacher submits assignment form via frontend
2. Request sent to backend API
3. Job created in BullMQ queue
4. Worker processes AI generation in background
5. Results cached in Redis
6. WebSocket updates frontend in real-time
7. Generated questions stored in MongoDB
8. Frontend displays formatted question paper with sections
9. PDF export available on demand

## 📋 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies for both frontend and backend |
| `npm run dev` | Run both frontend and backend in development mode |
| `npm run build` | Build both applications for production |
| `npm run frontend:install` | Install frontend dependencies |
| `npm run backend:install` | Install backend dependencies |
| `npm run frontend:dev` | Run frontend development server (port 3000) |
| `npm run backend:dev` | Run backend development server (port 5000) |
| `npm run frontend:build` | Build frontend for production |
| `npm run backend:build` | Build backend for production |

## 🔍 Next Steps

For comprehensive implementation details, architecture decisions, and specific feature documentation:

1. **Read the Frontend README**: [vedaai-frontend/README.md](vedaai-frontend/README.md)
   - Component structure and UI implementation
   - Form validation and state management
   - WebSocket integration

2. **Read the Backend README**: [vedaAiBackend/README.md](vedaAiBackend/README.md)
   - API endpoints and route structure
   - AI question generation logic
   - BullMQ job processing
   - MongoDB schema and models
