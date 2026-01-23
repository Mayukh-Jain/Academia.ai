# 🎓 Academia.AI  
**AI-Powered Research, Learning & Knowledge Transformation Platform**

🔗 **Live Demo:** https://academia-ai.vercel.app *(replace with actual link)*  
📘 **API Documentation:** https://academia-ai-api.docs *(replace with actual link)*

---

## 🚀 Project Summary (Resume / Portfolio Ready)

**Academia.AI** is an end-to-end AI-driven learning platform that transforms static academic PDFs into **interactive chats**, **adaptive courses**, and **podcast-style audio discussions**.  

Designed to enhance *just-in-time learning*, the platform leverages **Retrieval-Augmented Generation (RAG)** with **Google Gemini 1.5** to deliver accurate, citation-backed responses grounded entirely in user-provided documents.

Built with a modern full-stack architecture using **FastAPI**, **React (Vite)**, and **Supabase**, Academia.AI demonstrates strong expertise in **LLM integration**, **vector search**, and **scalable AI system design**.

---

## ✨ Key Highlights (Impact-Focused)

- 📄 Converted static PDFs into **context-aware AI conversations** using RAG
- 🧠 Implemented **multi-document semantic search** with pgvector embeddings
- 🎓 Built an **adaptive course generator** with quizzes and dynamic feedback loops
- 🎙️ Designed a **NotebookLM-style podcast engine** to convert research into dialogue-based audio
- 🔐 Ensured secure, user-specific document storage with Supabase authentication
- ⚡ Delivered a responsive, animated UI using Tailwind CSS & Framer Motion

---

## 🧠 Core Features

### 🔍 Context-Aware PDF Chat (RAG)
- Query multiple PDFs simultaneously
- Citation-grounded AI answers to reduce hallucinations
- Split-screen document reading and chat interface

### 🎓 CourseGenie – Adaptive Learning Engine
- Auto-generates structured syllabi for any topic
- Chapter-wise quizzes with AI-powered feedback
- Simplifies explanations dynamically based on learner responses

### 🎙️ AI Podcast Studio
- Converts research papers into two-person audio conversations
- Real-time audio visualizer
- Downloadable episodes for offline learning

### 📂 Smart Knowledge Library
- Persistent storage of chats, courses, and podcasts
- Secure document ownership validation

---

## 🛠️ Tech Stack

**Frontend**
- React.js (Vite)
- Tailwind CSS
- Framer Motion
- Lucide Icons

**Backend**
- FastAPI (Python 3.10+)
- Google Gemini 1.5 Flash
- PyPDF2 (PDF Parsing)
- Edge TTS (Audio Generation)

**Database & Infrastructure**
- Supabase (PostgreSQL)
- pgvector (Vector Embeddings for RAG)
- Vercel (Frontend Deployment)
- Hugging Face Spaces / Render (Backend)

---

## 🌐 Live Demo

🔗 **Academia.AI Web App:**  
https://academia-ai.vercel.app  

**Demo Capabilities:**
- Upload and chat with PDFs
- Generate AI-powered courses instantly
- Convert research into podcast-style audio

---

## 📘 API Documentation

🔗 **Backend API Docs:**  
https://academia-ai-api.docs  

**Includes:**
- PDF upload & embedding endpoints
- RAG-based query APIs
- Course generation APIs
- Podcast creation & audio streaming endpoints

---

## 🏗️ System Architecture

Academia.AI follows a **modular, scalable, full-stack architecture** designed for AI-powered document understanding and adaptive learning. The system integrates a modern React frontend with a FastAPI backend and a vector-enabled database to enable efficient **Retrieval-Augmented Generation (RAG)** workflows.

---

### 🔄 High-Level Flow

1. **User uploads PDFs** via the React frontend  
2. **Backend (FastAPI)** extracts and preprocesses text  
3. **Embeddings** are generated using **Google Gemini 1.5**  
4. Embeddings are stored in **Supabase (PostgreSQL + pgvector)**  
5. User queries trigger **semantic search** over stored vectors  
6. Retrieved context is sent to Gemini for **grounded response generation**  
7. Responses (chat, course, or podcast scripts) are returned to the frontend  
8. Optional audio is generated using **Edge TTS**  

---

### 🧩 Architecture Diagram

```mermaid
graph TD
    User --> Frontend
    Frontend --> Backend

    Backend --> PDFParser
    Backend --> EmbeddingModel
    Backend --> VectorDB

    VectorDB --> Backend
    EmbeddingModel --> Backend

    Backend --> TTS
    Backend --> Frontend


---

## 👤 Author

**Mayukh Jain**  
*Full-Stack Developer | AI & RAG Systems*

- 💼 **Portfolio:** https://your-portfolio-link  
- 🐙 **GitHub:** https://github.com/your-github-username  

---

⭐ *If this project helped you, consider giving it a star!*
