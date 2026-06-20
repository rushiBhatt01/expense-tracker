# cpk — Smart Expense Splitter

A modern, responsive, decoupled MERN-stack application (React, Node/Express, MongoDB) for tracking group expenses and automatically calculating the most efficient way to settle outstanding balances using a greedy transaction minimization heuristic.

---

## Codebase Architecture
The project follows a decoupled **Client-Server Layered Architecture**:
* `/client`: React application with Vite, TypeScript, and `@clerk/clerk-react` for session state management.
* `/server`: Express backend application with TypeScript (`tsx`), Mongoose schemas, and Clerk verification middleware.

---

## Prerequisites
Before setting up the project locally, ensure you have the following installed:
* **Node.js** v20+ and **npm**
* **MongoDB** (running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas Cloud URI)

---

## Getting Started

### 1. Configure the Express Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file in the `server/` directory and populate it with the following:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/cpk
   CLERK_PUBLISHABLE_KEY=pk_test_... # Your Clerk Publishable Key
   CLERK_SECRET_KEY=sk_test_...      # Your Clerk Secret Key
   ```
   *(Note: To test without active Clerk credentials, leave the default `sk_test_mock...` key. The server will automatically trigger a development bypass, mapping requests to a local mock administrator account `user_mock_rushi`.)*

4. Run the backend server in development mode:
   ```bash
   npm run dev
   ```
   The backend will start listening at `http://localhost:5000`.

---

### 2. Configure the React Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd client
   ```
2. Install the client dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env.local` file in the `client/` directory:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_... # Match the key used in the backend
   ```
4. Run the frontend application in development mode:
   ```bash
   npm run dev
   ```
   The application will start running at `http://localhost:5173`.

---

## Core Features & Tech Stack

### Frontend Components (`/client`)
* **State-Based Router:** Custom router-less path matching configured in `App.tsx` for fast rendering.
* **Responsive Dark Theme:** Space-themed dark palette with HSL variables, glassmorphic layout modals, and dynamic transition classes.
* **Dynamic Modals:** Modals for Group Creation (dynamic invite list) and Billing Entries (supporting Equal and Custom splits).

### Backend Services (`/server`)
* **Greedy Settlement Plan (AD-4):** Minimized transaction heuristic mapping debtor to creditor in $O(N \log N)$ running in under **1ms** (NFR-1).
* **ACID Transactions (AD-2):** Writes modifying expenses or settling balances wrap in a Mongoose connection transaction, with a safe query fallback block for standalone deployments.
* **Unified Clerk IDs (AD-6):** Clerk session IDs (`user_...`) are mapped directly as primary keys across MongoDB schemas.
