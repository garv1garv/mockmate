# 🚀 MockMate: AI-Powered Interview Preparation Platform

MockMate is a high-fidelity, end-to-end interview simulation platform designed to help developers ace technical interviews through real-time AI feedback, architectural audits, and personalized learning paths.

![MockMate Banner](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)

---

## 🌐 Live Deployment Links

### Frontend (Vercel)
- https://mockmate-one-bice.vercel.app/

### Backend API (Render)
- https://mockmate-u0cx.onrender.com

### ML Microservice (Render)
- https://mockmate-1-kgzx.onrender.com

> ⚠️ Important: Backend and ML services are hosted on Render free instances and may sleep after inactivity.  
> Open both Render links once before opening the frontend Vercel app to wake the services up.

---

## ✨ Core Features

### 🧠 Real-time AI Interviewer
Engage in dynamic, voice-enabled technical interviews. Our AI adapts to your answers, probes deeper into your explanations, and provides instant, staff-level feedback.

### 🏗️ Project Architect Critique
Submit your personal or professional projects for a rigorous architectural audit.

- **Architectural Scoring**: High-level evaluation of system complexity and soundness.
- **Risk Assessment**: Identification of technical vulnerabilities and single points of failure.
- **Killer Questions**: Generation of the exact "grilling" questions senior interviewers will ask about your specific architecture.

### 📄 Intelligent Resume Analysis
Upload your resume for a deep-dive analysis. MockMate extracts key skills and identifies "interview hotspots" that recruiters are likely to target.

### 🗺️ Dynamic Learning Paths
Personalized roadmaps generated based on your interview performance and target role, focusing on your specific knowledge gaps.

---

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Redux Toolkit
- Lucide React
- Glassmorphism UI

### Backend
- Node.js
- Express.js
- MongoDB Atlas

### ML Service
- Python
- FastAPI
- Google Gemini API
- Ollama (Local AI)

### Deployment
- Vercel (Frontend)
- Render (Backend & ML Services)

---

# 🚀 Running the Hosted Version

## 📋 Prerequisites

Before opening the frontend app, first wake up the backend and ML services:

### Step 1 — Wake Backend API
Open:
```text id="backend-link"
https://mockmate-u0cx.onrender.com

Step 2 — Wake ML Microservice

Open:

https://mockmate-1-kgzx.onrender.com

Step 3 — Launch Frontend

Now open:

https://mockmate-one-bice.vercel.app/

> ⏳ First load may take 30–60 seconds because Render free-tier instances need to boot up.




---

⚙️ Local Development Setup

1. Clone Repository

git clone https://github.com/garv1garv/mockmate.git
cd mockmate


---

2. Frontend Setup

cd frontend
npm install
npm run dev


---

3. Backend Setup

cd backend
npm install

# Create a .env file with:
# MONGODB_URI=
# JWT_SECRET=

npm run dev


---

4. ML Service Setup

cd ml_service

pip install -r requirements.txt

# Create a .env file with:
# GEMINI_API_KEY=

python main.py


---

🔐 AI Authentication (BYOK)

MockMate uses a Bring Your Own Key (BYOK) model.

Users can configure their preferred AI provider in the settings page.

Supported Providers

Google Gemini

Fast cloud inference

High-quality reasoning

Better interview simulation quality


Local Ollama

Fully local execution

Free inference

Privacy-focused AI processing



---

🧩 High-Level Architecture

Frontend (React + Vercel)
        │
        ▼
Backend API (Node.js + Express)
        │
        ├── MongoDB Atlas
        │
        └── ML Microservice (FastAPI + Gemini/Ollama)


---

🤝 Contributing

Contributions are welcome!

You can contribute through:

Feature additions

Performance optimizations

UI/UX improvements

AI workflow enhancements

Bug fixes


Steps

1. Fork the repository


2. Create a feature branch


3. Commit your changes


4. Open a pull request




---

📄 License

This project is licensed under the MIT License.


---

❤️ Built for Developers

MockMate was designed to recreate realistic technical interview pressure while giving developers actionable feedback, architectural insight, and personalized improvement paths.
