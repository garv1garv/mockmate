# 🚀 MockMate: AI-Powered Interview Preparation Platform

MockMate is a high-fidelity, end-to-end interview simulation platform designed to help developers ace technical interviews through real-time AI feedback, architectural audits, and personalized learning paths.

![MockMate Banner](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80)

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

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Redux Toolkit, Lucide React, Glassmorphism UI.
- **Backend**: Node.js, Express, MongoDB (Atlas).
- **ML Service**: Python, FastAPI, Google Gemini API, Ollama (Local AI).
- **Deployment**: Vercel (Frontend), Render (Backend & ML).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB Atlas account
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/garv1garv/mockmate.git
   cd mockmate
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with MONGODB_URI and JWT_SECRET
   npm run dev
   ```

4. **ML Service Setup**
   ```bash
   cd ml_service
   pip install -r requirements.txt
   # Create a .env file with GEMINI_API_KEY
   python main.py
   ```

## 🔐 AI Authentication (BYOK)
MockMate uses a **Bring Your Own Key (BYOK)** model. You can configure your AI preferences in the **Settings** page:
- **Google Gemini**: High-speed, high-fidelity cloud inference.
- **Local Ollama**: Free, private, local inference for those with supported hardware.

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or new features.

## 📄 License
This project is licensed under the MIT License.

---
Built with ❤️ for the developer community.
