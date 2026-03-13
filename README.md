# BarçaIQ — AI Tactical Intelligence System

> **Built for Barça Innovation Hub** · FC Barcelona's Juego de Posición, quantified.

![Barça](https://img.shields.io/badge/FC%20Barcelona-A50044?style=for-the-badge&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-004D98?style=for-the-badge&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-EDBB4D?style=for-the-badge&logo=openjdk&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-Geometric-A50044?style=for-the-badge&logo=pytorch&logoColor=white)

---

## What is BarçaIQ?

BarçaIQ is a multi-module AI tactical intelligence system that analyses FC Barcelona's **Juego de Posición** philosophy across two golden eras — Pep Guardiola (2008–12) and Luis Enrique's MSN era (2014–17).

Built on **929,856 StatsBomb events** across **249 matches**, the system extracts tactical DNA, predicts press triggers, and answers coaching questions via a grounded LLM assistant.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React / Next.js 16                    │
│         Dashboard · Press Board · Patterns · Chat        │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────┐
│              Spring Boot 3.5 (Java 21)                   │
│         JWT Auth · Redis Cache · WebClient Proxy         │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────┐
│                  FastAPI (Python)                        │
│     GNN · Press GBM · RAG Chain · Stats Endpoints       │
└──────┬──────────────┬──────────────────┬────────────────┘
       │              │                  │
   PyTorch       scikit-learn        Groq API
   GNN Model     GBM Model        Llama 3.3 70B
   (AUC 0.782)   (AUC 0.797)      + FAISS Index
```

---

## Modules

### Module 2 — GNN Tactical DNA Classifier
- **Model:** TacticalGNN_v3 (GraphSAGE) — 14,594 parameters
- **Task:** Classify possession sequences by shot-ending probability
- **Input:** PyTorch Geometric graphs from StatsBomb pass data
- **Node features:** position, involvement share, pass volume, final third flag
- **Edge features:** distance, direction, through ball, cross, angle
- **Result:** AUC **0.782**, F1 **0.422**

**Tactical Patterns Discovered:**

| Pattern | Shot Rate | Sequences |
|---------|-----------|-----------|
| Third-Man Combo | 22.7% | 6,420 |
| False Nine Drop | 21.1% | 592 |
| Inverted Winger | 18.7% | 1,421 |
| Tiki-Taka Buildup | 13.3% | 1,380 |
| Direct Attack | 11.8% | 1,239 |
| Possession Keeping | 7.3% | 6,582 |

---

### Module 3 — Press Trigger Detector
- **Model:** GradientBoostingClassifier (scikit-learn)
- **Task:** Predict press success probability from spatial + contextual features
- **Data:** 30,312 Barça pressure events
- **Result:** AUC **0.797**, F1 **0.607**, Accuracy **72.8%**

**Key Findings for Flick:**

| Feature | Importance | Finding |
|---------|-----------|---------|
| press_index_in_possession | 0.458 | Press within first 2 actions |
| teammates_pressing | 0.355 | 1-2 players optimal (41.5% success) |
| pitch zone | — | Mid-third best (33.1% vs 23.1%) |
| is_counterpress | — | Only 21% success — reset shape first |

**Interactive Tactical Press Board:**
- 22 draggable players (Flick's current squad pre-loaded)
- Drag ball → nearest opponent auto-becomes carrier
- Real-time press probability rings on each Barça player
- Named recommendations: "GAVI closes down — 64% success"

---

### Module 5 — LLM RAG Tactical Assistant
- **LLM:** Llama 3.3 70B via Groq API (14,400 req/day free tier)
- **Embeddings:** HuggingFace MiniLM-L6-v2 (local, no quota)
- **Vector Store:** FAISS with 16 tactical knowledge chunks
- **Grounding:** StatsBomb findings, press analysis, era DNA, Juego de Posición principles
- **Anti-hallucination:** Strict prompt — only cite numbers present in retrieved context

---

## Era DNA Comparison

| Metric | Pep (2008–12) | MSN (2014–17) |
|--------|--------------|--------------|
| Matches | 138 | 111 |
| Sequences/match | 72.46 | 68.82 |
| Avg passes/seq | 9.00 | 9.28 |
| Players/seq | 6.26 | 6.42 |
| Shot conversion | 14.85% | **15.32%** |
| GNN shot prob | 38.45% | **39.97%** |

- Pep: 5.2% more sequences/match, tighter structure, inverted winger dominant
- MSN: Longer sequences, wider shape, false nine drop 62% more common, marginally more threatening

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML / Data | Python, PyTorch Geometric, scikit-learn, pandas, StatsBomb |
| ML Service | FastAPI, Uvicorn, FAISS, LangChain, Groq |
| API Layer | Java 21, Spring Boot 3.5, Redis, WebClient |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| Database | PostgreSQL (schema designed), Redis (caching active) |
| Notebooks | Google Colab (GPU), Google Drive |

---

## Data

**Source:** [StatsBomb Open Data](https://github.com/statsbomb/open-data)

| Dataset | Size |
|---------|------|
| Raw events | 929,856 rows |
| Successful passes | 150,345 |
| Possession sequences | 17,638 |
| PyTorch Geometric graphs | 17,634 |
| Press events | 30,312 |
| Matches | 249 (La Liga + UCL) |

---

## Project Structure

```
BarcaIQ/
├── notebooks/
│   ├── Untitled4.ipynb    # NB2: Full data pipeline (929K events)
│   ├── Untitled5.ipynb    # NB5: Module 2 — GNN Tactical DNA
│   ├── Untitled6.ipynb    # NB6: Module 3 — Press Trigger
│   ├── Untitled7.ipynb    # NB7: Module 5 — RAG Assistant
│   └── Untitled8.ipynb    # NB8: FastAPI ML Service
├── api-service/           # Spring Boot Java API
│   └── src/main/java/com/barcaiq/api_service/
│       ├── controller/    # REST endpoints
│       ├── service/       # MLService (WebClient + Redis)
│       ├── model/         # Request/Response DTOs
│       └── config/        # Security, Redis config
└── frontend/              # Next.js 16 + TypeScript
    └── src/app/
        ├── page.tsx           # Dashboard
        ├── press/page.tsx     # Tactical Press Board
        ├── patterns/page.tsx  # Pattern Analysis
        ├── chat/page.tsx      # RAG Assistant
        └── components/
            └── Navbar.tsx
```

---

## Running Locally

### Prerequisites
- Python 3.11, Java 21, Node.js 18+, Docker

### 1. ML Service (FastAPI)
```bash
# In Google Colab — run NB8
# Or locally:
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Redis
```bash
docker run -d -p 6379:6379 --name barcaiq-redis redis:alpine
```

### 3. API Service (Spring Boot)
```bash
cd api-service
.\gradlew.bat bootRun     # Windows
./gradlew bootRun          # Mac/Linux
# Runs on http://localhost:8080
```

### 4. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## API Endpoints

### Spring Boot (port 8080)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/info` | System info + module list |
| GET | `/api/tactical/era-dna` | Pep vs MSN comparison |
| GET | `/api/tactical/patterns` | Tactical pattern stats |
| GET | `/api/tactical/summary` | Dataset summary |
| POST | `/api/tactical/press` | Press success prediction |
| POST | `/api/tactical/chat` | RAG tactical Q&A |

### FastAPI (port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | ML service health |
| GET | `/stats/summary` | Dataset statistics |
| GET | `/stats/era-dna` | Era comparison JSON |
| GET | `/stats/patterns` | Pattern breakdown |
| POST | `/predict/press` | GBM press prediction |
| POST | `/chat` | Llama 3.3 70B RAG |

---

## About

Built by **Vikram Shriram** — CSE student at VIT Chennai.  
FC Barcelona diehard. Targeting Barça Innovation Hub.

*Més que un club. Més que una dada.*

---

> *"The ball is round, but the data is rectangular."*
