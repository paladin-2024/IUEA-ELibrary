# IUEA Library — Monorepo

International University of East Africa — Digital Library Platform

## Structure

```
iuea-library/
├── mobile/     Flutter app (Android + iOS)
├── web/        React + Vite web app
├── server/     Shared Express + MongoDB backend
└── shared/     JSON constants used by all clients
```

## Quick Start

### 1. Install all dependencies
```bash
npm install && cd mobile && flutter pub get && cd ..
```

### 2. Fill in environment variables
```bash
# server/.env  — add MONGO_URI, JWT_SECRET, GEMINI_API_KEY, etc.
# web/.env     — add VITE_GOOGLE_CLIENT_ID
# mobile/.env  — add GOOGLE_CLIENT_ID, FIREBASE_PROJECT_ID
```

### 3. Run everything
```bash
# Server + Web together
npm run dev

# Flutter (separate terminal)
cd mobile && flutter run
```

## Apps

| App     | Tech                        | Port / Target    |
|---------|-----------------------------|-----------------|
| server  | Node.js + Express + MongoDB | :5000            |
| web     | React 18 + Vite + Tailwind  | :5173            |
| mobile  | Flutter 3                   | Android / iOS    |

## API

Both mobile and web clients hit the **same backend**:
```
http://localhost:5000/api
```

Android emulator uses `http://10.0.2.2:5000/api` (mapped to host localhost).

## Key Features

- **Book Library** — Sync from Koha ILS + Internet Archive + manual upload
- **EPUB/PDF Reader** — Progress tracking, bookmarks, highlights
- **Text-to-Speech** — Google Cloud TTS with audio caching on Cloudflare R2
- **AI Chat** — Gemini-powered book assistant in 8 languages
- **Translation** — MyMemory API for multilingual support
- **Podcasts** — Subscribe, stream episodes
- **Push Notifications** — Firebase Cloud Messaging
- **Admin Panel** — User management, book sync, stats

## Tech Stack

### Backend
- Express.js, Mongoose, MongoDB
- JWT auth + Google OAuth
- Gemini AI (chat + TTS)
- Cloudflare R2 (file storage)
- Firebase Admin (push notifications)
- MyMemory API (translation)
- Koha ILS integration

### Web
- React 18 + Vite
- Tailwind CSS v4
- Zustand (state)
- TanStack Query v5
- React Router v6

### Mobile
- Flutter 3
- Provider (state)
- go_router (navigation)
- Dio (HTTP)
- just_audio (playback)
- flutter_epub_viewer (EPUB)
- Firebase Messaging

## Environment Variables

See `.env` files in `server/`, `web/`, and `mobile/` for all required keys.
