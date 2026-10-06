# BudgetBuddy Dashboard

This is a Vite + React budget dashboard with an Express backend, using Clerk for authentication and Plaid for bank connections.

## Prerequisites
* Docker and Docker Compose installed on your machine.
* API keys from [Clerk](https://clerk.com) and [Plaid](https://plaid.com).

## Quick Start

1. **Configure Environment Variables:**
   Copy the template file to create your local `.env`:
   
       cp .env.example .env
   
   Open `.env` and fill in your Clerk and Plaid keys.

2. **Build and Start the Application:**
   Run the following command from the repository root:
   
       docker compose up -d --build

3. **Access the Application:**
   * The frontend dashboard is exposed at `http://localhost:8080` and served by Nginx.
   * The backend API is exposed at `http://localhost:3000`.