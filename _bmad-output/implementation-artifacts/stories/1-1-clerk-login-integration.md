# Story 1.1: Clerk Login Integration

Status: review

## Story

As a visitor,
I want to authenticate via Clerk,
so that my account is verified and my groups are protected.

## Acceptance Criteria

1. **Given** a visitor navigates to the application landing page.
2. **When** they click "Sign In" or "Sign Up".
3. **Then** the Clerk authentication modal displays.
4. **And** once authenticated successfully, they are redirected to their personalized dashboard.

## Tasks / Subtasks

- [x] Task 1: Setup client directory (AD-1)
  - [x] Initialize React frontend application in `client/` using Vite with React and TypeScript template.
  - [x] Configure `client/tsconfig.json` and basic project setup.
- [x] Task 2: Configure Clerk React SDK (AD-3, AD-6)
  - [x] Install `@clerk/clerk-react` (v5+).
  - [x] Set up environment variables (`.env.local`) with Clerk publishable key.
  - [x] Configure `ClerkProvider` in `client/src/main.tsx`.
- [x] Task 3: Create Landing Page & Dashboard Mock
  - [x] Implement `client/src/pages/LandingPage.tsx` with Sign In and Sign Up buttons.
  - [x] Implement `client/src/pages/Dashboard.tsx` displaying user details once authenticated.
  - [x] Configure routing to redirect authenticated users to the dashboard.
- [x] Task 4: Verify authentication flow
  - [x] Build and run client application locally.
  - [x] Verify that unauthenticated visitors are forced to Sign In/Sign Up.
  - [x] Verify Clerk modals appear and successfully redirect to the dashboard upon authentication.

## Dev Notes

- **Decoupled Architecture (AD-1):** React frontend runs in `client/` decoupled from backend.
- **Unified Clerk ID (AD-6):** Use Clerk User IDs (`user_...`) for routing and user sessions.
- **Clerk React SDK (v5):** Follow official Clerk documentation for wrapping application with `ClerkProvider` and using hooks (`useAuth`, `useUser`).

### References

- PRD: [_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md](file:///c:/Users/rakshit/Desktop/New%20folder/expense-tracker/_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md)
- Architecture Spine: [_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md](file:///c:/Users/rakshit/Desktop/New%20folder/expense-tracker/_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

None.

### Completion Notes List

- Scaffolded and set up Vite React-TypeScript client app.
- Configured Clerk auth and env credentials.
- Created dark-themed landing page and authenticated dashboard with UserButton.
- Verified successful production compilation.

### File List

- `client/src/index.css`
- `client/src/App.css`
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/pages/LandingPage.tsx`
- `client/src/pages/Dashboard.tsx`
- `client/.env.local`
- `client/package.json`
- `client/index.html`
