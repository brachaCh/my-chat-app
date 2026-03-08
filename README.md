# SecureChat

A secure, real-time messaging web application built as a home assignment.

---

## Tech Stack & Architecture

### Frontend
- **Next.js 16 (App Router)** — React framework with server-side rendering and file-based routing. The App Router enables a clean separation between Server Components (for secure data fetching) and Client Components (for interactive UI).
- **Tailwind CSS v4** — Utility-first CSS for a fast, responsive, mobile-friendly UI without writing custom stylesheets.
- **Lucide React** — Lightweight, consistent icon library.

### Backend
- **Next.js API Routes** — Server-side endpoints (`/api/messages`) handle all write operations with authentication checks and input validation, so no client can bypass security rules.
- **Next.js Proxy (Middleware)** — Runs on every request to verify the user session and redirect unauthenticated users to the login page before the page even renders.

### Database & Auth
- **Supabase (PostgreSQL)** — Managed Postgres database with Row Level Security (RLS) policies that enforce at the database level that users can only insert their own messages.
- **Supabase Auth** — Handles user authentication with multiple providers: Email + Password, Magic Link, and Google OAuth. JWTs are stored in secure cookies and refreshed automatically.

### Real-time
- **Supabase Realtime** — Listens to `INSERT` events on the `messages` table via WebSocket. New messages from any user appear instantly in all open chat windows without polling.

### Architecture Overview

```
Browser (Client Components)
    │
    ├── /login          → Supabase Auth (Password / Magic Link / Google)
    │
    └── /chat           → Reads messages from Supabase DB
                          Listens to Realtime channel
                          Sends new messages via POST /api/messages
                                │
                          Next.js API Route
                                │
                          Validates auth + input
                                │
                          Inserts into Supabase PostgreSQL
                                │
                          RLS policy enforced at DB level
```

---

## AI Tools Used

### Cursor (with Claude)
The entire project was developed inside **Cursor IDE**, using the built-in AI agent powered by **Claude (Anthropic)**.

---

## How AI Was Used During Development

The AI assisted throughout the full development lifecycle:

- **Project scaffolding** — Generated the initial folder structure, Supabase client files (`client.ts`, `server.ts`, `middleware.ts`), and wired up the App Router layout.

- **UI development** — Built the Login page (with mode toggle between Password and Magic Link) and the Chat page (message bubbles, avatar initials, auto-scroll) based on design requirements.

- **Security implementation** — Wrote the API route with server-side auth checks and input validation, and set up the Proxy middleware for protected routes.

- **Database schema** — Generated the full SQL for the `messages` table including RLS policies and Realtime publication.

- **Bug fixing** — Diagnosed and resolved build errors specific to Next.js 16 (e.g., the `middleware` → `proxy` rename, `ssr: false` constraints in the App Router, and prerender failures with placeholder env vars).

- **Google OAuth** — Added the Google sign-in button and `signInWithOAuth` flow after identifying that email rate limits were blocking multi-user testing.

- **Deployment guidance** — Provided step-by-step instructions for GitHub setup, Vercel deployment, and environment variable configuration.

The workflow was conversational: describe the requirement → AI generates the code → review and test → iterate on errors or new features.

---

## What I Would Improve With More Time

1. **Private / Direct Messaging** — Currently all messages go into one global room. I would add the ability to start a private conversation with a specific user.

2. **Message Reactions & Replies** — Support for emoji reactions and threaded replies to specific messages.

3. **Read Receipts** — Show whether a message has been seen by the recipient.

4. **File & Image Sharing** — Allow users to upload and share images using Supabase Storage.

5. **User Profiles** — Let users set a display name and profile picture instead of showing only the email address.

6. **Notifications** — Browser push notifications for new messages when the tab is in the background.

7. **Message Search** — Full-text search across the conversation history.

8. **End-to-End Encryption** — Implement client-side encryption (e.g., with the Web Crypto API) so that even Supabase cannot read message content.

9. **Rate Limiting on the API** — Add per-user rate limiting on the `/api/messages` endpoint to prevent spam.

10. **Tests** — Add unit tests for the API route validation logic and integration tests for the auth flow.
