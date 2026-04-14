# FitHub - Research Paper Aggregation Platform with AI

This is a complete rebuild of the FitHub application after accidental deletion.

## Structure

### Backend (Python/FastAPI)
- **main.py**: FastAPI application entry point
- **app/models/models.py**: SQLAlchemy ORM models
- **app/schemas/schemas.py**: Pydantic validation schemas
- **app/api/routes/**: API endpoint handlers
- **app/services/**: Business logic services
- **app/core/**: Configuration, database, security
- **requirements.txt**: Python dependencies

### Frontend (Next.js/React/TypeScript)
- **src/pages/**: Next.js pages
- **src/components/**: Reusable React components
- **src/context/**: React context providers
- **src/lib/**: API client and utilities
- **package.json**: Node.js dependencies

## Quick Start

### Backend
```bash
cd scienceLift/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd scienceLift/frontend
npm install
npm run dev
```

## Environment Variables

Create `.env` file in backend directory:
```
DATABASE_URL=postgresql://user:password@localhost/fithub
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
```

## Features
- Research paper search across multiple sources (CrossRef, PubMed, Google Scholar, DOAJ)
- AI-powered paper summarization and analysis
- User authentication and profiles
- Paper bookmarking and sharing
- Community comments and discussions
- Personalized recommendations

## Deployment
Ready for Railway deployment. See RAILWAY_DEPLOYMENT.md for instructions.
