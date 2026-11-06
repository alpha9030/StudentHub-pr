# 🎓 Student Hub — Academic Workspace & Learning Platform

[![Live Application](https://img.shields.io/badge/Live%20Site-studenthub--pr.onrender.com-6366f1?style=for-the-badge&logo=render)](https://studenthub-pr.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?style=for-the-badge&logo=flask)](https://palletsprojects.com/p/flask/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**Student Hub** is an all-in-one scholastic workspace and learning portal designed for computer science and engineering students. It consolidates syllabus tracking across core curriculum subjects, a personal student dashboard, user account management, and a rich interactive digital notebook (**Pravio Notes**) with drawing canvas, flowcharts, flashcards, and document import.

---

## 🌟 Key Features

### 📊 Scholastic Dashboard & Progress Tracking
- **Curriculum Tracker**: Interactive syllabus checklists across 13 core CS disciplines with live progress meters.
- **Attendance & Grade Monitoring**: Target GPA calculator, subject attendance logs, and goal milestone tracking.
- **Study Utilities**: Built-in Pomodoro study timer, interactive calendar, task manager, and daily study streak calculations.
- **Data Persistence**: Offline-ready local state synced with backend database storage.

### 📝 Pravio Notes — Digital Academic Notebook
- **Multi-Layout Workspace**:
  - **Classic Notebook**: Minimalist ruled notebook paper with clean typography.
  - **Handwritten / Ruled Paper**: Authentic ink style with customizable margins.
  - **Cornell Notes Layout**: Structured cue column, notes area, and summary section for lecture retention.
  - **Engineering Grid**: Math and grid paper styling.
  - **Sticky Notes**: Fast idea capture and concept scratchpad.
- **Organization & Search**:
  - Hierarchical folder tree organization.
  - Instant full-text search across titles, algorithms, and body text.
  - Tag cloud, pinned notes, and favorites.
- **Interactive Tools**:
  - **Sketchpad & Drawing Canvas**: Freehand sketching, digital ink, shapes, colors, and whiteboard exports.
  - **Flowchart & Mind Map Generator**: Visual node-and-edge concept mapping for system design and algorithms.
  - **Spaced Repetition Study Hub**: Auto-generating flashcard practice decks and quick formula cheat-sheets.
  - **Smart Document Import**: Accepts PDF, DOCX, TXT, MD, PNG, and JPG files to generate structured study notes.
  - **Export Engine**: Export documents directly to TXT, JSON, or styled PDF.

### 📚 13 Dedicated Course Study Modules
Each course module includes curated roadmaps, syllabus breakdowns, author references, documentation, and video resources:
- **Programming Languages**: [Python](Python.html), [Java](Java.html), [C](C.html), [JavaScript](JavaScript.html)
- **Web & Frameworks**: [HTML5](HTML.html), [CSS3](CSS.html), [ReactJS](ReactJS.html)
- **Core Computer Science**: [Data Structures & Algorithms (DSA)](DSA.html), [Database Management Systems (DBMS)](DBMS.html), [Operating Systems (OS)](OS.html), [Computer Networks (CN)](CN.html)
- **Databases**: [SQL](SQL.html), [PostgreSQL](PostgreSQL.html)
- **References**: Comprehensive [Reference Directory](reference.html) with textbook and platform guides.

### 🔐 Authentication & Session Security
- **Enrollment Terminal**: Student registration, password encryption, secure session handling, and profile updates.
- **SQLite Database**: Centralized `students.db` storing credentials, progress data, and login audit trails.
- **Access Control**: Protected scholastic modules (References, Pravio Notes, and Dashboard) safeguarded by client and server-side authentication gates.
- **Admin Management**: Dedicated administrative console ([admin.html](admin.html)) for viewing user fleets and audit metrics.

### 🌓 Adaptive Dual-Theme Engine
- Seamless **Light Mode** and **Dark Mode** toggle.
- High-contrast color palettes ensuring accessibility across all interactive components, buttons, and canvas tools.
- Preserved theme preference across sessions via `localStorage`.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.10+, Flask 3.x, Gunicorn, SQLite3, Werkzeug |
| **Frontend** | Vanilla HTML5 (Single Page Architecture), Modern CSS3 (Variables, Flexbox, Grid), Vanilla ES6+ JavaScript |
| **Icons & UI** | Lucide Icons, FontAwesome 6, Google Fonts (Outfit, JetBrains Mono, Caveat) |
| **Client Libraries** | Monaco Editor, Canvas Confetti, PptxGenJS |
| **Deployment** | Render Cloud Web Service, WSGI HTTP Server |

---

## 📁 Repository Structure

```
StudentHub-pr/
├── app.py                      # Core Flask backend server & static file handler
├── students.db                 # SQLite database for accounts and progress records
├── requirements.txt            # Python package dependencies
├── start_backend.bat           # Windows batch script to launch the local backend
├── start_sync.bat              # Background student logins synchronization script
│
├── index.html                  # Main application SPA (Landing, Auth, Dashboard, Notes)
├── account.html                # Dedicated user account & profile interface
├── admin.html                  # Administrative management dashboard
├── signup.html                 # Direct enrollment / registration terminal
├── reference.html              # Reference materials & documentation directory
├── privacy.html                # Privacy policy and terms of service
│
├── style.css                   # Main application design system & scoped notes theme
├── syntax-highlight.css        # Syntax highlighting stylesheet for code blocks
├── tracker.js                  # Global theme, font, and progress tracking controller
├── dashboard_extras.js         # Extra dashboard utilities and analytics
│
├── js/                         # Modular JavaScript application code
│   ├── main.js                 # Central coordinator for Pravio Notes
│   ├── database.js             # Client-side datastore & schema defaults
│   └── components/             # Reusable interactive components
│       ├── editor.js           # Rich-text notebook editor and revision view
│       ├── canvas.js           # Drawing canvas and digital sketchpad
│       ├── flowchart.js        # Diagram & concept flowboard builder
│       ├── study-hub.js        # Flashcards, quizzes, and revision practice
│       ├── dashboard.js        # Notes workspace mini-dashboard
│       └── ai-assistant.js     # Notes sidebar helper utilities
│
└── [Course Pages]              # 13 subject study guides:
    ├── Python.html, Java.html, C.html, JavaScript.html, ReactJS.html
    ├── HTML.html, CSS.html, SQL.html, PostgreSQL.html
    └── DSA.html, DBMS.html, OS.html, CN.html
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10** or higher installed on your system
- **pip** (Python package installer)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 1. Clone the Repository
```bash
git clone https://github.com/alpha9030/StudentHub-pr.git
cd StudentHub-pr
```

### 2. Set Up a Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application

#### Option A: Using the Launch Script (Windows)
Double-click `start_backend.bat` or run:
```cmd
start_backend.bat
```

#### Option B: Using Python CLI
```bash
python app.py
```

The server will initialize the SQLite database (`students.db`) automatically and start listening for requests. Open your browser and navigate to:
```
http://localhost:5000/
```
*(or the port specified in your environment variables)*

---

## ⚙️ Environment Variables (Optional)

You can configure optional environment settings in a `.env` file at the root of the project:

```env
# Server Port (defaults to 443 / 5000 if unspecified)
PORT=5000

# Optional Supabase Integration (for cloud DB sync)
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_or_service_key
```

---

## ☁️ Deployment (Render)

This repository is configured for one-click deployment on [Render](https://render.com/):

- **Environment**: Python
- **Build Command**:
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  gunicorn -w 4 -b 0.0.0.0:$PORT app:app
  ```

---

## 🔒 Security & Data Integrity
- Passwords stored in `students.db` utilize secure cryptographic hashing.
- Path traversal and sensitive file access (e.g., `.db`, `.env`, `.json`, `.sql`) through static routes are strictly blocked by server-side middleware.
- Client-side navigation guards enforce enrollment checks before granting access to internal reference assets and student workspaces.

---

## 📄 License
This project is licensed under the MIT License — feel free to customize and expand for academic or institutional purposes.
