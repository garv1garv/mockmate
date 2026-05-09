# MockMate AI: Technical Architecture & Feature Breakdown

This guide provides a comprehensive technical overview of MockMate, an AI-powered interview preparation platform. It explains how the Frontend, Backend, and ML Microservice interact to provide a seamless experience.

---

## 1. High-Level Architecture
MockMate follows a **Microservices Architecture**:
- **Frontend (React + Vite)**: A premium, dark-themed UI that manages user interaction and state.
- **Backend (Node.js + Express)**: The central orchestrator that handles authentication, database (MongoDB), and acts as a secure proxy to the AI service.
- **ML Microservice (FastAPI + Python)**: The "brain" of the application. It handles AI logic, PDF parsing, and natural language evaluation.

---

## 2. The ML Microservice (FastAPI)
The ML service is built for high performance and modularity.

### Key Technologies:
- **FastAPI**: A modern, high-performance web framework for building APIs with Python.
- **Pydantic**: Used for data validation. It ensures the backend sends exactly what the ML service expects (null-safety).
- **Google Gemini API**: Used for advanced reasoning, question generation, and technical critique.
- **Ollama (Optional)**: Support for local LLMs for private, cost-free inference.
- **PyMuPDF (fitz)**: Used for high-accuracy text extraction from Resume PDFs.

### Features Step-by-Step:
1.  **Adaptive Question Generation**: 
    - Takes `resume_text`, `job_description`, and `difficulty` as inputs.
    - The AI analyzes the resume to find specific projects and "grills" the candidate on their own claims to verify depth.
2.  **Multidimensional Evaluation**: 
    - Evaluates answers based on **Semantic Similarity** (how close is the meaning?), **Keyword Coverage**, and **Clarity**.
    - Combines rule-based math with AI feedback to provide a human-like critique.
3.  **Resume ATS Scoring**: 
    - Analyzes formatting, action verbs, quantified achievements, and keyword density.
    - Provides a "Credibility Score" based on professional signals (LinkedIn, GitHub links, etc.).

---

## 3. The Backend Proxy (Node.js)
The backend doesn't just store data; it protects your AI secrets.

- **Security**: All Gemini API keys are stored on the server. The Frontend never sees them, preventing theft or abuse.
- **Translation Layer**: Since Javascript uses `camelCase` and Python uses `snake_case`, the backend maps variables (e.g., `targetRole` to `target_role`) before talking to the ML service.
- **Session Management**: Uses **MongoDB** and **JWT** to keep users logged in and track their interview history and progress.

---

## 4. The Frontend (React + TypeScript)
Designed with a "Premium-First" aesthetic.

- **Design System**: Built with **Vanilla CSS** for maximum control. Uses **Glassmorphism**, smooth gradients, and **Lucide-react** icons.
- **State Management**: Uses **Redux Toolkit** to manage user profiles, interview sessions, and AI settings globally.
- **UX Features**: 
    - **Skeleton Loaders**: Provides visual feedback while the AI "thinks."
    - **Interactive Dashboard**: Visualizes "Readiness Scores" and "Skill Gaps" using dynamic progress bars.

---

## 5. Deployment (Render)
- **Hardenened Production**: Uses **Gunicorn** with a 300-second timeout to prevent the server from killing long AI tasks.
- **Internal Discovery**: Uses Render's internal networking for fast, secure communication between the Backend and ML service.

---

## Summary of Recent Improvements
- **Standardized Connectivity**: Fixed the 500/502 errors by synchronizing URL handling and timeouts.
- **Null-Safety**: Added "Safety Nets" in Python to prevent crashes when user data is incomplete.
- **Case Mapping**: Fixed the naming mismatch between JS and Python conventions.

**MockMate is now a production-ready, hyper-personalized AI career coach.**
