@echo off
docker compose up -d
adb reverse tcp:4000 tcp:4000
cd server && npm run dev
