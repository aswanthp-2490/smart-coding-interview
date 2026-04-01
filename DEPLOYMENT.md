# Cloud Deployment Guide 🚀

Because you want this to **open on the network host without running it in your system**, you need to deploy the platform to free Internet cloud hosts.

By following this guide, anyone will be able to access the platform using a public URL (e.g., `https://smart-interview.vercel.app`), without needing your PC to be on.

## Step 1: Push your code to GitHub
First, create a GitHub account (if you don't have one) and upload this folder (`smart-coding-interview`) to a new GitHub repository.

## Step 2: Deploy the Backend (to Render)
Your backend connects everything. We'll deploy it to **Render.com**.
1. Go to [Render](https://render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your repository.
4. Render will automatically detect the `render.yaml` configuration file we just created.
5. Click **Deploy**.
6. **Important:** Render will give you a public URL (e.g., `https://smart-interview-backend.onrender.com`). Copy this URL.

## Step 3: Update the Frontend Environment Variables
Now you must tell your front-ends where the backend is hosted.
* **In React**: Open `frontend-react/.env` (create the file if it doesn't exist) and add:
  `VITE_API_URL=https://smart-interview-backend.onrender.com/api` (Replace with your actual Render URL).
* **In Angular**: Open `frontend-angular/src/environments/environment.ts` and change `apiUrl` to your Render URL:
  `apiUrl: 'https://smart-interview-backend.onrender.com/api'`

*(Note: Commit and push these changes to GitHub before proceeding).*

## Step 4: Deploy the Frontends (to Vercel)
We have added `vercel.json` config files, making Vercel the perfect host.
1. Go to [Vercel](https://vercel.com/) and create a free account.
2. Click **Add New... -> Project**.
3. Connect your GitHub repository.
4. **Deploy React**: Choose `frontend-react` as the Root Directory. Vercel will auto-detect Vite. Click **Deploy**.
5. **Deploy Angular**: Go back and add a new project again. This time, choose `frontend-angular` as the Root Directory. Vercel will auto-detect Angular. Click **Deploy**.

**You are done! 🎉** Both front-ends now run entirely on the cloud, resolving to your cloud backend. Your platform is 100% online!
