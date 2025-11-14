# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- EduHive is a mobile-first eLearning app. Planned stack per README: React Native (Expo) frontend, Node.js + MongoDB backend, JWT auth, with student/instructor roles.
- Current repo status: assets and README are present; `app/` (Expo) and `server/` (Node.js API) are to be scaffolded.

Repository layout (target)
- app/ — React Native (Expo) app
- server/ — Node.js API using MongoDB and JWT
- assets/ — images and shared static assets

Setup and common commands
1) Scaffold the mobile app (Expo)
- Create the project:
  - npx create-expo-app@latest app
- Start the dev server (Metro) from app/ and open on Android (Expo Go):
  - cd app
  - npx expo start
  - Press “a” for Android (or scan the QR with Expo Go)
- Android build via EAS (cloud build):
  - npm i -g eas-cli   # or use: npx eas-cli@latest
  - eas login          # once
  - eas build -p android --profile preview

2) Scaffold the backend (Node.js + MongoDB)
- Initialize and install core dependencies:
  - mkdir server && cd server
  - npm init -y
  - npm i express mongoose jsonwebtoken bcrypt cors dotenv
  - npm i -D nodemon
- Add scripts (package.json):
  ```json path=null start=null
  {
    "scripts": {
      "dev": "nodemon src/index.js",
      "start": "node src/index.js"
    }
  }
  ```
- Run the API in watch mode:
  - npm run dev
- Environment variables expected (create server/.env):
  - MONGODB_URI=
  - JWT_SECRET=

Testing, linting, and type-checking
- Mobile (per README): Manual testing via Expo Go during development.
- Backend tests (Docker Mongo):
  - docker compose up -d   # starts MongoDB locally
  - cd server && npm test  # runs Jest tests against Docker Mongo
- Lint/format (server):
  - cd server && npm run lint
  - cd server && npm run format

Build and release
- Mobile app: use EAS for Android builds (see commands above). For Play Store distribution, follow EAS submit after a successful build:
  - eas submit -p android --latest
- Backend: production start (after you add your server code):
  - npm start

High-level architecture (big picture)
- Client (app/): React Native with Expo manages navigation, authentication (JWT-based), courses, quizzes, and progress tracking. Network calls via Fetch/Axios to the server; tokens stored in a secure storage solution.
- Server (server/): Express REST API handling auth (login/register issuing JWT), course/content endpoints, progress tracking, and support/ticket flows. MongoDB collections likely include Users (role: student/instructor), Courses, Lessons/Quizzes, Progress, and Tickets. Middleware handles auth (JWT verification) and CORS.
- Data flow: The app authenticates to receive a JWT; subsequent API requests include the token. The API reads/writes to MongoDB and returns JSON responses consumed by the app UI.

Notes sourced from README.md
- Next steps: scaffold `app/` and `server/`, configure MongoDB + JWT auth, add CI, linting, type-checking, and testing.
- Technologies: React Native, Expo, React Navigation; Node.js, MongoDB; JWT/bcrypt; Axios/Fetch; EAS for builds.

Added endpoints and ops
- Seed data (dev only):
  - curl -X POST http://localhost:4000/api/dev/seed
- List courses:
  - curl http://localhost:4000/api/courses
- Access check:
  - curl -H "Authorization: Bearer <token>" http://localhost:4000/api/courses/<id>/access
- Lectures (ordered):
  - curl -H "Authorization: Bearer <token>" http://localhost:4000/api/courses/<id>/lectures

Frontend navigation
- After login, Courses screen is shown. Selecting a course opens Course Detail where lectures are listed and play via the in-app WebView.

YouTube import
- Obtain a YouTube Data API v3 key and set YOUTUBE_API_KEY in server/.env (see server/.env.example).
- Import via API (dev-only):
  - curl -X POST http://localhost:4000/api/dev/import-playlists \
    -H "Content-Type: application/json" \
    -d '{
      "playlistIds": [
        "PLbRMhDVUMngcx5xHChJ-f7ofxZI4JzuQR",
        "PLyqSpQzTE6M_Fu6l8irVwXkUyC9Gwqr6_",
        "PLJ5C_6qdAvBFfF7qtFi8Pv_RK8x55jsUQ",
        "PLbRMhDVUMngeVrxtbBz-n8HvP8KAWBpI5",
        "PLyqSpQzTE6M-jkJEzbS5oHJUp2GWPsq6e"
      ]
    }'
- Or via script (from server/):
  - YOUTUBE_API_KEY=... node scripts/importPlaylists.js \
    PLbRMhDVUMngcx5xHChJ-f7ofxZI4JzuQR \
    PLyqSpQzTE6M_Fu6l8irVwXkUyC9Gwqr6_ \
    PLJ5C_6qdAvBFfF7qtFi8Pv_RK8x55jsUQ \
    PLbRMhDVUMngeVrxtbBz-n8HvP8KAWBpI5 \
    PLyqSpQzTE6M-jkJEzbS5oHJUp2GWPsq6e

Polished UI + Demo Data
- Flags (app): set EXPO_PUBLIC_DEV_SELF_UNLOCK=true (enables in-app Unlock for demo); set EXPO_PUBLIC_YT_IMPORT=true to show Import Playlists button in empty state.
- Seed/import from app (Courses empty state):
  - Seed demo: POST /api/dev/seed
  - Import playlists: POST /api/dev/import-playlists (requires YOUTUBE_API_KEY in server/.env)
- USB dev quick start (ADB):
  - adb reverse tcp:8081 tcp:8081   # Metro bundler
  - adb reverse tcp:4000 tcp:4000   # Backend API
