@echo off
echo Starting Smart Coding Interview Environment...

echo Starting Backend API on port 8080...
start "Backend API" cmd /k "cd backend && npm start"

echo Starting Angular Frontend on port 4200...
start "Angular Frontend" cmd /k "cd frontend-angular && npm start"

echo Both servers are starting up!
