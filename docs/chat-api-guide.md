# Chat API Guide - Manual Simulation Mode

## Overview

This chat system allows business owners to manage conversations with customers through their dashboard. In this initial version, **the business owner manually simulates assistant responses** - no AI/LLM integration yet.

## Architecture

### Database Model

**threads** - Conversations belonging to an App
- `id`: UUID primary key
- `app_id`: FK to apps table (CASCADE delete)
- `title`: Optional thread title
- `status`: active | archived | deleted (default: active)
- `customer_id`: Optional customer identifier (max 128 chars)
- `next_seq`: Integer for message ordering (default: 1)
- `created_at`, `updated_at`: Timestamps

**Indexes:**
- `(app_id, created_at)` - Fast thread listing
- `(app_id, customer_id)` - Filter by customer

**messages** - Chat messages within a Thread
- `id`: UUID primary key
- `thread_id`: FK to threads table (CASCADE delete)
- `seq`: Integer - monotonic sequence number (unique per thread)
- `role`: user | assistant | system | tool
- `content`: TEXT (nullable)
- `content_json`: JSONB (default `{}`)
- `created_at`: Timestamp

**Constraints:**
- UNIQUE `(thread_id, seq)`
- Index on `(thread_id, seq)`

### Authorization

All endpoints enforce: `app.user_id == current_user.id`

Only the app owner can access their threads and messages.

---

## API Endpoints

### Threads

#### Create Thread
```
POST /apps/{app_id}/threads
```

**Body:**
```json
{
  "title": "Support Conversation",
  "customer_id": "customer_123"  // optional
}
```

**Response:**
```json
{
  "id": "thread-uuid",
  "app_id": "app-uuid",
  "title": "Support Conversation",
  "status": "active",
  "customer_id": "customer_123",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### List Threads
```
GET /apps/{app_id}/threads?customer_id=&status=&page=1&size=20
```

**Query params:**
- `customer_id` (optional) - Filter by customer
- `status` (optional) - Filter by status
- `page` - Page number (default: 1)
- `size` - Page size (default: 20)

**Response:**
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "size": 20
}
```

#### Get Thread
```
GET /threads/{thread_id}
```

#### Update Thread
```
PATCH /threads/{thread_id}
```

**Body:**
```json
{
  "title": "Updated Title",      // optional
  "status": "archived"           // optional
}
```

#### Delete Thread
```
DELETE /threads/{thread_id}
```

---

### Messages

#### Send Customer Message
```
POST /apps/{app_id}/threads/{thread_id}/messages
```

**Body:**
```json
{
  "content": "Hello, I need help!",
  "content_json": {}  // optional
}
```

**Note:** Role is automatically set to "user"

**Response:**
```json
{
  "id": "msg-uuid",
  "thread_id": "thread-uuid",
  "seq": 1,
  "role": "user",
  "content": "Hello, I need help!",
  "content_json": {},
  "created_at": "2024-01-15T10:31:00Z"
}
```

#### Send Assistant Reply (Dashboard Owner)
```
POST /apps/{app_id}/threads/{thread_id}/messages/assistant
```

**Body:**
```json
{
  "content": "Hi! How can I help you today?",
  "content_json": {}  // optional
}
```

**Note:** Role is automatically set to "assistant"

**Response:** Same format as above with `"role": "assistant"`

#### List Messages
```
GET /apps/{app_id}/threads/{thread_id}/messages?before_seq=&limit=50
```

**Query params:**
- `before_seq` (optional) - Cursor pagination: get messages before this seq
- `limit` (optional) - Max messages to return (default: 50, max: 200)

**Response:**
```json
[
  {
    "id": "msg-uuid-1",
    "seq": 1,
    "role": "user",
    "content": "Hello, I need help!",
    ...
  },
  {
    "id": "msg-uuid-2",
    "seq": 2,
    "role": "assistant",
    "content": "Hi! How can I help you today?",
    ...
  }
]
```

**Note:** Messages ordered by `seq` ascending (oldest first)

#### Get Single Message
```
GET /messages/{message_id}
```

---

## Quick Start Example

### 1. Setup

```bash
# Run migration
cd backend
alembic upgrade head

# Register and login
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"SecurePass123#"}'

curl -X POST http://localhost:8000/auth/jwt/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=owner@example.com&password=SecurePass123#"

# Save token
export TOKEN="<your-token>"
```

### 2. Create App

```bash
curl -X POST http://localhost:8000/apps/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Chatbot","description":"Customer support"}'

export APP_ID="<app-id-from-response>"
```

### 3. Create Thread

```bash
curl -X POST http://localhost:8000/apps/$APP_ID/threads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Alice Support","customer_id":"alice_123"}'

export THREAD_ID="<thread-id-from-response>"
```

### 4. Customer Sends Message

```bash
curl -X POST http://localhost:8000/apps/$APP_ID/threads/$THREAD_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hi, I need help with my order"}'
```

### 5. Owner Replies (Dashboard)

```bash
curl -X POST http://localhost:8000/apps/$APP_ID/threads/$THREAD_ID/messages/assistant \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Sure! What is your order number?"}'
```

### 6. View Conversation

```bash
curl http://localhost:8000/apps/$APP_ID/threads/$THREAD_ID/messages \
  -H "Authorization: Bearer $TOKEN"
```

**Output:**
```json
[
  {"seq": 1, "role": "user", "content": "Hi, I need help with my order", ...},
  {"seq": 2, "role": "assistant", "content": "Sure! What is your order number?", ...}
]
```

---

## Message Sequencing

Messages use a **concurrency-safe sequence allocation** mechanism:

**Implementation:** `backend/app/routes/messages.py`

1. Lock thread row: `SELECT ... FOR UPDATE`
2. Read `threads.next_seq`
3. Increment `next_seq`, update `updated_at`
4. Insert message with allocated `seq`
5. Commit transaction

**Guarantees:**
- ✅ No duplicate seq numbers under concurrent writes
- ✅ Deterministic ordering for chat UI
- ✅ Efficient cursor pagination

---

## Dashboard UI Implementation

For your Next.js/React dashboard, you'll need:

### Thread List Page
```
/apps/[app_id]/threads
```

**Features:**
- List all threads for the app
- Filter by customer_id or status
- Click thread to open conversation

### Chat Page
```
/apps/[app_id]/threads/[thread_id]
```

**Features:**
- Display messages in conversation order (by seq)
- Real-time polling or websocket for new customer messages
- Text input for owner to send assistant replies
- Use pagination (before_seq) for long conversations

### Example React Hook

```typescript
// useThread.ts
import { useState, useEffect } from 'react';
import { listMessages, createMessage } from '@/app/openapi-client';

export function useThread(appId: string, threadId: string) {
  const [messages, setMessages] = useState([]);

  // Load messages
  useEffect(() => {
    async function load() {
      const msgs = await listMessages({
        path: { app_id: appId, thread_id: threadId },
        query: { limit: 100 }
      });
      setMessages(msgs);
    }
    load();

    // Poll for new messages every 5 seconds
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [appId, threadId]);

  // Send assistant reply
  async function reply(content: string) {
    await fetch(`/apps/${appId}/threads/${threadId}/messages/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    // Reload messages
    load();
  }

  return { messages, reply };
}
```

---

## Future Evolution

When ready to add AI/LLM responses:

1. Create a service layer in `backend/app/services/chat_engine.py`
2. Add streaming endpoint for real-time responses
3. Integrate LangChain, OpenAI, Anthropic, etc.

**But for now:** Simple manual simulation is perfect for validating the UX and gathering real conversations!

---

## Testing

Run tests:
```bash
make test-backend
```

**Coverage:**
- Thread CRUD and authorization
- Message creation with seq incrementing
- Cursor pagination
- Different message roles
