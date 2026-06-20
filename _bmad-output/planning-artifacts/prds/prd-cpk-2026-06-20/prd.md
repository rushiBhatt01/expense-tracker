---
title: Smart Expense Splitter
status: final
created: 2026-06-20
updated: 2026-06-20
---

# PRD: Smart Expense Splitter

## 0. Document Purpose
This Product Requirement Document (PRD) defines the requirements for a Splitwise-like expense tracking and settlement prototype. It serves as the single source of truth for the development of a MERN-stack hobby application, focusing on simplifying group debts with the minimum number of transactions.

## 1. Vision
The Smart Expense Splitter is a web application that helps logged-in users track shared group expenses and automatically calculates the most efficient way to settle outstanding balances. Instead of multiple complex transactions, it simplifies debts so that the group can settle their accounts using the fewest possible payments, ensuring data integrity through strict ACID database transactions.

## 2. Target User

### 2.1 Jobs To Be Done
* **Functional:** Securely log shared group expenses (who paid, amount, and split details) via interactive forms and view a clear list of who owes how much to whom.
* **Social/Emotional:** Settle up with friends quickly and transparently without having to negotiate calculations or execute tedious individual peer-to-peer bank transfers.

### 2.2 Key User Journeys
* **UJ-1: Creating a Group and Adding Expenses**
  * **Persona & context:** Rushi is planning a weekend road trip with 4 friends.
  * **Entry state:** Visits the home page, logs in securely via the Clerk authentication interface.
  * **Path:** Rushi clicks "Create Trip Group", inputs the group name "Road Trip 2026", and adds the names/emails of the 5 participants. The app saves the group and redirects Rushi to the group dashboard. Rushi shares this URL or sends invites to the other 4 friends.
  * **Climax:** Rushi logs a "Gas" expense of $100 paid by him, split equally among everyone, using an interactive modal form. The dashboard immediately updates to show Rushi is owed $20 by each of the other 4 friends.
  * **Resolution:** Rushi signs out or bookmarks the group to view later.

* **UJ-2: Settle Up with Simplified Transactions**
  * **Persona & context:** Rushi and friends finish the trip and want to settle up.
  * **Entry state:** Logged in via Clerk, accessing the group dashboard.
  * **Path:** The group has logged 10 expenses. Rushi navigates to the "Settle Up" tab.
  * **Climax:** The app displays a "Settlement Plan" card: instead of 8 individual transfers, it outputs a list of 2 transactions: "Alice pays Rushi $30" and "Bob pays Rushi $15".
  * **Resolution:** Alice and Bob transfer the money externally, mark their payments as settled in the interactive UI, and the net balances zero out.

## 3. Glossary
* **Group / Trip** — A workspace container defined by a unique ID, containing a list of members and a list of expenses.
* **Member** — A participant in a Group. Associated with a Clerk user profile if registered.
* **Expense** — A transaction record containing the description, total amount, payer, date, and split details (how much each member owes).
* **Net Balance** — The net amount a member is owed (positive) or owes (negative) across all expenses in a group. Calculated as `Total Paid by Member - Total Owed by Member`.
* **Settlement Plan** — A calculated sequence of transfer instructions (Payer $\rightarrow$ Recipient $\rightarrow$ Amount) that resolves all Net Balances to zero.
* **Simplification Algorithm** — The greedy mathematical algorithm that minimizes the number of payment transactions.
* **ACID Transactions** — Atomic, Consistent, Isolated, and Durable database operations ensuring that adding/modifying expenses and updating group balances succeed or fail together as a single unit.

## 4. Features

### 4.1 Clerk User Authentication & Group Management
**Description:** Users register and log in using the Clerk service. Only authorized group members can view or add expenses.
[ASSUMPTION: Clerk is used for user signup, login, and profile management, utilizing Clerk's pre-built UI components for React.]

**Functional Requirements:**
* **FR-1:** Visitors must log in or sign up via Clerk to access group dashboards.
* **FR-2:** An authenticated user can create a Group and invite other users by email.
* **FR-3:** The system must restrict group access to members who are invited and authenticated.
* **FR-4:** The home dashboard lists all groups the logged-in user belongs to.

### 4.2 Interactive Expense Logging and Splits
**Description:** Users can add and edit expense items via interactive forms and modals. Each expense has a payer, a total amount, and split details.
[ASSUMPTION: v1 will only support equal splits and manual custom splits (amount-based). Percentage splits and weight splits are deferred.]
[ASSUMPTION: The application operates in a single currency specified at the Group level (default: USD / local currency symbol), with no automated currency conversions in v1.]

**Functional Requirements:**
* **FR-5:** A member can log an expense by opening an interactive React modal and specifying: Description, Total Amount, Date, Payer, and Split Method.
* **FR-6:** The split must default to "Equal Split" among all members of the group.
* **FR-7:** The system must validate that the sum of all individual split shares exactly equals the Total Amount of the expense.
* **FR-8:** Users can delete or edit existing expenses, updating the group's net balances immediately.

### 4.3 ACID Debt Simplification & Settlements
**Description:** The application calculates the net balances and runs a simplification algorithm to generate the fewest transactions needed to settle all debts. Database updates are executed in ACID transactions to prevent partial updates.
[ASSUMPTION: The engine will use a greedy heuristic algorithm: it identifies the member with the largest credit (most positive net balance) and the member with the largest debt (most negative net balance), matches them, performs a transfer of the minimum of the two absolute values, updates their balances, and repeats until all balances are zero.]
[ASSUMPTION: MongoDB multi-document transactions will be implemented in the Express backend using Mongoose to enforce ACID properties when recording/modifying expenses or logging settlements.]

**Functional Requirements:**
* **FR-9:** The backend must calculate each member's Net Balance dynamically by summing up all paid amounts and subtracting all owed split shares.
* **FR-10:** The system must generate a Settlement Plan that outlines who pays whom and how much.
* **FR-11:** The Settlement Plan must minimize the number of transfer operations (transactions).
* **FR-12:** A member can mark a settlement transaction as "Paid", which creates a special settlement expense to adjust the net balances to zero.
* **FR-13:** All expense insertions, updates, and deletes must execute inside a MongoDB transaction, ensuring atomicity and consistency.

## 5. Non-Goals (Explicit)
* No custom password authentication system (outsourced entirely to Clerk).
* No integration with actual payment gateways (no Venmo, PayPal, or UPI API calls). Payment tracking is status-only.
* No multi-currency support or real-time exchange rate calculation.
* No push notifications or automated emails.

## 6. MVP Scope

### 6.1 In Scope
* MERN Stack architecture: Express/Node.js API, MongoDB database, React frontend.
* User authentication and registration via Clerk.
* Interactive React UI with form validation and modal inputs.
* Logging expenses with equal or custom split amounts.
* Dynamic calculation of Net Balances using MongoDB ACID transactions.
* Simplified settlement plan generation on the frontend/backend using the greedy algorithm.
* Simple clean UI with a dark mode or sleek dashboard theme.

### 6.2 Out of Scope for MVP
* Multi-currency groups (deferred to v2).
* Budget categories and receipt OCR upload (deferred to v3).
* Real-time sync via WebSockets (standard API polling/refresh is sufficient for MVP).

## 7. Success Metrics
* **Hobby Success:** The app is fully responsive, runs locally or on a free tier (e.g., Render/Vercel), and accurately simplifies a complex set of 10+ transactions among 5 people into the minimum set of payments under 50ms, with zero database inconsistency.

## 8. Open Questions
* *None. All initial design and input questions resolved.*

## 9. Assumptions Index
* **A-1 (Authentication):** Clerk is used for user auth and session management.
* **A-2 (Split Types):** Support is restricted to Equal and Custom Amount splits only.
* **A-3 (Currency):** Single currency per group, specified at creation.
* **A-4 (Algorithm):** A greedy match heuristic is acceptable for minimizing transactions.
* **A-5 (ACID Operations):** MongoDB transactions (via Mongoose) are used in Express to guarantee atomic updates.
