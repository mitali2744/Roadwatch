# 🛣️ RoadWatch — AI-Powered Road Transparency Platform

<div align="center">

![RoadWatch Banner](https://img.shields.io/badge/RoadWatch-AI%20Road%20Transparency-blue?style=for-the-badge&logo=road&logoColor=white)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=flat-square&logo=render)](https://roadwatch-frontend.onrender.com)
[![Backend API](https://img.shields.io/badge/Backend%20API-FastAPI-009688?style=flat-square&logo=fastapi)](https://roadwatch-api-heur.onrender.com/api/docs)
[![GitHub](https://img.shields.io/badge/GitHub-mitali2744%2FRoadwatch-181717?style=flat-square&logo=github)](https://github.com/mitali2744/Roadwatch)
[![Hackathon](https://img.shields.io/badge/Hackathon-Road%20Safety%202026-orange?style=flat-square)](https://unstop.com)

**Road Safety Hackathon 2026 | CoERS, RBG Labs, IIT Madras**  
*Theme: AI in Road Safety | Problem Statement: RoadWatch*

</div>

---

## 🚀 What is RoadWatch?

RoadWatch is a full-stack AI-powered platform that enables citizens to **monitor road quality**, **track public spending**, **report issues**, and **hold authorities accountable** — with complete transparency into road infrastructure across the globe.

> "Making every rupee of road spending visible."

---

## ✨ Features

### Core Features
| Feature | Description |
|---|---|
| 🗺️ **Live Road Map** | Interactive map with road conditions, complaint heatmap, project markers |
| 📢 **Smart Complaint System** | GPS + photo upload, AI severity scoring, auto-routing to correct authority |
| 🤖 **AI Chatbot (RAG)** | Answers road/budget/contractor queries using Groq Llama 3 + ChromaDB |
| 📊 **Transparency Dashboard** | Budget vs spend, contractor scorecards, anomaly alerts, at-risk roads |
| 🔍 **Complaint Tracker** | Real-time status with tamper-proof SHA-256 audit trail |
| 📴 **Offline PWA** | Works without internet, stores complaints in IndexedDB, auto-syncs |
| 🌍 **Global Support** | India, USA, Europe — any country's road governance structure |

### 🌟 Unique Innovations
| Innovation | Description |
|---|---|
| 🤖 **AI Pothole Severity Scorer** | Computer vision classifies damage from photos (LOW/MEDIUM/HIGH/CRITICAL) |
| 🔮 **Predictive Deterioration Model** | ML forecasts road failures 30–90 days in advance |
| 🚨 **Budget Anomaly Detector** | Flags suspicious spending (3x average, repeated repairs, overspend) |
| ⛓️ **Immutable Audit Ledger** | SHA-256 hash chain makes complaint history tamper-proof |
| 🎙️ **Voice Accessibility** | Full voice interaction via Web Speech API + gTTS for rural/low-literacy users |
| 🏆 **Contractor Scorecards** | Public trust score from on-time rate, re-complaints, citizen ratings |
| 🔥 **Live Complaint Heatmap** | Real-time crowdsourced complaint density overlay on map |
| 🌍 **Multilingual RAG** | Jurisdiction-aware answers in 7+ languages (EN, HI, TA, TE, KN, FR, DE) |
| 🧠 **Smart Complaint Router** | Auto-assigns to NHAI/PWD/Municipal based on road type + GPS location |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              React 18 PWA (Frontend)                │
│   Leaflet Maps · Recharts · Tailwind · IndexedDB    │
└──────────────────────┬──────────────────────────────┘
                       │ REST API / SSE Streaming
┌──────────────────────▼──────────────────────────────┐
│              FastAPI Backend (Python 3.11)           │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  RAG Chain  │  │  ML Services │  │  Routing  │  │
│  │  LangChain  │  │  CV Severity │  │  Engine   │  │
│  │  Groq LLM   │  │  Prediction  │  │  PostGIS  │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Audit      │  │  Anomaly     │  │  Voice    │  │
│  │  Ledger     │  │  Detector    │  │  STT/TTS  │  │
│  │  SHA-256    │  │  Statistics  │  │  gTTS     │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
└──────────┬──────────────┬───────────────────────────┘
           │              │
    ┌──────▼──────┐  ┌────▼──────┐
    │ PostgreSQL  │  │ ChromaDB  │
    │  (Render)   │  │ (Vector)  │
    └─────────────┘  └───────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Maps** | Leaflet + OpenStreetMap (free, no API key) |
| **Charts** | Recharts |
| **PWA** | Vite PWA Plugin, Workbox, IndexedDB |
| **Backend** | FastAPI, Python 3.11, Uvicorn |
| **AI/LLM** | LangChain, Groq (Llama 3 70B), ChromaDB |
| **Database** | PostgreSQL (Render free tier) |
| **Auth** | JWT (python-jose, passlib) |
| **Deployment** | Render (Docker + Static Site) |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Clone the repo
```bash
git clone https://github.com/mitali2744/Roadwatch.git
cd Roadwatch
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env
# Edit .env and add your GROQ_API_KEY
uvicorn main:app --reload
```

### 3. Frontend setup
```bash
cd frontend
npm install
# Create .env.local with:
# VITE_API_URL=http://localhost:8000
npm run dev
```

### 4. Or use Docker Compose
```bash
docker-compose up -d
```

Open **http://localhost:5173**

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Free at [console.groq.com](https://console.groq.com) |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `SECRET_KEY` | ✅ Yes | Any random string for JWT |
| `OPENAI_API_KEY` | ❌ Optional | Falls back to Groq if not set |

---

## 🌐 Live Deployment

| Service | URL |
|---|---|
| **Frontend** | https://roadwatch-frontend.onrender.com |
| **Backend API** | https://roadwatch-api-heur.onrender.com |
| **API Docs** | https://roadwatch-api-heur.onrender.com/api/docs |

> ⚠️ Free tier — backend may take 30 seconds to wake up on first request.

---

## 📁 Project Structure

```
Roadwatch/
├── backend/                  # FastAPI Python backend
│   ├── api/routes/           # 7 API route modules
│   ├── db/                   # Models, migrations, seed data
│   ├── services/
│   │   ├── rag/              # LangChain + ChromaDB chatbot
│   │   ├── ml/               # Severity scorer, deterioration model, anomaly detector
│   │   ├── routing/          # Smart complaint router
│   │   └── ledger/           # Immutable audit chain
│   ├── core/                 # Config, settings
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React 18 PWA
│   └── src/
│       ├── pages/            # 7 pages
│       ├── api/              # Typed API clients
│       ├── hooks/            # 6 custom React hooks
│       └── lib/              # IndexedDB offline store
├── data/                     # Sample CSV datasets
├── render.yaml               # Render deployment config
└── docker-compose.yml        # Local development
```

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/roads/nearby` | Roads near GPS coordinates |
| POST | `/api/complaints/submit` | Submit complaint with image |
| GET | `/api/complaints/track/{ticket}` | Track complaint status |
| GET | `/api/complaints/nearby/heatmap` | Complaint heatmap data |
| POST | `/api/chatbot/chat` | AI chatbot query |
| POST | `/api/chatbot/chat/stream` | Streaming AI response |
| GET | `/api/dashboard/overview` | Budget & complaint stats |
| GET | `/api/dashboard/contractors/scorecards` | Contractor rankings |
| POST | `/api/voice/transcribe` | Speech to text |
| POST | `/api/voice/speak` | Text to speech |

Full interactive docs: `/api/docs`

---

## 🏆 Hackathon

**Event:** Road Safety Hackathon 2026  
**Organizer:** Centre of Excellence for Road Safety (CoERS), RBG Labs, IIT Madras  
**Theme:** AI in Road Safety  
**Problem Statement:** RoadWatch  
**Submission Platform:** Unstop  
**Deadline:** May 31, 2026  

---

## 👩‍💻 Team

**Team Name:** [Your Team Name]  
**Members:** Mitali Brahmankar  
**Contact:** [your email]

---

## 📄 License

This project was built for the Road Safety Hackathon 2026. All rights reserved.

---

<div align="center">
  <strong>Built with ❤️ for safer roads and transparent governance</strong>
</div>
