---
baseline_commit: c8aa63ede41a2eb3fc470765f22a501fa5b317e3
---
# Story 1.2: Group Creation & Member Configuration

Status: review

## Story

As an authenticated user,
I want to create a group and input participant names and emails,
so that we can track trip/project expenses together.

## Acceptance Criteria

1. **Given** the user is authenticated and on their dashboard.
2. **When** they click "Create Group" and enter a name (e.g. "Road Trip 2026") and invite emails.
3. **Then** the backend writes a Group document to MongoDB with the creator as a member.
4. **And** generates a unique ID, redirecting the user to the newly created Group Dashboard.

## Tasks / Subtasks

- [x] Task 1: Initialize server directory (AD-1)
  - [x] Initialize Express application in `server/` with npm.
  - [x] Install base dependencies: `express`, `mongoose`, `cors`, `dotenv`, `@clerk/express`.
  - [x] Set up basic `server/tsconfig.json` and basic project setup.
- [x] Task 2: Implement Group Database Schema (AD-2, AD-6)
  - [x] Define the `Group` model schema with fields: `name`, `members` (array of Clerk User ID strings), `creatorId` (Clerk User ID string), `createdAt`.
  - [x] Ensure Mongoose schema maps Clerk User IDs (`user_...`) as the primary key reference (AD-6).
- [x] Task 3: Create Express Server Entry & MongoDB Connection
  - [x] Set up connection to MongoDB (using local Mongoose or environment URI) in `server/src/index.ts`.
  - [x] Implement Clerk middleware check for endpoints (AD-3).
- [x] Task 4: Implement Group Creation Endpoint (`POST /api/groups`)
  - [x] Add route handler to create a group in `server/src/routes/groups.ts`.
  - [x] Verify requester token via `clerkMiddleware` and retrieve user ID.
  - [x] Insert Group document and return JSON response containing `id`.
- [x] Task 5: Implement UI Modal & Submission Flow in Client
  - [x] Create an interactive "Create Group" modal component in client.
  - [x] Bind state for group name and a dynamic list of participant email textboxes.
  - [x] Post form data to backend API and redirect user to `/groups/:id` upon success (AD-5).

## Dev Notes

- **Database transactions (AD-2):** For simple creation, standard Mongo insert is fine; future nested writes (expenses, balances) must enforce transaction boundaries.
- **Unified Clerk ID (AD-6):** Use Clerk User IDs (`user_...`) for representing users and group members in database schemas.
- **Strict Client-Server separation (AD-1):** Backend runs in `server/` on port 5000 (or other config), communicating with React on port 5173.

### References

- PRD: [_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md](file:///c:/Users/rakshit/Desktop/New%20folder/expense-tracker/_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md)
- Architecture Spine: [_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md](file:///c:/Users/rakshit/Desktop/New%20folder/expense-tracker/_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

None.

### Completion Notes List

- Initialized Express backend workspace under `server/` with tsx, typescript, mongoose.
- Implemented Group document model using Clerk User IDs as references.
- Implemented `POST /api/groups` endpoint parsing Bearer tokens using Clerk middleware and inserting to DB.
- Built interactive overlay modal in client allowing dynamic participant invitation.
- Configured frontend API call to post request and trigger redirect.

### File List

- `server/package.json`
- `server/tsconfig.json`
- `server/.env`
- `server/src/index.ts`
- `server/src/models/Group.ts`
- `server/src/routes/groups.ts`
- `client/src/index.css`
- `client/src/components/CreateGroupModal.tsx`
- `client/src/pages/Dashboard.tsx`
