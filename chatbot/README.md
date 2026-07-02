# 🌌 Lumina Chat — Sleek & Secure Gemini Chatbot Web Application

Lumina Chat is a modern, production-ready AI chatbot web application built using a Node.js/Express backend and a responsive, high-fidelity glassmorphic HTML5/CSS3 frontend. Powered by the **Google Gemini 1.5 Flash** model, it delivers real-time streaming conversations, persistent multi-chat archives, advanced markdown rendering, and syntax-highlighted code blocks, completely packaged with security proxies, rate limiting, health checks, and multiple format exports (TXT, JSON, PDF).

---

## 🚀 Features

### 🌟 Frontend UX & Design
- **Sleek Landing Page**: Interactive floating orbs, smooth gradient typography, features showcase, and an animated workspace mockup.
- **Glassmorphic Theme Switch**: Dark/Light mode toggle with clean CSS transitions.
- **Side-by-side Layout**: Modern chat workspace with collapsible/mobile-responsive history sidebar.
- **Dynamic Suggested Prompts**: Clicking templates auto-submits prompts to spark ideas.
- **Typing Indicator**: Fluent pulsing micro-animation while AI is streaming.
- **Context Preservation**: Save/sync conversations locally using browser LocalStorage.
- **Keyboard Shortcuts**: Send messages with `Enter` and insert linebreaks with `Shift + Enter`.
- **Auto-scroll & Cleanup**: Instant scroll to latest response, inline message deletions, and full history clearing.

### 🛡️ Backend & API Security
- **API Key Masking**: Secure Node.js Express proxy prevents raw `GEMINI_API_KEY` leakage on the frontend client.
- **SSE Stream Proxying**: Proxies Google Gemini API's text streams directly to client browser with chunk-by-chunk delivery.
- **Input Validation & Sanitization**: Protects against malformed inputs and script injections.
- **Transient Error Recovery**: Implements automatic exponential backoff retry algorithms for Gemini network drops or 503 errors.
- **IP Rate Limiting**: Built-in rate limiter capping requests at 60/min per IP to prevent spam.
- **Health Check Endpoint**: `/health` path monitoring server uptime, environment variables, and overall connectivity.

### 📄 Advanced Rich Media Formatting
- **Custom Markdown Compiler**: Built-in regex compiler supporting headers, bold, italics, quotes, lists, tables, and inline code.
- **Code Block Wrapper**: Custom code container with languages tags, visual spacing, syntax highlighting (JavaScript, Python, HTML, CSS, JSON), and copy buttons.
- **Exports Engine**: Export active transcripts directly as formatted plain Text (`.txt`), local backups (`.json`), or styled PDF documents (`.pdf`).

---

## 📁 Project Structure

```
project2/
├── .env                  # Actively loaded server environment config
├── .env.example          # Template for environment configuration
├── package.json          # Node dependencies and project scripts
├── server.js             # Express application main entry point
└── public/               # Static frontend client resources
    ├── index.html        # Single Page App layout (Landing & Chat workspace)
    ├── css/
    │   ├── styles.css            # Custom CSS variables, glassmorphism, responsive styles
    │   └── syntax-highlight.css  # CSS formatting for code block highlighting
    └── js/
        └── app.js        # Chat controllers, LocalStorage syncer, Markdown parser, SSE Stream reader
```

---

## ⚙️ Installation & Launch

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.x or above recommended).

### 1. Install Dependencies
Run the following command in the project directory:
```bash
npm install
```

### 2. Configure Environment Variables
Open the `.env` file and replace the API key placeholder with your actual Gemini API key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=AIzaSy...
```

### 3. Run the Application
Start the server in production mode:
```bash
npm start
```

Or run in development mode with automatic hot-reloads (requires `nodemon` installed):
```bash
npm run dev
```

The application will start, and the console will print:
```
==================================================
 Gemini Chat Assistant Server is running!
 Environment: production
 Port:        http://localhost:3000
 Health Check: http://localhost:3000/health
==================================================
```

---

## 🔬 Production Validation Checklist

- [x] **Secure API Routing**: Frontend never queries Gemini directly; all requests traverse the Express server.
- [x] **Connection Health States**: Real-time checking updates connection dot in sidebar (Connected, API Key Missing, Offline).
- [x] **Error Boundaries**: Standardized JSON responses map API faults to user-friendly messages for 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate-limited), and 500 (Internal) codes.
- [x] **Transient Error Retry**: Exponential backoff wrapper auto-retries Google API timeouts.
- [x] **Zero Bundler Footprint**: Runs natively with vanilla HTML5/CSS3/JS, avoiding complex transpile steps.
