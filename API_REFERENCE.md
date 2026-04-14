# ScienceLift AI API Reference Card

Quick reference for all AI endpoints. Full docs in [AI_FEATURES.md](AI_FEATURES.md).

## Authentication

All endpoints require authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Chat Endpoints

### 1. Chat About Paper
**Send a message to AI about a paper**

```
POST /api/v1/papers/{paper_id}/chat

Request Body:
{
  "message": "What is the main methodology?"
}

Response (200):
{
  "response": "Based on the paper, the main methodology...",
  "conversation_id": 123
}

Error (404):
{
  "detail": "Paper not found"
}

Error (401):
{
  "detail": "Not authenticated"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/papers/1/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the main methodology?"}'
```

**JavaScript:**
```javascript
const response = await apiClient.chatAboutPaper(1, "What is the main methodology?");
console.log(response.data.response);
```

### 2. Get Conversations for Paper
**Retrieve all conversations for a user-paper pair**

```
GET /api/v1/papers/{paper_id}/conversations

Response (200):
[
  {
    "id": 123,
    "paper_id": 1,
    "title": "What is the main methodology?...",
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:35:00",
    "messages": [
      {
        "id": 456,
        "role": "user",
        "content": "What is the main methodology?",
        "created_at": "2024-01-15T10:30:00"
      }
    ]
  }
]

Error (404):
{
  "detail": "Paper not found"
}
```

**cURL:**
```bash
curl -X GET http://localhost:8000/api/v1/papers/1/conversations \
  -H "Authorization: Bearer TOKEN"
```

### 3. Get Specific Conversation
**Get a conversation with all its messages**

```
GET /api/v1/conversations/{conversation_id}

Response (200):
{
  "id": 123,
  "paper_id": 1,
  "title": "Initial question...",
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:35:00",
  "messages": [
    {"id": 456, "role": "user", "content": "..."},
    {"id": 457, "role": "assistant", "content": "..."}
  ]
}

Error (404):
{
  "detail": "Conversation not found"
}
```

### 4. Delete Conversation
**Delete a conversation (no recovery)**

```
DELETE /api/v1/conversations/{conversation_id}

Response (200):
{
  "message": "Conversation deleted"
}

Error (404):
{
  "detail": "Conversation not found"
}
```

## Summary Endpoints

### Get Paper Summary
**Generate AI summary of a paper**

```
POST /api/v1/papers/{paper_id}/summary

Request Body:
{
  "style": "balanced"  // or "technical" or "simple"
}

Response (200):
{
  "summary": "This paper investigates...",
  "style": "balanced"
}

Error (400):
{
  "detail": "Invalid summary style. Use 'technical', 'simple', or 'balanced'"
}

Error (404):
{
  "detail": "Paper not found"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/papers/1/summary \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"style": "technical"}'
```

**JavaScript:**
```javascript
const response = await apiClient.getPaperSummary(1, "technical");
console.log(response.data.summary);
```

**Summary Styles:**
- `balanced` - Good for all audiences (default)
- `technical` - For researchers and experts
- `simple` - Easy-to-understand overview

## Analysis Endpoints

### Analyze Trends
**Analyze trends in papers from a category**

```
POST /api/v1/papers/analyze/trends?category=Hypertrophy&limit=5

Request Body:
{}  // Send empty JSON object

Response (200):
{
  "analysis": "Recent papers show increased focus on...",
  "paper_count": 5
}

Parameters:
- category (optional): Paper category to filter
- limit (optional): Number of papers (1-10, default 5)

Error (404):
{
  "detail": "No papers found for analysis"
}
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/papers/analyze/trends?category=Strength&limit=5" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**JavaScript:**
```javascript
const response = await apiClient.analyzeTrends("Strength", 5);
console.log(response.data.analysis);
```

### Compare Papers
**Compare 2-5 papers in detail**

```
POST /api/v1/papers/compare

Request Body:
{
  "paper_ids": [1, 2, 3]  // 2-5 papers
}

Response (200):
{
  "comparison": "Paper 1 uses method A while Paper 2...",
  "papers_compared": 3
}

Error (400):
{
  "detail": "Need at least 2 papers to compare"
}

Error (400):
{
  "detail": "paper_ids must have 2-5 items"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/papers/compare \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paper_ids": [1, 2, 3]}'
```

**JavaScript:**
```javascript
const response = await apiClient.comparePapers([1, 2, 3]);
console.log(response.data.comparison);
```

**Constraints:**
- Minimum: 2 papers
- Maximum: 5 papers
- All papers must exist

### Research Questions
**Generate potential follow-up research questions**

```
GET /api/v1/papers/{paper_id}/research-questions

Response (200):
{
  "questions": [
    "How would these results apply to...",
    "What if we modified the methodology...",
    "How does this compare to...",
    "Can we extend this to...",
    "What are the limitations and future work for..."
  ],
  "paper_id": 1
}

Error (404):
{
  "detail": "Paper not found"
}
```

**cURL:**
```bash
curl -X GET http://localhost:8000/api/v1/papers/1/research-questions \
  -H "Authorization: Bearer TOKEN"
```

**JavaScript:**
```javascript
const response = await apiClient.getResearchQuestions(1);
console.log(response.data.questions);
```

## HTTP Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Request completed |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Include Authorization header |
| 403 | Forbidden | No permission for this resource |
| 404 | Not Found | Resource doesn't exist or deleted |
| 422 | Validation Error | Invalid data format |
| 429 | Rate Limited | Too many requests, wait before retrying |
| 500 | Server Error | Contact support or check logs |

## Error Responses

All errors follow this format:
```json
{
  "detail": "Human-readable error message"
}
```

Common errors:
- "Not authenticated" → Add Authorization header
- "Paper not found" → Verify paper ID exists
- "Invalid summary style" → Use: technical, simple, or balanced
- "Need at least 2 papers to compare" → Provide 2-5 paper IDs
- "Conversation not found" → Verify conversation ID exists

## Rate Limiting

Default limits per user per day:
- Chat: 50 messages
- Summary: 20 requests
- Analysis: 10 requests

When rate limited:
- Response: 429 Too Many Requests
- Retry after: 24 hours or contact admin

## Response Times

Typical response times:
- Chat: 2-5 seconds
- Summary: 3-8 seconds
- Trend Analysis: 5-10 seconds
- Paper Comparison: 4-8 seconds
- Research Questions: 3-6 seconds

## Data Limits

| Field | Limit | Notes |
|-------|-------|-------|
| Message length | 5000 chars | Very long messages may timeout |
| Compare papers | 5 max | Too many impacts performance |
| Trend analysis | 10 papers max | Large datasets take longer |
| Conversation history | Unlimited | Stored indefinitely |

## Example Full Flow

### Conversation Flow
```
1. Send message to paper
   POST /papers/1/chat
   {"message": "What is the sample size?"}
   
   Response: 
   {
     "response": "The study included 50 participants...",
     "conversation_id": 123
   }

2. Send follow-up (same conversation)
   POST /papers/1/chat
   {"message": "What was the age range?"}
   
   Response:
   {
     "response": "Participants ranged from 18-65 years old...",
     "conversation_id": 123  // Same ID = same conversation
   }

3. Retrieve full conversation
   GET /conversations/123
   
   Response:
   {
     "messages": [
       {"role": "user", "content": "What is the sample size?"},
       {"role": "assistant", "content": "The study included..."},
       {"role": "user", "content": "What was the age range?"},
       {"role": "assistant", "content": "Participants ranged..."}
     ]
   }
```

## Testing Endpoints

### Via Terminal
```bash
# Test chat
curl -X POST http://localhost:8000/api/v1/papers/1/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# Test summary
curl -X POST http://localhost:8000/api/v1/papers/1/summary \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"style": "balanced"}'

# Test research questions
curl -X GET http://localhost:8000/api/v1/papers/1/research-questions \
  -H "Authorization: Bearer TOKEN"
```

### Via Python
```python
import requests

headers = {"Authorization": f"Bearer {token}"}

# Chat
response = requests.post(
    "http://localhost:8000/api/v1/papers/1/chat",
    headers=headers,
    json={"message": "What is the main finding?"}
)
print(response.json())

# Summary
response = requests.post(
    "http://localhost:8000/api/v1/papers/1/summary",
    headers=headers,
    json={"style": "technical"}
)
print(response.json())
```

## Related Documents

- [AI Features Guide](AI_FEATURES.md) - Detailed feature documentation
- [Deployment Guide](AI_DEPLOYMENT.md) - Production deployment steps
- [Quick Start Guide](AI_QUICKSTART.md) - User tutorials
- [API Code](app/api/routes/ai.py) - Source implementation
- [AI Service](app/services/ai_service.py) - OpenAI integration
- [Tests](test_ai_features.py) - Test examples

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Include `Authorization: Bearer TOKEN` header |
| Empty response | Check InternetConnection and OpenAI status |
| Slow response | Requests typically take 2-10 seconds, be patient |
| Rate limit error | Wait 24 hours or ask admin for higher limits |
| Paper not found | Verify paper_id is correct |
| Invalid style | Use: "balanced", "technical", or "simple" |

## Quick Reference

### JavaScript Frontend
```javascript
import { apiClient } from '@/lib/api';

// Chat
await apiClient.chatAboutPaper(paperId, "Your question");

// Summary
await apiClient.getPaperSummary(paperId, "technical");

// Analysis
await apiClient.analyzeTrends("Category", 5);
await apiClient.comparePapers([id1, id2]);
await apiClient.getResearchQuestions(paperId);
```

### REST API
```
POST   /papers/{id}/chat                    Chat
GET    /papers/{id}/conversations          List conversations
GET    /conversations/{id}                 Get conversation
DELETE /conversations/{id}                 Delete conversation
POST   /papers/{id}/summary                Generate summary
POST   /papers/analyze/trends              Analyze trends
POST   /papers/compare                     Compare papers
GET    /papers/{id}/research-questions    Research questions
```

---

**Last Updated**: 2024
**Status**: Production Ready ✅
**Support**: See AI_FEATURES.md
