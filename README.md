# Resource Booking Deployment Guide

This repository contains a separate backend and frontend application.
To deploy, configure environment variables for each side and then run the appropriate build/start commands.

## Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Set the real values:
   - `PORT` — server port
   - `MONGO_URI` — MongoDB connection string
   - `JWT_SECRET` — JSON Web Token secret
   - `FRONTEND_URL` — deployed frontend URL (for CORS)
   - `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `SENDGRID_DATA_RESIDENCY` — SendGrid email config
   - `MAX_ACTIVE_BOOKINGS_PER_USER` — optional limit for bookings

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

## Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Set the backend API and socket URLs:
   - `VITE_API_URL=https://your-backend-domain.com/api`
   - `VITE_SOCKET_BASE_URL=https://your-backend-domain.com`

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build locally:
   ```bash
   npm run preview
   ```

## Deployment Notes

- `FRONTEND_URL` should match the exact deployed frontend origin, for example `https://app.example.com`.
- `VITE_API_URL` should point to the backend API base URL, for example `https://api.example.com/api`.
- If you host frontend and backend separately, set the correct URLs in each `.env` file.
- If using a hosting service that injects environment variables, map the same names shown above.

## Quick checklist

- [ ] `backend/.env` configured
- [ ] `frontend/.env` configured
- [ ] Backend deployed and reachable at the configured URL
- [ ] Frontend built and deployed with `VITE_API_URL` pointing to backend