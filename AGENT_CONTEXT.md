# Budget App Codebase Context

## Purpose

BudgetBuddy is a Vite + React budget dashboard with Clerk authentication and Plaid bank connections. The current implementation connects a bank for the active server session, fetches Plaid transactions, and visualizes spending by month and category. It does not yet persist budget data or bank connections.

## Repository Layout

```text
Budget/
|- docker-compose.yml          # Runs the frontend and backend containers
|- AGENT_CONTEXT.md
|- frontend/
|  |- Dockerfile               # Builds Vite output and serves it with Nginx
|  |- package.json             # React, Clerk, Plaid Link, Recharts, Vite, Oxlint
|  |- vite.config.js
|  |- index.html
|  |- components/
|  |  |- BankConnect.jsx       # Creates a Plaid Link flow and exchanges its token
|  |  |- MonthlyBarChart.jsx    # Monthly transaction visualization
|  |  `- SpendingPieChart.jsx   # Category spending visualization
|  |- pages/
|  |  `- Dashboard.jsx         # User greeting, connection state, filters, and charts
|  `- src/
|     |- App.jsx               # Router, header, Clerk sign-in, and dashboard route
|     |- App.css               # Application styles
|     |- index.css             # Global styles and CSS variables
|     |- main.jsx              # React bootstrap and ClerkProvider
|     `- assets/
`- backend/
   |- Dockerfile
   |- package.json
   `- index.js                 # Express, Clerk middleware, and Plaid API routes
```

## Current Architecture

### Frontend

- Framework: React 19 with Vite.
- Entry point: `frontend/src/main.jsx`.
- `main.jsx` reads `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`, throws if it is missing, and wraps the app in Clerk's `ClerkProvider`.
- `frontend/src/App.jsx` uses React Router. The `/` route renders `Dashboard` only inside Clerk's `SignedIn` component. Signed-out users see the header's modal sign-in button; signed-in users see `UserButton`.
- `frontend/pages/Dashboard.jsx` gets the Clerk user and session token, loads transactions after a bank connection, selects the newest available month, and renders the monthly bar and category pie charts.
- `frontend/components/BankConnect.jsx` requests a Plaid Link token, opens Plaid Link, exchanges the returned public token, and asks the dashboard to reload transactions.
- API calls use relative `/api/...` paths and send `Authorization: Bearer <Clerk session token>`.
- `frontend/vite.config.js` has no development API proxy. Relative API calls work through the Nginx proxy in the production Docker image, but local Vite development needs a proxy configuration or a separately handled API origin.

### Backend

- Framework: Express 5 with `@clerk/express` and Plaid's Node client.
- Entry point: `backend/index.js`.
- The server listens on port `3000` and installs `express.json()` and `clerkMiddleware()` globally.
- Each Plaid route calls `getAuth(req)` and returns `401` when no Clerk `userId` is present.
- `POST /api/plaid/create_link_token` creates a Plaid Link token for the authenticated Clerk user.
- `POST /api/plaid/exchange_public_token` exchanges Plaid's public token and stores the resulting access token in `req.app.locals.accessToken`.
- `GET /api/plaid/transactions` calls Plaid `transactionsSync` with that in-memory access token and returns the `added` transactions.
- There is no database, durable user-to-bank mapping, request validation, CORS configuration, centralized error handler, or automated test suite.

## Authentication and Plaid Configuration

Required variables:

| Variable | Used by | Purpose | Timing |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend and Compose | Clerk publishable key exposed to the browser | Frontend build time |
| `CLERK_SECRET_KEY` | Backend | Clerk server-side token verification | Backend runtime |
| `PLAID_CLIENT_ID` | Backend | Plaid client identifier | Backend runtime |
| `PLAID_SECRET` | Backend | Plaid secret | Backend runtime |
| `PLAID_ENV` | Backend | Plaid environment; Compose sets `sandbox` | Backend runtime |

Do not commit real secrets or copy secret values into documentation. The Clerk publishable key is intentionally exposed in the browser build; Clerk and Plaid secret keys must remain private.

## Local Development

Install dependencies separately:

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd backend
npm install
npm start
```

The Vite development server normally runs on port `5173`; the API runs on `http://localhost:3000`. Because Vite has no `/api` proxy configured, authenticated dashboard API calls from the Vite server will need a local proxy configuration or an equivalent development setup.

Frontend scripts:

- `npm run dev` starts Vite.
- `npm run build` creates a production build in `frontend/dist`.
- `npm run lint` runs Oxlint.
- `npm run preview` serves the built frontend locally.

Backend scripts:

- `npm start` starts `node index.js`.
- `npm test` is a placeholder; no backend tests are configured.

## Docker Deployment

From the repository root:

```powershell
docker compose up -d --build
docker compose ps
```

- Frontend is exposed at `http://localhost:8080` and served by Nginx.
- Backend is exposed at `http://localhost:3000`.
- Compose reads the required variables from the shell environment or a root `.env` file.
- `VITE_CLERK_PUBLISHABLE_KEY` is passed as a frontend build argument, so changing it requires rebuilding the frontend image.
- The Nginx configuration generated in `frontend/Dockerfile` serves the SPA and proxies `/api/` to `http://backend:3000/api/`.
- The proxy target depends on the Compose service name `backend`.

## Important Current Limitations

1. Bank access tokens are stored globally in backend process memory, not per user or in durable storage.
2. Restarting the backend loses the active bank connection.
3. The dashboard only displays Plaid transactions returned in the initial `added` sync response; it does not handle pagination, cursors, modified transactions, or removed transactions.
4. There is no budget model, budget CRUD workflow, database, account management, balances view, or user-specific persistence.
5. There are no automated tests. At minimum, run `npm run lint` and `npm run build` from `frontend` after frontend changes.
6. Local Vite development does not proxy `/api` requests; Docker/Nginx is the currently configured frontend-to-backend path.
7. The backend Dockerfile uses a development environment and the default container user; review both before production deployment.

## Recommended Agent Workflow

1. Read the relevant existing component, page, or API route before editing and preserve the current React, Clerk, Plaid, and Express conventions.
2. For protected API calls, obtain a Clerk session token with `getToken()` and send it as `Authorization: Bearer <token>`.
3. Keep secret values out of source control. Document variable names and safe placeholders only.
4. Define the data contract and user ownership model before adding persistence or additional budget features.
5. Run `npm run lint` and `npm run build` from `frontend` after frontend changes. Rebuild Docker when validating the Clerk build argument or Nginx proxy.

## Useful Files to Read First

- Frontend bootstrap and Clerk setup: `frontend/src/main.jsx`
- Router and authentication UI: `frontend/src/App.jsx`
- Dashboard state and chart data flow: `frontend/pages/Dashboard.jsx`
- Plaid Link flow: `frontend/components/BankConnect.jsx`
- Backend auth and Plaid routes: `backend/index.js`
- Container wiring and environment propagation: `docker-compose.yml`
- Frontend production build and Nginx API proxy: `frontend/Dockerfile`
