# ScienceLift - Critical Issues & Implementation Missing

## PRIORITY 0: CRITICAL BUGS 🔴

### 1. interactions_router Missing from Exports
**Severity**: CRITICAL - Application Break  
**Status**: Identified at app/api/routes/__init__.py

#### Current State (WRONG):
```python
# File: app/api/routes/__init__.py

from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.papers import router as papers_router
from app.api.routes.comments import router as comments_router
from app.api.routes.moderation import router as moderation_router
from app.api.routes.saved_reposts import router as saved_reposts_router
from app.api.routes.profile_settings import router as profile_settings_router
# MISSING: interactions_router
# MISSING: ai_router

__all__ = [
    "auth_router",
    "users_router", 
    "papers_router",
    "comments_router",
    "moderation_router",
    "saved_reposts_router",
    "profile_settings_router"
    # Missing: "interactions_router", "ai_router"
]
```

#### The Route File EXISTS But Is Not Exported:
- ✅ File exists: `/backend/app/api/routes/interactions.py`
- ✅ Has router: `router = APIRouter(prefix="/papers", tags=["interactions"])`
- ✅ Has endpoints:
  - `POST /papers/{id}/like`
  - `DELETE /papers/{id}/like`
  - `POST /papers/{id}/save` (implied from saved_reposts)
  - `DELETE /papers/{id}/save`

#### Fix Required:
```python
# app/api/routes/__init__.py CORRECTED

from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.papers import router as papers_router
from app.api.routes.comments import router as comments_router
from app.api.routes.moderation import router as moderation_router
from app.api.routes.saved_reposts import router as saved_reposts_router
from app.api.routes.profile_settings import router as profile_settings_router
from app.api.routes.interactions import router as interactions_router  # ADD THIS
from app.api.routes.ai import router as ai_router  # ADD THIS

__all__ = [
    "auth_router",
    "users_router", 
    "papers_router",
    "comments_router",
    "moderation_router",
    "saved_reposts_router",
    "profile_settings_router",
    "interactions_router",  # ADD THIS
    "ai_router"  # ADD THIS
]
```

#### Also verify main.py has ai_router registered:
```python
# In main.py:
from app.api.routes import (
    auth_router, users_router, papers_router, 
    comments_router, moderation_router, saved_reposts_router,
    profile_settings_router, interactions_router, ai_router  # Check these are imported
)

# Then registered:
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(papers_router, prefix=settings.API_PREFIX)
app.include_router(comments_router, prefix=settings.API_PREFIX)
app.include_router(moderation_router, prefix=settings.API_PREFIX)
app.include_router(saved_reposts_router, prefix=settings.API_PREFIX)
app.include_router(profile_settings_router, prefix=settings.API_PREFIX)
app.include_router(interactions_router, prefix=settings.API_PREFIX)  # Verify
app.include_router(ai_router, prefix=settings.API_PREFIX)  # Verify
```

#### Impact on Frontend:
- **likePaper()** → 404 error
- **unlikePaper()** → 404 error  
- **savePaper()** → 404 error
- **unsavePaper()** → 404 error
- Paper voting UI broken

---

### 2. saved-papers.tsx Page Missing
**Severity**: CRITICAL - Feature Unavailable  
**Status**: File not found at /frontend/src/pages/

#### The Problem:
Frontend has API method but no page to display it:
```typescript
// In api.ts - METHOD EXISTS:
async getSavedPapers(skip: number = 0, limit: number = 20, category?: string) {
  const params: any = { skip, limit };
  if (category) params.category = category;
  return this.client.get('/user/saved-papers', { params });
}

// But NO PAGE to use it!
```

#### Expected Structure:
```
/frontend/src/pages/saved-papers.tsx (MISSING)
```

#### What We Need:
Look at reposts.tsx and adapt:
```typescript
/**
 * saved-papers.tsx - User's saved papers page
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PaperCard } from '@/components/PaperCard';
import { useAuth } from '@/context/AuthContext';
import { usePapers } from '@/context/PaperContext';
import { apiClient } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SavedPapersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toggleLike, toggleRepost } = usePapers();
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadSavedPapers();
  }, [selectedCategory, skip]);

  const loadSavedPapers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSavedPapers(skip, 20, selectedCategory || undefined);
      setPapers(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to load saved papers', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      <Header />
      <Sidebar onCategorySelect={setSelectedCategory} currentCategory={selectedCategory} />
      
      <main className="ml-64 pt-8 px-8 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Saved Papers ({total})
          </h2>

          {papers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                You haven't saved any papers yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onLike={toggleLike}
                  onRepost={toggleRepost}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setSkip(Math.max(0, skip - 20))}
              disabled={skip === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {Math.floor(skip / 20) + 1} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setSkip(skip + 20)}
              disabled={skip + 20 >= total}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
```

#### Also Need:
- Navigation link in Header or Sidebar → `/saved-papers`
- Route entry in next.config or pages folder

---

### 3. Moderation Router Empty
**Severity**: CRITICAL - No Moderation  
**Status**: File exists but no endpoints

#### Current State:
```python
# app/api/routes/moderation.py - CURRENT CONTENT:

"""
Moderation endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/moderation", tags=["moderation"])

# NO ENDPOINTS IMPLEMENTED!
```

#### What Should Be There:
```python
"""
Moderation endpoints for reporting and managing inappropriate content.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import Report, ResearchPaper, Comment, User
from app.schemas.schemas import ReportResponse
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/moderation", tags=["moderation"])


def get_current_user_id(authorization: str = Header(None)) -> int:
    """Extract user ID from authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return int(user_id)


@router.post("/reports", response_model=ReportResponse)
def create_report(
    report_type: str,
    paper_id: Optional[int] = None,
    comment_id: Optional[int] = None,
    description: Optional[str] = None,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Create a report for inappropriate content."""
    user_id = get_current_user_id(authorization)
    
    # Validate report has a target
    if not paper_id and not comment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify either paper_id or comment_id"
        )
    
    # Create report
    report = Report(
        reporter_id=user_id,
        paper_id=paper_id,
        comment_id=comment_id,
        report_type=report_type,
        description=description,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report


@router.get("/reports", response_model=List[ReportResponse])
def get_reports(
    status_filter: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get reports (admin only)."""
    user_id = get_current_user_id(authorization)
    
    # Verify user is admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    
    reports = query.offset(skip).limit(limit).all()
    return reports


@router.put("/reports/{report_id}")
def resolve_report(
    report_id: int,
    status: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Resolve a report (admin only)."""
    user_id = get_current_user_id(authorization)
    
    # Verify user is admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = status
    db.commit()
    
    return {"message": "Report resolved"}
```

---

## PRIORITY 1: HIGH-ISSUE IMPLEMENTATIONS 🟠

### 4. Missing: chat_about_paper() Method in AIService
**Severity**: HIGH - Core Feature  
**Status**: Method called but not defined

#### Problem Location:
File: `/backend/app/api/routes/ai.py` line ~83
```python
# This line FAILS:
ai_response = AIService.chat_about_paper(  # ❌ METHOD DOESN'T EXIST
    paper_title=paper.title,
    paper_abstract=paper.ai_summary or "",
    paper_content=paper.ai_summary or "",
    user_question=request.message,
    conversation_history=history[-4:] if history else None
)
```

#### Current ai_service.py has these methods:
- ✅ `chat()` - multi-turn chat (but different signature)
- ✅ `search_crossref()`
- ✅ `search_nlm()`
- ✅ `generate_summary()`
- ✅ `extract_key_points()`
- ✅ `analyze_trends()`

#### Solution - Add this method to AIService class:
```python
async def chat_about_paper(
    self, 
    paper_title: str, 
    paper_abstract: str, 
    paper_content: str,
    user_question: str,
    conversation_history: List[Dict] = None
) -> str:
    """Chat about a specific paper with context."""
    if not self.openai_client:
        return "AI service not configured."
    
    try:
        system_prompt = f"""You are an expert research paper analyst. 
        A user is asking about this paper:
        
        Title: {paper_title}
        Abstract/Content: {paper_abstract}
        
        Answer questions about this paper clearly and accurately."""
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current question
        messages.append({"role": "user", "content": user_question})
        
        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return f"Error: {str(e)}"
```

---

### 5. Missing Profile Endpoints
**Severity**: HIGH  
**Status**: Frontend calls them, backend doesn't have them

#### Missing Endpoints:

##### A. Change Password
- **Frontend Calls**: `apiClient.changePassword(oldPassword, newPassword)`
- **Endpoint Expected**: `POST /profile/me/change-password`
- **Status**: ❌ NOT IMPLEMENTED

```python
# Add to profile_settings.py:

@router.post("/me/change-password")
def change_password(
    old_password: str,
    new_password: str,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Change user password."""
    user_id = get_current_user_id(authorization)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify old password
    if not verify_password(old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    # Update password
    user.password_hash = hash_password(new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}
```

##### B. Upload Profile Picture
- **Frontend Calls**: `apiClient.uploadProfilePicture(file)`
- **Endpoint Expected**: `POST /profile/me/upload-picture`
- **Status**: ❌ NOT IMPLEMENTED

##### C. Upload Banner Picture
- **Frontend Calls**: `apiClient.uploadBannerPicture(file)`
- **Endpoint Expected**: `POST /profile/me/upload-banner`
- **Status**: ❌ NOT IMPLEMENTED

##### D. Delete Conversation
- **Frontend Calls**: `apiClient.deleteConversation(conversationId)`
- **Endpoint Expected**: `DELETE /conversations/{id}`
- **Status**: ❌ NOT IMPLEMENTED

```python
# Add to ai.py:

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Delete a chat conversation."""
    conversation = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted"}
```

---

### 6. Duplicate/Overlapping User Endpoints
**Severity**: HIGH - API Design  
**Status**: Confusing structure

#### Problem:
```
/users/me                  → get current user (users.py)
/users/me                  → update profile (users.py)
/users/{id}               → get user profile (users.py)

/profile/me/profile       → get profile (profile_settings.py)
/profile/me/settings      → update settings (profile_settings.py)
/profile/{id}/{id}        → get user (profile_settings.py)
```

#### Recommendation:
Consolidate to ONE router. Suggest using `/users` pattern:

```
GET    /users/me              → Current user
PUT    /users/me              → Update current user
POST   /users/me/change-password
GET    /users/{id}            → Public user profile
POST   /users/me/upload-picture
POST   /users/me/upload-banner
DELETE /users/me/account
```

---

## PRIORITY 2: MEDIUM ISSUES 🟡

### 7. API Response Validation Missing
**Severity**: MEDIUM  
**Status**: Some client methods don't validate

```typescript
// Example in api.ts
async getPaperDetail(paperId: number) {
  return this.client.get(`/papers/${paperId}`);
  // What if paper not found? Returns error object directly
  // Should check response.status or add error handling
}
```

### 8. Paper Comparison Not Fully Implemented
**Severity**: MEDIUM  
**Status**: Endpoint exists but incomplete

File: `/backend/app/api/routes/ai.py`

```python
# Current: No comparison endpoint shown
# Frontend calls: apiClient.comparePapers(paperIds)

# Need to add:
@router.post("/papers/compare", response_model=PaperComparisonResponse)
async def compare_papers(
    request: PaperComparisonRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """Compare multiple papers via AI analysis."""
    # Implementation needed
```

### 9. Activity Feed Not Implemented
**Severity**: MEDIUM  
**Status**: Client method exists, no backend

```typescript
// Frontend:
async getUserActivityFeed(skip: number = 0, limit: number = 20) {
  return this.client.get('/user/activity-feed', { params: { skip, limit } });
  // ❌ Endpoint doesn't exist
}
```

---

## PRIORITY 3: NICE TO HAVE 🟢

### 10. Rate Limiting Not Used
- slowapi is installed but not active
- Should add to auth endpoints

### 11. Full-Text Search Optimization
- `create_search_indexes.py` exists but may not be run
- Should ensure indexes are created

### 12. Google Scholar Integration
- API key configured but not used
- Could enhance paper sourcing

### 13. Test Suite
- Files exist but not in automated test framework
- Should integrate into CI/CD

---

## SUMMARY OF ALL MISSING/INCOMPLETE

### Backend (12 issues)
| # | Issue | File | Severity | Fix Time |
|---|-------|------|----------|----------|
| 1 | interactions_router not exported | __init__.py | 🔴 CRITICAL | 2 min |
| 2 | moderation endpoints empty | moderation.py | 🔴 CRITICAL | 30 min |
| 3 | chat_about_paper() missing | ai_service.py | 🟠 HIGH | 15 min |
| 4 | Password change endpoint | profile_settings.py | 🟠 HIGH | 10 min |
| 5 | Picture upload endpoints | profile_settings.py | 🟠 HIGH | 20 min |
| 6 | Delete conversation endpoint | ai.py | 🟠 HIGH | 5 min |
| 7 | Duplicate user endpoints | multiple | 🟠 HIGH | 60 min |
| 8 | Paper comparison incomplete | ai.py | 🟡 MEDIUM | 30 min |
| 9 | Activity feed endpoint | saved_reposts.py | 🟡 MEDIUM | 20 min |
| 10 | Rate limiting unused | main.py | 🟢 LOW | 15 min |
| 11 | Search indexes not created | config | 🟢 LOW | 10 min |
| 12 | Google Scholar unused | ai_service.py | 🟢 LOW | Build later |

### Frontend (1 issue)
| # | Issue | File | Severity | Fix Time |
|---|-------|------|----------|----------|
| 1 | saved-papers.tsx missing | pages/ | 🔴 CRITICAL | 20 min |

---

## TOTAL REMAINING WORK

**Critical (Must Fix):** 3 items = ~1 hour  
**High Priority:** 4 items = ~1.5 hours  
**Medium:** 3 items = ~1.5 hours  
**Low:** 3 items = ~40 min  

**Total Estimated Time: ~5 hours**

---

**Last Updated**: April 14, 2026  
**Ready for Development**: Yes ✅  
**Ready for Production**: No ❌ (After fixes above)
