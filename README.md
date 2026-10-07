# BudgetBuddy — Full-Stack Finance Dashboard Starter Template

BudgetBuddy is an full-stack template built to help developers quickly spin up a personal finance dashboard. It features out-of-the-box user authentication via **Clerk**, bank account integration via **Plaid**, and data visualizations powered by **Recharts**.

Use this repository as a starting point or template for your own budgeting tools, wealth trackers, or fintech experiments.

## 🌟 Key Features

* **Authentication & User Management:** Pre-configured Clerk integration for secure sign-in and session gating.

* **Bank Account Integration:** Native Plaid Link workflow to connect sandbox or live bank accounts.

* **Transaction Aggregation:** Automatically syncs and aggregates real-time bank transactions across linked accounts.

* **Interactive Analytics:** Dynamic monthly bar charts and category spending pie charts powered by Recharts.

* **Filtering & Insights:** Dynamic client-side filtering by bank account and billing month.

* **Containerized:** Docker Compose setup included for instant multi-container deployment.

## 🛠️ Tech Stack

### Frontend

* **Core:** React 19, Vite 8, React Router 7

* **Authentication:** `@clerk/clerk-react`

* **Integrations:** `react-plaid-link`

* **Data Visualization:** Recharts

* **Linting:** Oxlint

### Backend

* **Core:** Node.js, Express 5

* **Authentication:** `@clerk/express`

* **Bank API:** `plaid` (Node SDK)

* **Security & Utility:** `helmet`, `cors`, `express-validator`

### Infrastructure

* **Containerization:** Docker & Docker Compose

## 📂 Project Structure

```
Budget/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── tests/
│       └── index.test.js
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── components/
    │   ├── BankConnect.jsx
    │   ├── MonthlyBarChart.jsx
    │   ├── SpendingPieChart.jsx
    │   └── TransactionTable.jsx
    └── pages/
        └── Dashboard.jsx

```

## ⚙️ Environment Variables

Copy the template below to set up your environment variables.

Create a `.env` file in your project root or pass these values to your execution context:

```
# Frontend Config
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend Config
CLERK_SECRET_KEY=sk_test_...
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_or_development_secret
PLAID_ENV=sandbox
FRONTEND_URL=http://localhost:8080

```

> ⚠️ **Note:** Never commit real secrets to version control. Always keep production or sandbox keys in `.env` files that are excluded via `.gitignore`.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed locally:

* [Node.js](https://nodejs.org/) (v18 or higher)

* [npm](https://www.npmjs.com/)

* [Docker & Docker Desktop](https://www.docker.com/) (Optional, for containerized run)

### Option 1: Local Development (Without Docker)

#### 1. Clone & Set Up Environment

```
git clone https://github.com/your-username/budgetbuddy.git
cd budgetbuddy

```

#### 2. Start the Backend

```
cd backend
npm install
npm start

```

The API server will launch at **`http://localhost:3000`**.

#### 3. Start the Frontend

In a new terminal window:

```
cd frontend
npm install
npm run dev

```

The Vite dev server will launch at **`http://localhost:5173`**.

### Option 2: Docker Compose Setup

To launch both the frontend and backend services together in isolated containers:

```
docker compose up -d --build

```

Access the application in your browser:

* **Frontend Dashboard:** <http://localhost:8080>

* **Backend API:** <http://localhost:3000>

To stop the containers:

```
docker compose down

```

## 🧪 Verification & Development Scripts

Run these commands to verify code quality and build steps locally:

**Frontend Validation:**

```
cd frontend
npm run lint    # Runs Oxlint
npm run build   # Validates production build output

```

**Docker Configuration Validation:**

```
docker compose build

```

## 📄 License

This repository is provided as a starting template. Feel free to customize, fork, and adapt it for personal or commercial projects.