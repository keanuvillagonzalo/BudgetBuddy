# BudgetBuddy Repo Context

## Project Summary

This repository is a full-stack budget dashboard built with React + Vite on the frontend and Express on the backend. The app authenticates users with Clerk, connects their bank accounts through Plaid, syncs transactions, and renders monthly and category-based budget insights in the UI.

The app is not a generic starter app. It is a working prototype focused on a single authenticated user flow: sign in, connect a bank, sync transactions, filter by account and month, and visualize spending.

## Current Stack

### Frontend
- React 19
- Vite 8
- React Router 7
- Clerk React SDK
- Plaid Link React integration
- Recharts for charts
- Oxlint for linting

### Backend
- Express 5
- @clerk/express
- Plaid Node SDK
- express-validator
- helmet and cors

### Containerization
- Docker Compose
- Separate frontend and backend services
- Frontend exposed on port 8080
- Backend exposed on port 3000

## Repository Layout

```text
Budget/
├── AGENT_CONTEXT.md
├── README.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── tests/
│       └── index.test.js
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── components/
│   │   ├── BankConnect.jsx
│   │   ├── MonthlyBarChart.jsx
│   │   ├── SpendingPieChart.jsx
│   │   └── TransactionTable.jsx
│   ├── pages/
│   │   └── Dashboard.jsx
│   ├── public/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       └── assets/
└── .env.example (if present in the repo root; check before use)
```

## Important Runtime Behavior

### Frontend boot flow
- `frontend/src/main.jsx` loads the Clerk publishable key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`.
- It fails fast if the key is missing.
- `ClerkProvider` wraps the entire app.
- `frontend/src/App.jsx` renders the app with `BrowserRouter` and only exposes the dashboard to signed-in users.

### Dashboard flow
- `frontend/pages/Dashboard.jsx` calls `getToken()` from Clerk for each authenticated request.
- It fetches `/api/plaid/transactions` and uses the response to populate the transaction list and account list.
- It filters transactions by selected account and month before passing them to the charts.
- `BankConnect` is used to open the Plaid Link flow and exchange the public token.

### Bank connection flow
- `frontend/components/BankConnect.jsx` calls `/api/plaid/create_link_token` to get a Plaid Link token.
- After a successful Plaid Link session, it POSTs the returned `public_token` to `/api/plaid/exchange_public_token`.
- The dashboard then refreshes the transaction list.

### Backend auth + Plaid flow
- `backend/index.js` applies `helmet()`, `cors()`, `express.json()`, and `clerkMiddleware()` globally.
- The server expects a valid Clerk session for protected routes and uses `getAuth(req)`.
- Plaid access tokens are stored in Clerk `user.privateMetadata.plaidAccessTokens` instead of a database.
- The app also has a fallback check for `privateMetadata.plaidAccessToken` for backward compatibility.
- `GET /api/plaid/transactions` loads all access tokens for the signed-in user, loops through each one with `transactionsSync`, aggregates the results, and returns transactions + accounts.
- `POST /api/plaid/exchange_public_token` exchanges the Plaid public token and persists the resulting access token in Clerk metadata.
- `POST /api/plaid/debug/clear_all` removes all saved bank connections and calls Plaid `itemRemove` for each token.
- `POST /api/plaid/create_update_token` creates a Plaid Link token for a specific broken token index and is intended for reauthentication flow.

## Current Integration Notes and Known Mismatches

These are important for any agent working in the repo:

1. The frontend calls `/api/plaid/create_link_token`, but the backend currently exposes `/api/plaid/create_update_token`.
   - This is a likely route mismatch and should be standardized before further work.
   - The route name and behavior should be consistent between client and server.

2. The app stores bank tokens in Clerk metadata rather than a database, so it is user-scoped but not persisted in a custom app datastore.

3. The backend does not maintain a separate budget database or user-specific budget records.

4. There is no robust transaction pagination strategy beyond iterating through Plaid sync pages for each access token.

5. The Docker setup currently uses the frontend build with `VITE_CLERK_PUBLISHABLE_KEY` and exposes the app on `localhost:8080`.

## Environment Variables

The app depends on the following environment values:

- `VITE_CLERK_PUBLISHABLE_KEY` — required by the frontend and passed into the Docker build
- `CLERK_SECRET_KEY` — required by the backend for Clerk session verification
- `PLAID_CLIENT_ID` — required by the backend
- `PLAID_SECRET` — required by the backend
- `PLAID_ENV` — required by the backend (commonly `sandbox` locally)
- `FRONTEND_URL` — optional override for backend CORS, defaults to `http://localhost:8080`

Do not commit real secrets. Keep keys in a local `.env` file or shell environment only.

## Local Development

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server usually runs at `http://localhost:5173`.

### Backend
```powershell
cd backend
npm install
npm start
```

The API runs at `http://localhost:3000`.

### Docker Compose
```powershell
docker compose up -d --build
```

Then access:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`

## Verification Commands

When making frontend changes, validate with:
```powershell
cd frontend
npm run lint
npm run build
```

When validating the containerized app or environment wiring, use:
```powershell
docker compose build
```

## Working Rules for Agents

1. Read the specific file you are changing before editing; do not assume the existing architecture is complete or fully consistent.
2. Preserve the current Clerk + Plaid integration conventions.
3. Keep API routes and frontend fetch paths aligned.
4. Keep secrets out of source control and out of docs.
5. Prefer user-scoped metadata and explicit contracts when adding new features.
6. Do not add database-backed budget state unless the project is intentionally expanded beyond the current prototype.
7. When touching auth or Plaid flows, check both the frontend component and the backend route together.

## Suggested Files to Read First

- `frontend/src/main.jsx` — Clerk bootstrap
- `frontend/src/App.jsx` — top-level routing and auth gating
- `frontend/pages/Dashboard.jsx` — main dashboard logic
- `frontend/components/BankConnect.jsx` — Plaid Link flow
- `backend/index.js` — all auth and Plaid routes
- `docker-compose.yml` — app wiring and environment injection

## Current Project Status

The repo is a working dashboard prototype that demonstrates:
- Clerk sign-in
- Plaid bank linking
- transaction sync
- account and month filtering
- chart-based spending summaries

It does not yet include a durable budgeting model, bank persistence outside Clerk metadata, or a mature automated test suite.
