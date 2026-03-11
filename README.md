# CineSync AI 🎬

CineSync AI is a premium, agentic movie recommendation system. Unlike traditional search engines, it uses an AI agent to search, reason, and curate personalized movie lists using live data from **The Movie Database (TMDB)**.

## ✨ Features
- **Agentic Search**: Powered by LangChain's `create_react_agent`.
- **Live Data**: Real-time movie discovery via the TMDB API.
- **Premium UI**: Modern, glassmorphism-inspired Streamlit interface.
- **Functional Architecture**: Clean, logic-separated project structure.

## 🛠️ Project Structure
```text
CineSync-AI/
├── backend/
│   ├── tools/          # Functional tools (TMDB API)
│   ├── utils/          # Logger and Prompts
│   └── agent.py        # Core Agentic Logic
├── frontend/
│   └── app.py          # Streamlit UI
├── logs/               # Daily Application Logs
└── .env                # API Keys (TMDB, GROQ)
```

## 🚀 Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your API keys in the `.env` file:
   ```text
   TMDB_API_KEY=your_tmdb_key
   GROQ_API_KEY=your_groq_key
   ```
4. Run the app:
   ```bash
   streamlit run frontend/app.py
   ```
