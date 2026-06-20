---
baseline_commit: c8aa63ede41a2eb3fc470765f22a501fa5b317e3
---
# Story 1.3: Group Workspace Retrieval

Status: review

## Story

As an authenticated member,
I want to view the group dashboard by its unique URL,
so that I can see the list of participants and expenses.

## Acceptance Criteria

1. **Given** a user is invited or added to a Group.
2. **When** they navigate to `/groups/:id` while authenticated.
3. **Then** the server checks if the user's Clerk ID is associated with the Group.
4. **And** if authorized, returns the group name, member list, and logged expenses to render on the dashboard.
5. **And** if unauthorized, returns a 403 Forbidden page.

## Tasks / Subtasks

- [x] Task 1: Create Group Retrieval Backend Endpoint (`GET /api/groups/:id`)
  - [x] Add GET route handler for group by ID in `server/src/routes/groups.ts`.
  - [x] Extract user ID from Clerk auth middleware (AD-3).
  - [x] Query MongoDB for the Group by ID. If not found, return 404.
  - [x] Verify that the user ID exists in the Group's `members` array (AD-6).
  - [x] If unauthorized, return 403 Forbidden with `{ error: "Access denied" }`.
  - [x] If authorized, return group name, members, creatorId, and empty expenses array.
- [x] Task 2: Implement Client-Side URL Routing and Dynamic Loading
  - [x] In `client/src/App.tsx`, implement path matching for `/groups/:id` to extract `groupId`.
  - [x] If path matches, render `<GroupDashboard groupId={groupId} />`.
- [x] Task 3: Build GroupDashboard Component
  - [x] Create `client/src/pages/GroupDashboard.tsx`.
  - [x] Implement `useEffect` fetch to `GET http://localhost:5000/api/groups/:id` with Bearer auth token header (AD-3, AD-5).
  - [x] Handle 403 Forbidden by rendering a secure error page.
  - [x] Render group header, member cards (showing active users), empty expenses list, and empty settlement plan placeholder cards.

## Dev Notes

- **Authorization Middleware (AD-3):** Validate request token on the backend to enforce group boundaries.
- **Unified Clerk ID (AD-6):** User lookup must align on Clerk User ID.

### References

- PRD: [_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md](file:///c:/Users/rakshit/Desktop/New%20folder/expense-tracker/_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md)
- Architecture Spine: [_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md](file:///c:/Users/rakshit/Desktop/New%20folder/expense-tracker/_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

None.

### Completion Notes List

- Implemented backend retrieval controller with database membership verification.
- Implemented state-based browser routing integration for `/groups/:id`.
- Designed responsive workspace layout loaded from dynamic endpoints with token authentication header.

### File List

- `server/src/routes/groups.ts`
- `client/src/App.tsx`
- `client/src/pages/GroupDashboard.tsx`
