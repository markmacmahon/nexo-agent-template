# Subscribers Feature

## Overview

The **Subscribers** feature enables partners to view and manage customer conversations organized by customer identity. Each subscriber represents a unique customer within an app and can have multiple conversation threads. This provides an inbox-style interface for managing all customer interactions.

## Database Schema

### `subscribers` Table

Stores customer identity within an app context.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `app_id` | UUID | FK to `apps.id` (ON DELETE CASCADE) |
| `customer_id` | TEXT | External customer identifier (required) |
| `display_name` | TEXT | Optional human-readable name |
| `metadata_json` | JSONB | Optional metadata (channel, locale, tags) |
| `created_at` | TIMESTAMP | When subscriber was created |
| `last_seen_at` | TIMESTAMP | Last customer message timestamp |
| `last_message_at` | TIMESTAMP | Last message (any role) timestamp |

**Constraints:**
- UNIQUE (`app_id`, `customer_id`)

**Indexes:**
- (`app_id`, `last_seen_at` DESC)
- (`app_id`, `last_message_at` DESC)

### `threads` Table Update

Added `subscriber_id` column:
- `subscriber_id` UUID FK → `subscribers.id` (ON DELETE SET NULL)
- Index on `subscriber_id`

## API Endpoints

All endpoints are **app-scoped** and require authentication. Authorization is enforced through the app's user_id relationship.

### List Subscribers
```
GET /apps/{app_id}/subscribers?page=1&size=50&q=search_term
```

**Returns:** Page<SubscriberSummary>

**Ordering:** `last_message_at DESC NULLS LAST, created_at DESC, id DESC`

**Fields:**
- All subscriber fields
- `thread_count` - Number of threads for this subscriber
- `last_message_preview` - TODO (placeholder for last message snippet)

**Search:** Query `q` searches `customer_id` and `display_name` (case-insensitive)

### Get Subscriber Detail
```
GET /apps/{app_id}/subscribers/{subscriber_id}
```

**Returns:** SubscriberRead

### List Subscriber Threads
```
GET /apps/{app_id}/subscribers/{subscriber_id}/threads?page=1&size=50
```

**Returns:** Page<ThreadSummary>

**Ordering:** `updated_at DESC`

**Fields:**
- All thread fields
- `message_count` - Number of messages in thread
- `last_message_at` - Timestamp of most recent message
- `last_message_preview` - TODO (placeholder for last message snippet)

### Send Message as Partner
```
POST /apps/{app_id}/threads/{thread_id}/messages/assistant
```

**Body:**
```json
{
  "content": "Message text",
  "content_json": {}  // optional
}
```

**Behavior:**
- Role is set to `"assistant"` (for OpenAI compatibility)
- `content_json.source` is automatically set to `"dashboard_agent"` for attribution
- Atomically allocates sequence number (thread-safe)

## Pagination

Using `fastapi-pagination` with offset-based pagination:
- `page` - Page number (starts at 1)
- `size` - Items per page (max 200, default 50)

**Response format:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "size": 50,
  "pages": 3
}
```

## Authorization Model

All endpoints use centralized authorization helpers from `app/dependencies.py`:

1. **`get_app_or_404(app_id, db, user)`** - Verifies app ownership
2. **`get_subscriber_in_app_or_404(app_id, subscriber_id, db, user)`** - Verifies subscriber belongs to user's app
3. **`get_thread_in_app_or_404(app_id, thread_id, db, user)`** - Verifies thread belongs to user's app

**Security guarantees:**
- No cross-app data leakage
- 404 response for unauthorized access (doesn't leak existence)
- All queries join through app relationship

## Customer ID Determination

The `customer_id` field on threads (and subscribers) is set by the client when creating a thread. There is no automatic ID assignment. For dashboard testing:

- Use the authenticated user's email or user ID as `customer_id`
- E2E tests should create threads with a deterministic `customer_id` value
- In production, the `customer_id` comes from your authentication system or customer identifier

## i18n Keys (Frontend)

All user-facing strings are in `frontend/i18n/keys.ts`:

**UI Labels:**
- `INBOX_TITLE` - "Inbox"
- `INBOX_SUBSCRIBERS_TITLE` - "Subscribers"
- `INBOX_THREADS_TITLE` - "Threads"
- `INBOX_CHAT_TITLE` - "Conversation"
- `INBOX_SEARCH_PLACEHOLDER` - "Search subscribers..."
- `INBOX_NO_SUBSCRIBERS` - "No subscribers yet"
- `INBOX_NO_SUBSCRIBERS_DESCRIPTION` - "Once customers interact with your app, they'll appear here."
- `INBOX_NO_THREADS` - "No threads yet for this subscriber"
- `INBOX_NO_THREAD_SELECTED` - "Select a thread to view the conversation"
- `INBOX_NEW_THREAD` - "New Thread"
- `INBOX_LOADING` - "Loading..."
- `INBOX_LOAD_MORE` - "Load More"

**Error Keys:**
- `ERROR_SUBSCRIBER_NOT_FOUND` - "Subscriber not found"
- `ERROR_FETCH_SUBSCRIBERS` - "Failed to fetch subscribers"
- `ERROR_FETCH_SUBSCRIBER_THREADS` - "Failed to fetch subscriber threads"

## Testing

Backend tests are in `tests/routes/test_subscribers.py`:

- ✅ List subscribers (empty state)
- ✅ List subscribers (unauthorized)
- ✅ List subscribers (wrong app)
- ✅ Get subscriber threads
- ✅ Get subscriber detail

**Test patterns:**
- Use `test_client`, `db_session`, `authenticated_user` fixtures
- Create test apps using `insert(App).values(...).returning(App)`
- All tests in `TestSubscribers` class with `@pytest.mark.asyncio(loop_scope="function")`

## Frontend Implementation (TODO)

The backend is complete. Frontend implementation requires:

1. **Server Actions** (`components/actions/subscribers-actions.ts`)
   - `fetchSubscribers(appId, page, q?)`
   - `fetchSubscriberThreads(appId, subscriberId, page)`

2. **3-Panel Layout** (at App detail page)
   - Left: Subscribers list (paginated)
   - Middle: Threads list for selected subscriber (paginated)
   - Right: Chat view for selected thread (reuse existing chat component)

3. **URL State Management**
   - Deep linking: `/apps/[id]?subscriber=<uuid>&thread=<uuid>`
   - Preserve selection on reload

4. **Pagination UI**
   - Use existing pagination components
   - Infinite scroll or "Load More" button pattern (consistent with rest of dashboard)

## Migration Commands

From project root:

```bash
# Start database
docker compose up -d db

# Run migrations
cd backend && uv run alembic upgrade head

# Verify schema
docker compose exec db psql -U postgres -d agents_db -c "\d subscribers"
```

## Accessing the Subscribers Page

**Navigation:**
1. Go to Dashboard → Apps → Edit App
2. Click the "Subscribers" button (Users icon) next to "Try Chat"
3. Or navigate directly to: `/dashboard/apps/[app_id]/subscribers`

The page shows a 3-panel layout:
- **Left**: Subscribers list with search and pagination
- **Middle**: Threads for selected subscriber
- **Right**: Chat view for selected thread

## Testing End-to-End

1. Create an app
2. Navigate to edit app page
3. Click "Subscribers" button
4. Create threads with a `customer_id` (subscribers auto-created)
5. Browse subscribers → select subscriber → view threads → open thread → send message as partner

**Test database access:**
```bash
docker compose exec db_test psql -U postgres -d agents_test_db
```
