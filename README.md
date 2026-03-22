# VedaAI - Monorepo

A comprehensive AI-powered learning platform combining a Next.js frontend with a Node.js backend.

## Project Structure

```
vedaAI-Assignement/
├── vedaai-frontend/     # Next.js frontend application
├── vedaAiBackend/       # Node.js/Express backend application
├── package.json         # Root workspace configuration
└── README.md           # This file
```

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Docker & Docker Compose (for containerized deployment)

## Installation

This monorepo uses **npm for the frontend** and **yarn for the backend**.

```bash
# Install all dependencies for both frontend and backend
npm run install-all

# Or install them separately:
npm run frontend:install  # npm install for frontend
npm run backend:install   # yarn install for backend
```

## Development

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

## Building for Production

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

## Deployment

### Docker Compose
The project includes Docker support with `docker-compose.yml` in the backend folder.

```bash
docker-compose up --build
```

### Environment Variables

#### Backend (.env)
```
PORT=5000
DATABASE_URL=your_database_url
REDIS_URL=redis://localhost:6379
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Workspace Structure

This is a monorepo with two separate package managers:
- **Frontend** (`vedaai-frontend`): Uses **npm**
- **Backend** (`vedaAiBackend`): Uses **yarn**

Each folder has its own `package.json` (or `package.json` + `yarn.lock`) and dependencies are managed independently. The root scripts use `--prefix` and `--cwd` flags to execute commands in each workspace with the appropriate package manager.

### Frontend (vedaai-frontend)
- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Socket.io

### Backend (vedaAiBackend)
- **Framework**: Express.js
- **Database**: (Check backend README)
- **Cache**: Redis
- **Job Queue**: Bull Queue
- **File Upload**: Uploadthing

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Run both frontend and backend in development |
| `npm run build` | Build both applications for production |
| `npm run frontend:dev` | Run frontend development server |
| `npm run backend:dev` | Run backend development server |
| `npm run frontend:build` | Build frontend for production |
| `npm run backend:build` | Build backend for production |

## Contributing

Please refer to individual README files in each workspace for specific contribution guidelines.

## License

MIT
