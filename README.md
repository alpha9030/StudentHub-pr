# Student Hub (Academic Workspace)

An interactive dashboard to track your curriculum, checklists, and chat with Aura, an AI tutor.

## Local Setup
1. Double-click start_backend.bat to launch the server.
2. Open your browser and navigate to the printed URL (default: https://studenhub.pr or http://127.0.0.1:5000).

## Deployment on Render
To deploy this project to the cloud for free using Render:
1. Create a free account on [Render.com](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub account and select this repository: website1-student-hub.
4. Set the following configuration:
   - **Runtime**: Python`n   - **Build Command**: pip install -r requirements.txt`n   - **Start Command**: gunicorn app:app`n5. Render will deploy the site and provide a public https://... URL!

> **Note on Databases**: SQLite uses local files. On Render's free tier, the database resets when the service restarts. For persistent data, use Render's Persistent Disks or migrate to a PostgreSQL database.
