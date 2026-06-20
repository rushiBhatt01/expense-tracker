---
stepsCompleted: ["1", "2", "3", "4"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-cpk-2026-06-20/prd.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-cpk-2026-06-20/ARCHITECTURE-SPINE.md"
---

# cpk - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for cpk, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

* **FR-1:** Visitors must log in or sign up via Clerk to access group dashboards.
* **FR-2:** An authenticated user can create a Group and invite other users by email.
* **FR-3:** The system must restrict group access to members who are invited and authenticated.
* **FR-4:** The home dashboard lists all groups the logged-in user belongs to.
* **FR-5:** A member can log an expense by opening an interactive React modal and specifying: Description, Total Amount, Date, Payer, and Split Method.
* **FR-6:** The split must default to "Equal Split" among all members of the group.
* **FR-7:** The system must validate that the sum of all individual split shares exactly equals the Total Amount of the expense.
* **FR-8:** Users can delete or edit existing expenses, updating the group's net balances immediately.
* **FR-9:** The backend must calculate each member's Net Balance dynamically by summing up all paid amounts and subtracting all owed split shares.
* **FR-10:** The system must generate a Settlement Plan that outlines who pays whom and how much.
* **FR-11:** The Settlement Plan must minimize the number of transfer operations (transactions).
* **FR-12:** A member can mark a settlement transaction as "Paid", which creates a special settlement expense to adjust the net balances to zero.
* **FR-13:** All expense insertions, updates, and deletes must execute inside a MongoDB transaction, ensuring atomicity and consistency.

### NonFunctional Requirements

* **NFR-1 (Performance & Responsiveness):** The settlement plan calculations must execute in under 50ms for a complex set of 10+ transactions among 5 people.
* **NFR-2 (Consistency):** Ensure zero database inconsistency by wrapping all balance adjustments and logs in atomic transactions.
* **NFR-3 (Usability):** The application must be fully responsive (mobile and desktop support).
* **NFR-4 (Security):** All API endpoints except root landing pages must require JWT verification from Clerk.

### Additional Requirements

* **AD-1 (Decoupled Architecture):** React frontend and Express backend must run as completely decoupled packages, interacting strictly via stateless HTTP REST APIs.
* **AD-2 (ACID Bounds):** All database updates to Group and Expense documents must execute within a Mongoose session transaction.
* **AD-3 (Token Verification):** Express backend must employ the `clerkMiddleware` from `@clerk/express` (or similar SDK) to validate Bearer tokens.
* **AD-4 (Calculation Site):** The greedy settlement calculation must run entirely on the backend to avoid client-side CPU overhead.
* **AD-5 (Sync Policy):** The frontend React application must trigger a hard state refetch immediately upon any successful API write operation.
* **AD-6 (User ID Key):** Clerk User IDs (`user_...`) must be used as primary and foreign keys for representing users and group members in schemas.
* **Rounding Convention:** Fractional cent splits must round to the nearest cent, with rounding dust assigned to the first participant in the split list to keep totals balanced.
* **Stack Versions:** Node.js v20+, Express.js v4+, Mongoose v8+, React v18+, Clerk React SDK v5+, Clerk Express SDK v2+.

### UX Design Requirements

*None. No UX design document exists for this project.*

### FR Coverage Map

* **FR-1:** Epic 1 - Clerk user login/signup
* **FR-2:** Epic 1 - Group creation and user invitation
* **FR-3:** Epic 1 - Secure group access restriction
* **FR-4:** Epic 1 - Home dashboard listing user groups
* **FR-5:** Epic 2 - Log shared expenses with interactive React modals
* **FR-6:** Epic 2 - Default to equal splits
* **FR-7:** Epic 2 - Split validation (sum of splits equals total amount)
* **FR-8:** Epic 2 - Edit and delete logged expenses
* **FR-9:** Epic 3 - Dynamic backend net balance calculation
* **FR-10:** Epic 3 - Generate settlement plan showing payer/recipient transactions
* **FR-11:** Epic 3 - Run backend greedy debt simplification algorithm to minimize transactions
* **FR-12:** Epic 3 - Mark settlement transaction as paid to zero out balances
* **FR-13:** Epic 2 - Wrap expense writes/updates in MongoDB sessions/transactions (ACID)

## Epic List

### Epic 1: User Authentication & Group Workspace
Users can securely log in via Clerk, create group spaces (trips/projects), invite other users by email, and view a dashboard list of all active groups.
* **FRs Covered:** FR-1, FR-2, FR-3, FR-4

### Epic 2: Expense Logging & Management
Group members can add, edit, and delete shared expenses using an interactive modal-based React form, with client-side and backend amount validations, all wrapped in MongoDB ACID transactions.
* **FRs Covered:** FR-5, FR-6, FR-7, FR-8, FR-13

### Epic 3: Net Balances & Debt Simplification
The system dynamically calculates each member's net balance, calculates the simplified settlement plan on the backend using a greedy optimization algorithm, and allows members to mark debts as settled in the UI.
* **FRs Covered:** FR-9, FR-10, FR-11, FR-12

## Epic 1: User Authentication & Group Workspace
Goal: Enable users to securely register, log in, create groups, invite members, and access group dashboards via Clerk auth.

### Story 1.1: Clerk Login Integration
As a visitor,
I want to authenticate via Clerk,
So that my account is verified and my groups are protected.

**Acceptance Criteria:**
* **Given** a visitor navigates to the application landing page.
* **When** they click "Sign In" or "Sign Up".
* **Then** the Clerk authentication modal displays.
* **And** once authenticated successfully, they are redirected to their personalized dashboard.

### Story 1.2: Group Creation & Member Configuration
As an authenticated user,
I want to create a group and input participant names and emails,
So that we can track trip/project expenses together.

**Acceptance Criteria:**
* **Given** the user is authenticated and on their dashboard.
* **When** they click "Create Group" and enter a name (e.g. "Road Trip 2026") and invite emails.
* **Then** the backend writes a Group document to MongoDB with the creator as a member.
* **And** generates a unique ID, redirecting the user to the newly created Group Dashboard.

### Story 1.3: Group Workspace Retrieval
As an authenticated member,
I want to view the group dashboard by its unique URL,
So that I can see the list of participants and expenses.

**Acceptance Criteria:**
* **Given** a user is invited or added to a Group.
* **When** they navigate to `/groups/:id` while authenticated.
* **Then** the server checks if the user's Clerk ID is associated with the Group.
* **And** if authorized, returns the group name, member list, and logged expenses to render on the dashboard.
* **And** if unauthorized, returns a 403 Forbidden page.

---

## Epic 2: Expense Logging & Management
Goal: Enable group members to log shared expenses with custom/equal splits, view them in an interactive form list, and edit or delete them.

### Story 2.1: Add Expense with Equal Split
As a group member,
I want to add an expense split equally among all members,
So that the base costs are divided fairly.

**Acceptance Criteria:**
* **Given** the user is on the Group dashboard.
* **When** they open the "Add Expense" modal, enter a description, amount (e.g., $100), select "Equal Split", and select the payer.
* **Then** the Express backend validates that the amount is a positive integer (representing cents).
* **And** inserts the Expense record and recalculates Net Balances inside a MongoDB transaction session (ACID).
* **And** the UI refetches the updated balances and displays them.

### Story 2.2: Add Expense with Custom Splits
As a group member,
I want to add an expense with custom split amounts per person,
So that unequal consumption is handled.

**Acceptance Criteria:**
* **Given** the user is in the "Add Expense" modal.
* **When** they select "Custom Split" and input split amounts for each participant.
* **Then** the React form validates that the sum of split amounts exactly matches the total expense amount.
* **And** if valid, the Express backend verifies the totals and executes the database insert within a MongoDB transaction.
* **And** the UI refetches and displays the updated balances.

### Story 2.3: Edit and Delete Expenses
As a group member,
I want to edit or delete logged expenses,
So that mistakes can be corrected.

**Acceptance Criteria:**
* **Given** the user is on the Group dashboard viewing an existing expense.
* **When** they edit the expense values or click "Delete".
* **Then** the system prompts for confirmation and executes the DB update/delete inside a MongoDB transaction.
* **And** updates the net balances, and triggers client refetch.

---

## Epic 3: Net Balances & Debt Simplification
Goal: Enable group members to view dynamic net balances and a simplified settlement plan, and log settlement transfers to balance out accounts.

### Story 3.1: Calculate Net Balances
As a group member,
I want to view everyone's computed net balance,
So that I know who owes and who is owed overall.

**Acceptance Criteria:**
* **Given** a group has multiple expenses logged.
* **When** the user visits the dashboard.
* **Then** the system aggregates all paid amounts and owed splits for each member dynamically (backend query).
* **And** displays positive net balances as "is owed $X" and negative net balances as "owes $Y".

### Story 3.2: Simplify Debts Settlement Plan
As a group member,
I want to view a simplified list of payments to settle all debts,
So that we minimize the number of transfers.

**Acceptance Criteria:**
* **Given** the group net balances are calculated.
* **When** the user clicks the "Settle Up" tab.
* **Then** the backend runs the greedy simplification algorithm.
* **And** returns the minimum transaction set (e.g. "Alice pays Rushi $30" instead of multiple small transactions) in under 50ms.

### Story 3.3: Record Settlement Payment
As a debtor,
I want to mark a settlement transaction as paid,
So that my balance is resolved to zero.

**Acceptance Criteria:**
* **Given** the user sees a settlement instruction "Alice pays Rushi $30".
* **When** Alice clicks "Mark as Paid" in the UI.
* **Then** the backend writes a special settlement expense record inside a MongoDB transaction.
* **And** the net balances for Alice and Rushi are adjusted to zero.


