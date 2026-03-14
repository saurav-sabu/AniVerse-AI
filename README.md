# CineSync AI 🎬

**CineSync AI** is a premium, agentic movie discovery platform. Unlike traditional search engines, it uses an advanced AI agent to search, reason, and curate personalized cinematic experiences using live data from **The Movie Database (TMDB)**.

Experience the future of movie discovery with a stunning, glassmorphism-inspired interface and a suite of agentic features designed to find exactly what fits your mood.

---

## 🔥 Key Features

### 1. **Agentic Conversation**
Communicate naturally with an AI agent that doesn't just search—it *reasons*. Ask for "cyberpunk vibes like Blade Runner" or "heartwarming movies for a rainy Sunday" and get deep, metadata-rich recommendations.

### 2. **Cine-Swipe**
Rapidly discover movies with our interactive discovery deck. Swipe right to save to your Vault or left to skip. The AI learns from every swipe to better understand your unique taste.

### 3. **Cinema Vibe Radar**
Explore your cinematic universe spatially. The **Universe** view provides a 2D interactive map of your collection, clustering movies by their "vibe" and genre to help you visualize your preferences.

### 4. **Dynamic Persona Evolution**
Your viewing habits define you. CineSync AI analyzes your watchlist and history to evolve your **Cinematic Persona**. Watch your badge transform from a "New Cinephile" into an "Adrenaline Junkie" or "Noir Specialist" as your collection grows.

### 5. **Cinema Vault**
A premium sidebar management system for your watchlist. Quickly access trailer previews, remove items, or check streaming availability without leaving your chat.

### 6. **Advanced Utility**
- **Voice Search**: Hands-free movie finding with built-in voice-to-text.
- **Trailer Modal**: Watch official YouTube trailers directly within the app.
- **Watch Providers**: Real-time information on where to stream, rent, or buy movies.
- **Vibe Analysis**: AI-driven sentiment analysis of movie reviews.

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js & React**: For a high-performance, single-page experience.
- **Framer Motion**: Powering smooth micro-animations and physics-based swiping.
- **Tailwind CSS**: Modern styling with a custom glassmorphism design system.
- **Lucide React**: Premium iconography.

### **Backend**
- **FastAPI**: A high-performance Python web framework.
- **LangChain**: Orchestrating the ReAct agent logic.
- **Groq & Llama 3**: Powering the high-speed reasoning engine.
- **Neon Postgres**: Cloud-native database for user profiles and collection storage.
- **TMDB API**: The source of truth for global movie metadata.

---

## 🚀 Setup & Installation

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- API Keys for TMDB and Groq.

### **1. Clone & Environment**
```bash
git clone https://github.com/yourusername/AniVerse-AI.git
cd AniVerse-AI
```
Create a `.env` file in the root directory:
```env
GROQ_API_KEY="your_groq_key"
TMDB_API_KEY="your_tmdb_key"
DATABASE_URL="your_postgres_connection_string"
```

### **2. Backend Setup**
```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python -m backend.main
```

### **3. Frontend Setup**
```bash
cd frontend
npm install

# Start the dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start your cinematic journey!

---

## 🏗️ Project Architecture
```text
AniVerse-AI/
├── backend/            # FastAPI Python Server
│   ├── auth/           # JWT & Password Security
│   ├── models/         # SQLAlchemy DB Models
│   ├── routes/         # API Endpoints (Auth, Library, Movies)
│   ├── tools/          # LangChain TMDB Tools
│   └── agent.py        # ReAct Agent Logic
├── frontend/           # Next.js Application
│   ├── src/app/        # Pages (Home, Swipe, Login)
│   ├── src/components/ # Reusable UI (Radar, Persona, etc.)
│   └── src/lib/        # API Client & Helpers
└── logs/               # Application Event Logs
```

---
*Created with ❤️ for film lovers and tech enthusiasts.*
