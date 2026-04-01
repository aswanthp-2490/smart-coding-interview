# Smart Coding Interview Platform

This is a fullstack beginner-friendly Smart Coding Interview Platform that meets all the requirements:
- **Backend:** Node.js with Express, using a local JSON structure for easy setup.
- **Frontend (Candidate UI):** Built with React. Features include Login/Signup, browsing coding questions, and a Code Editor with a timer and simulated terminal output.
- **Frontend (Admin UI):** Built with Angular. Features a Leaderboard displaying user rankings and scores based on their submissions.

## Project Structure
```text
smart-coding-interview/
├── backend/                   # Node.js + Express Server
│   ├── data/                  # Simple JSON JSON Database
│   │   ├── users.json
│   │   ├── questions.json
│   │   └── submissions.json
│   ├── server.js              # REST API Endpoints
│   └── package.json
│
├── frontend-react/            # Candidate Code Editor Interface (React)
│   ├── src/
│   │   ├── components/        # Auth.jsx, Questions.jsx, Editor.jsx
│   │   ├── App.jsx            # Main app router
│   │   └── index.css          # Modern Styling
│   └── package.json
│
└── frontend-angular/          # Admin Leaderboard Interface (Angular)
    ├── src/
    │   └── app/               # Leaderboard component (app.ts)
    └── package.json
```

---

## Step-by-Step Explanation & Running the App

You will need three separate terminal windows to run all parts of the application concurrently.

### 1. Start the Node.js Backend
The backend handles authentication, saving code submissions, and providing questions data.
1. Open up a terminal.
2. Navigate to the backend directory:
   ```bash
   cd d:\fst_project\smart-coding-interview\backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The server will run on http://localhost:3000.*

### 2. Start the React Frontend (Candidate)
The React app provides the UI for the coding candidate to login, select a challenge, write code, and submit it within a specific time limit.
1. Open a second terminal window.
2. Navigate to the React directory:
   ```bash
   cd d:\fst_project\smart-coding-interview\frontend-react
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The React app will typically open on http://localhost:5173.*
4. **How to use:** 
   - Sign up for a new account.
   - Choose an available Coding Challenge.
   - Write your code in the dark-themed editor.
   - Click "Submit Code".
   - Using `'console.log'` dummy simulation, your code will pass and grant you `10` score points!

### 3. Start the Angular Frontend (Admin / Leaderboard)
The Angular app provides a dashboard to view candidate rankings and their total scores from passed test cases.
1. Open a third terminal window.
2. Navigate to the Angular directory:
   ```bash
   cd d:\fst_project\smart-coding-interview\frontend-angular
   ```
3. Install the dependencies (if you haven't yet, since we used `--skip-install` during generation):
   ```bash
   npm install
   ```
4. Start the Angular development server:
   ```bash
   npm run start
   ```
   *The Angular app will run on http://localhost:4200.*
5. **How to use:**
   - Go to http://localhost:4200.
   - You will see the Leaderboard automatically populated with the users that have signed up, sorted by score.
