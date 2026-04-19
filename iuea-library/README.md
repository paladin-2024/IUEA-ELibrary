# IUEA Library — Monorepo

International University of East Africa — Digital Library Platform

## Apps in this repo

| App     | Path      | Technology                             |
|---------|-----------|----------------------------------------|
| Mobile  | mobile/   | Flutter                                |
| Web     | web/      | React + Vite + Tailwind CSS            |
| Backend | server/   | Node.js + Express + Neon PostgreSQL    |

## Both clients hit the SAME backend API at:
```
http://localhost:5000/api
```
Android emulator uses `http://10.0.2.2:5000/api` (mapped to host localhost).

## Quick start

```bash
npm run install:all      # install all JS deps + flutter pub get
cp server/.env.example server/.env
# fill in your .env values
npm run dev              # starts server + web together
npm run dev:mobile       # starts Flutter app (separate terminal)
```

## Available scripts

| Command               | What it does                      |
|-----------------------|-----------------------------------|
| `npm run dev`         | Server + web in parallel          |
| `npm run dev:server`  | Express API only (nodemon)        |
| `npm run dev:web`     | Vite dev server only              |
| `npm run dev:mobile`  | `flutter run`                     |
| `npm run build:web`   | Production Vite build             |
| `npm run lint:web`    | ESLint on web/src                 |
| `npm run test:server` | Server test suite                 |
| `npm run install:all` | npm install + flutter pub get     |

## Structure

```
iuea-library/
├── mobile/     Flutter app (Android + iOS)
├── web/        React + Vite web app
├── server/     Shared Express + MongoDB backend
└── shared/     JSON constants used by all clients
```

## Environment variables

Copy `server/.env.example` → `server/.env` and fill in:

```
DATABASE_URI=
JWT_SECRET=
PORT=5000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Koha ILS
KOHA_BASE_URL=
KOHA_API_USER=
KOHA_API_PASS=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=
R2_PUBLIC_URL=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# URLs
CLIENT_WEB_URL=http://localhost:5173
WEB_URL=http://localhost:5173
NODE_ENV=development
```

Web (`web/.env.local`):

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
```

## Architecture

```
Flutter  →  HTTP  →  Express API  →  Neon PostgreSQL (Prisma)
React    →  HTTP  →  Express API  →  Neon PostgreSQL (Prisma)

Both clients share identical endpoints.
Reading progress syncs across devices via the same API.
```

## Key Features

- **Book Library** — Sync from Koha ILS + Internet Archive + manual upload
- **EPUB/PDF Reader** — Progress tracking, bookmarks, highlights
- **Text-to-Speech** — Google Cloud TTS with Cloudflare R2 caching
- **AI Chat** — Gemini-powered book assistant in 8 languages
- **Translation** — MyMemory API for multilingual support
- **Podcasts** — Subscribe, stream episodes
- **Push Notifications** — Firebase Cloud Messaging (web + mobile)
- **Admin Panel** — User management, book sync, analytics

## Free APIs used

| Service           | Purpose               | Notes                   |
|-------------------|-----------------------|-------------------------|
| Koha ILS          | Book catalogue        | Free, open source       |
| Gemini 1.5 Flash  | AI chatbot            | Free tier               |
| MyMemory API      | Translation           | Free, no key required   |
| Web Speech API    | TTS on web            | Browser built-in        |
| flutter_tts       | TTS on mobile         | Device built-in         |
| Open Library API  | Book covers           | Free                    |
| Internet Archive  | Free ebook content    | Free                    |
| Gutendex          | Project Gutenberg     | Free                    |
| Google OAuth 2.0  | Sign in               | Free                    |
| Firebase FCM      | Push notifications    | Free Spark plan         |
| Cloudflare R2     | File storage          | 10 GB free              |
| Gmail SMTP        | Email                 | Free                    |
| Neon PostgreSQL   | Database              | Free tier (0.5 GB)      |
| Vercel            | Web hosting           | Free hobby plan         |
| Railway           | Backend hosting       | Free tier               |

## Tech Stack

### Backend
- Express.js + Neon PostgreSQL + Prisma ORM
- JWT auth + Google OAuth
- Gemini AI (chat)
- Cloudflare R2 (file storage)
- Firebase Admin (push notifications)
- Nodemailer / Gmail SMTP (email)
- Koha ILS integration
- node-cron (scheduled jobs)

### Web
- React 18 + Vite
- Tailwind CSS v4
- Zustand (state)
- TanStack Query v5
- React Router v6
- recharts (admin analytics)

### Mobile
- Flutter 3
- Provider (state)
- go_router (navigation)
- Dio (HTTP)
- just_audio (audio playback)
- flutter_epub_viewer (EPUB reading)
- Firebase Messaging (push)
