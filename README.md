# Resource Booking Deployment Guide

This repository contains separate backend and frontend applications.

## Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Set the real values:
   - `PORT` - server port
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - JSON Web Token secret
   - `FRONTEND_URL` - deployed frontend URL
   - `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `SENDGRID_DATA_RESIDENCY` - SendGrid email config
   - `MAX_ACTIVE_BOOKINGS_PER_USER` - optional booking limit
   - `GEMINI_API_KEY` or `GOOGLE_API_KEY` - Google Gemini API key for AI booking requests
   - `GEMINI_MODEL` - optional Gemini model override, defaults to `gemini-2.0-flash`
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
2. Set the frontend variables:
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

## AI Booking Flow

- Admins can store resource features such as `projector`, `whiteboard`, and `ac`.
- Users can enter a natural-language request from the booking page.
- The backend sends the message to Gemini, extracts booking details, checks live availability, and returns one best match.
- The booking is only created after the user confirms the suggested resource.

## Deployment Notes

- `FRONTEND_URL` should match the exact deployed frontend origin, for example `https://app.example.com`.
- `VITE_API_URL` should point to the backend API base URL, for example `https://api.example.com/api`.
- If you host frontend and backend separately, set the correct URLs in each `.env` file.

## Quick Checklist

- [ ] `backend/.env` configured
- [ ] `frontend/.env` configured
- [ ] Backend deployed and reachable at the configured URL
- [ ] Frontend built and deployed with `VITE_API_URL` pointing to backend
