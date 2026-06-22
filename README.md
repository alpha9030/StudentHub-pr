# 🎓 Student Hub

Student Hub is a modern, responsive academic workspace for curriculum tracking, progress monitoring, and interactive learning.

🔗 **Live URL:** [https://studenthub-pr.onrender.com](https://studenthub-pr.onrender.com)

---

## 🌟 Key Features

* **Dynamic Curriculum Path**: Select your department and year to dynamically render a custom syllabus path.
* **Progress Tracking**: Tick off syllabus topics to update your visual progress meter in real-time.
* **Aura AI Tutor**: Chatbot assistant with custom offline/online settings.
* **Hybrid Google Sign-In**: Integrated Google Auth with backend token validation (and simulated fallback for local testing).
* **Responsive Styling**: Fully optimized glassmorphic layout consistent across desktop, tablet, and mobile displays.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6)
* **Backend**: Python Flask
* **Database**: SQLite3

---

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd website1.html
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Settings**:
   Create a `config.json` in the root directory (you can copy `config.example.json` as a guide) to set up your Google Client ID and optional SMTP configuration.

4. **Run the backend**:
   ```bash
   python app.py
   ```

5. **Access the Web App**:
   Open `index.html` in any browser to start using Student Hub!
