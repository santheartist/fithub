# ScienceLift - AI-Powered Fitness Research Platform

A production-ready full-stack web application for aggregating, discussing, and understanding peer-reviewed fitness research.

## 🚀 Features

### ✅ Core Features Implemented

1. **User Authentication & Profiles**
   - JWT-based authentication
   - Secure password hashing with bcrypt
   - User profiles with bio and picture
   - Admin user management

2. **Research Paper Feed**
   - Reddit-style feed layout
   - Category filtering
   - Advanced search by title, authors, keywords
   - Paper metadata display

3. **AI-Powered Summaries**
   - OpenAI API integration (GPT-3.5)
   - Alternative HuggingFace transformers support
   - Beginner-friendly explanations
   - Key findings and practical takeaways

4. **Engagement Features**
   - Like/unlike papers
   - Save papers to profile
   - Repost papers
   - Nested comment threads
   - Like comments

5. **Discussion System**
   - Threaded comments with replies
   - Soft deletion support
   - Comment likes
   - Real-time updates

6. **Moderation System**
   - Report papers/comments
   - Multiple report types (spam, harassment, misinformation)
   - Admin moderation dashboard
   - Status tracking (pending, resolved, dismissed)

7. **External Data Aggregation**
   - CrossRef API integration
   - PubMed API support
   - Scheduled background jobs (APScheduler)
   - Automatic paper fetching

8. **UI/UX**
   - Clean white and blue modern design
   - Fully responsive layout
   - Category sidebar
   - Trending topics widget
   - Search functionality

## 📋 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt
- **ORM**: SQLAlchemy 2.0
- **Task Scheduling**: APScheduler
- **AI Integration**: OpenAI API + HuggingFace Transformers
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Icons**: React Icons
- **Date Formatting**: date-fns

### DevOps
- **Containerization**: Docker (ready for implementation)
- **Database**: PostgreSQL
- **Environment**: Python 3.9+, Node.js 18+

## 📁 Project Structure

```
scienceLift/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py           # Authentication endpoints
│   │   │       ├── users.py          # User profile endpoints
│   │   │       ├── papers.py         # Paper CRUD and interactions
│   │   │       ├── comments.py       # Comment thread endpoints
│   │   │       └── moderation.py     # Report and moderation endpoints
│   │   ├── models/
│   │   │   └── models.py             # SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py            # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── user_service.py       # User business logic
│   │   │   ├── paper_service.py      # Paper business logic
│   │   │   └── comment_service.py    # Comment business logic
│   │   ├── core/
│   │   │   ├── config.py             # Configuration management
│   │   │   ├── database.py           # DB connection
│   │   │   ├── security.py           # JWT and password utilities
│   │   │   └── __init__.py
│   │   ├── utils/
│   │   │   ├── ai_service.py         # AI summarization & aggregation
│   │   │   └── __init__.py
│   │   ├── jobs/
│   │   │   ├── paper_jobs.py         # Background job tasks
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── main.py                       # FastAPI application entry
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   └── README.md                     # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── _app.tsx              # App wrapper with providers
│   │   │   ├── _document.tsx         # HTML document
│   │   │   ├── index.tsx             # Home/feed page
│   │   │   ├── login.tsx             # Login page
│   │   │   ├── register.tsx          # Registration page
│   │   │   ├── search.tsx            # Search results page
│   │   │   └── paper/
│   │   │       └── [id].tsx          # Paper detail page
│   │   ├── components/
│   │   │   ├── Header.tsx            # Top navigation
│   │   │   ├── Sidebar.tsx           # Left navigation & categories
│   │   │   ├── PaperCard.tsx         # Paper card component
│   │   │   ├── CommentThread.tsx     # Comment display
│   │   │   └── ProtectedRoute.tsx    # Route protection
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Authentication state
│   │   │   └── PaperContext.tsx      # Paper feed state
│   │   ├── lib/
│   │   │   └── api.ts                # API client
│   │   └── styles/
│   │       └── globals.css           # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── README.md                     # Frontend documentation
│
├── SCHEMA.md                         # Database schema documentation
├── .gitignore
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Create virtual environment**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Initialize database**:
```bash
# Run the app to auto-create tables via SQLAlchemy
python -m uvicorn main:app --reload
```

5. **Start development server**:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment**:
```bash
# Create .env.local if needed
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

3. **Start development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/{user_id}` - Get user profile

### Papers
- `GET /api/v1/papers` - Get papers feed (with pagination)
- `GET /api/v1/papers/search?q=query` - Search papers
- `GET /api/v1/papers/{paper_id}` - Get paper detail
- `POST /api/v1/papers` - Create paper (admin)
- `POST /api/v1/papers/{paper_id}/like` - Like paper
- `DELETE /api/v1/papers/{paper_id}/like` - Unlike paper
- `POST /api/v1/papers/{paper_id}/save` - Save paper
- `DELETE /api/v1/papers/{paper_id}/save` - Unsave paper
- `POST /api/v1/papers/{paper_id}/repost` - Repost paper
- `DELETE /api/v1/papers/{paper_id}/repost` - Remove repost

### Comments
- `GET /api/v1/papers/{paper_id}/comments` - Get comments
- `POST /api/v1/papers/{paper_id}/comments` - Create comment
- `DELETE /api/v1/papers/{paper_id}/comments/{comment_id}` - Delete comment
- `POST /api/v1/papers/{paper_id}/comments/{comment_id}/like` - Like comment
- `DELETE /api/v1/papers/{paper_id}/comments/{comment_id}/like` - Unlike comment

### Moderation
- `POST /api/v1/reports` - Create report
- `GET /api/v1/reports` - Get reports (admin)
- `PATCH /api/v1/reports/{report_id}/resolve` - Resolve report
- `PATCH /api/v1/reports/{report_id}/dismiss` - Dismiss report

## 🔐 Security

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ CORS configuration
- ✅ Input validation with Pydantic
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ Soft delete for data preservation
- ✅ Admin-only access control

## 🤖 AI Integration

### OpenAI API (Recommended)
Set `OPENAI_API_KEY` in `.env` to enable GPT-3.5 summarization.

### HuggingFace Transformers (Local)
Automatically falls back to local transformers if OpenAI not configured.

## 🔄 Background Jobs

Papers are automatically fetched from CrossRef every 24 hours:
- Searches by fitness-related terms
- Categorizes papers
- Generates AI summaries
- Stores in database

Configure in `app/jobs/paper_jobs.py`

## 📊 Database Indexes

Key indexes for performance:
- `users.email`, `users.username` (UNIQUE)
- `research_papers.category`, `research_papers.created_at`
- `comments.paper_id`, `comments.author_id`
- `likes.user_id`, `likes.paper_id`

## 🧪 Testing

### Backend
```bash
# Run with pytest (to be added)
pytest
```

### Frontend
```bash
# Run with jest (to be added)
npm run test
```

## 🐳 Docker Deployment

Create `docker-compose.yml` (template below):
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: scienceLift_db

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://scienceLift:password@postgres:5432/scienceLift_db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/scienceLift_db
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-key
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- FastAPI documentation
- Next.js best practices
- SQLAlchemy ORM patterns
- OpenAI API
- React community

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Last Updated**: March 2026
**Version**: 1.0.0
