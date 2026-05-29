# RoadWatch — Hackathon Presentation Outline
## Road Safety Hackathon 2026 | CoERS, RBG Labs, IIT Madras

---

## Slide 1: Welcome

**Title:** RoadWatch — AI-Powered Road Transparency Platform  
**Subtitle:** Road Safety Hackathon 2026 | Problem Statement: RoadWatch  
**Team:** [Your Team Name]

---

## Slide 2: The Problem

**Citizens are in the dark about:**
- Which contractor built the road that keeps breaking?
- How much public money was spent — and was it wasted?
- Who do I complain to, and will anyone listen?
- Which roads are about to fail?

**Result:** Low accountability, repeated failures, wasted public funds, unsafe roads.

---

## Slide 3: Our Solution — RoadWatch

**One platform. Full transparency.**

| Feature | What it does |
|---|---|
| 🗺️ Road Info | Type, contractor, budget, repair history |
| 📢 Smart Complaints | GPS + AI severity scoring + auto-routing |
| 🤖 AI Chatbot | RAG-powered, multilingual, voice-enabled |
| 📊 Dashboard | Budget anomalies, contractor scorecards |
| 🔮 Predictions | ML forecasts road failures 90 days ahead |
| ⛓️ Audit Ledger | Tamper-proof complaint trail |

---

## Slide 4: Technical Architecture

```
React PWA (Offline-first)
    ↓
FastAPI Backend
    ├── RAG Chatbot (LangChain + ChromaDB + GPT-4)
    ├── AI Severity Scorer (OpenCV + CV analysis)
    ├── Deterioration Predictor (scikit-learn)
    ├── Smart Router (PostGIS geo-boundary)
    ├── Budget Anomaly Detector (statistical)
    └── Immutable Ledger (SHA-256 hash chain)
    ↓
PostgreSQL + PostGIS + Redis
```

**Stack:** Python FastAPI · React 18 · Tailwind · Mapbox · LangChain · ChromaDB · Docker

---

## Slide 5: Key Innovations

1. **🤖 AI Pothole Severity Scorer** — CV model classifies damage from photos (LOW/MEDIUM/HIGH/CRITICAL)
2. **🔮 Predictive Deterioration** — ML predicts road failures before they happen
3. **🚨 Budget Anomaly Detector** — Flags suspicious spending (3x average, repeated repairs, overspend)
4. **⛓️ Immutable Ledger** — SHA-256 hash chain makes complaint history tamper-proof
5. **🎙️ Voice Accessibility** — Full voice interaction via Whisper STT + gTTS for rural/low-literacy users
6. **🏆 Contractor Scorecards** — Public trust score based on on-time rate, re-complaints, citizen ratings
7. **🌍 Global Architecture** — Country-specific routing rules, multilingual RAG, normalized data model

---

## Slide 6: Demo Highlights

- **Report a pothole** → Upload photo → AI scores severity → Auto-routed to correct authority
- **Ask the chatbot** → "Who is responsible for NH-48?" → RAG retrieves project data → Accurate answer
- **Dashboard** → See budget anomalies flagged in red → Contractor scorecards ranked A-F
- **Offline mode** → Submit complaint without internet → Auto-syncs when reconnected
- **Track complaint** → Enter ticket → See tamper-proof audit trail

---

## Slide 7: Thank You

**RoadWatch — Making every rupee of road spending visible.**

Contact: [team email]  
GitHub: [repo link]  
Demo: [live URL]

*Built for Road Safety Hackathon 2026 | CoERS, RBG Labs, IIT Madras*
