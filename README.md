# SkillSwap — Backend

The backend API for SkillSwap, a peer-to-peer skill exchange platform where users trade what they know for what they want to learn — using credits instead of cash.

**Live API:** https://skillswap-backend-esmv.onrender.com
**Frontend repo:** https://github.com/ShahriarHZ/skillswap_frontend
**Live site:** https://skillswap-frontend-37ph.vercel.app

## Overview

This is an Express + TypeScript + MongoDB REST API that powers authentication, skill listings, bookings, reviews, and two agentic AI features (a chat assistant and a recommendation engine) built with Groq's Llama 3.3 70B model.

## Tech Stack

- **Runtime:** Node.js, Express, TypeScript
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + Passport (Google OAuth 2.0), bcrypt password hashing
- **AI:** Groq API (Llama 3.3 70B Versatile) — function/tool calling for agentic behavior
- **Dev tooling:** ts-node-dev

## Features

- Email/password + Google OAuth authentication, JWT-protected routes, demo login
- Skill listing CRUD (create, search/filter/sort/paginate, view details, delete)
- Booking system with a credits economy (teach → earn credits → spend credits)
- Reviews that recalculate a listing's average rating in real time
- **AI Chat Assistant** — a conversational concierge with memory that reasons about user intent and calls a recommendation tool mid-conversation
- **AI Recommendation Engine** — combines booking history with an LLM ranking/explanation step, exposed both via chat and as a standalone endpoint with filtering

## Project Structure
## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB connection string (e.g. MongoDB Atlas)
- A Groq API key (console.groq.com)
- Google OAuth credentials (Google Cloud Console)

### Installation

```bash
git clone https://github.com/ShahriarHZ/skillswap_backend.git
cd skillswap_backend
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
GROQ_API_KEY=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:3000
```

### Seed the database

Creates a demo account and sample skill listings:

```bash
npm run seed
```

Demo credentials: `demo@skillswap.com` / `demo1234`

### Run locally

```bash
npm run dev
```

Server runs at http://localhost:5000.

### Build for production

```bash
npm run build
npm start
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register with email/password |
| POST | `/api/auth/login` | — | Log in |
| POST | `/api/auth/demo-login` | — | Log in as demo user |
| GET | `/api/auth/google` | — | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | — | Google OAuth callback |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PATCH | `/api/auth/me` | ✅ | Update profile (name, avatar) |
| PATCH | `/api/auth/me/password` | ✅ | Change password |
| GET | `/api/skills` | — | List skills (search/filter/sort/paginate) |
| GET | `/api/skills/:id` | — | Get skill details + related |
| GET | `/api/skills/mine` | ✅ | Get current user's listings |
| POST | `/api/skills` | ✅ | Create a listing |
| DELETE | `/api/skills/:id` | ✅ | Delete own listing |
| POST | `/api/bookings` | ✅ | Book a session |
| GET | `/api/bookings/mine` | ✅ | Bookings as a learner |
| GET | `/api/bookings/teaching` | ✅ | Bookings as a teacher |
| PATCH | `/api/bookings/:id/status` | ✅ | Confirm/complete/cancel a booking |
| POST | `/api/reviews` | ✅ | Leave a review for a completed booking |
| GET | `/api/reviews/skill/:skillId` | — | Get reviews for a listing |
| POST | `/api/ai/chat` | ✅ | Chat with the AI Learning Concierge |
| GET | `/api/ai/chat/history` | ✅ | Get chat history |
| GET | `/api/recommendations` | ✅ | Standalone AI recommendations (filterable) |

## Deployment

Deployed on Render. Build command: `npm install && npm run build`. Start command: `npm start`. All environment variables above are required on the hosting platform.

## License

MIT
