from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from backend.database import get_db
from backend.models.library_model import Watchlist, History
from backend.schemas.library_schema import LibraryCreate, LibraryResponse, HistoryUpdate
from backend.auth.get_user import get_current_user
from backend.models.user_model import User
from backend.utils.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/library", tags=["library"])

@router.post("/watchlist", response_model=LibraryResponse)
@limiter.limit("10/minute")
def add_to_watchlist(request: Request, movie: LibraryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if already in watchlist
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.tmdb_id == movie.tmdb_id
    ).first()
    if existing:
        return existing
    
    new_entry = Watchlist(
        user_id=current_user.id,
        tmdb_id=movie.tmdb_id,
        title=movie.title,
        poster_path=movie.poster_path
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.get("/watchlist", response_model=List[LibraryResponse])
def get_watchlist(skip: int = 0, limit: int = 50, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).offset(skip).limit(limit).all()

@router.delete("/watchlist/{tmdb_id}")
def remove_from_watchlist(tmdb_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.tmdb_id == tmdb_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Movie not found in watchlist")
    
    db.delete(entry)
    db.commit()
    return {"message": "Removed from watchlist"}

@router.post("/history", response_model=LibraryResponse)
@limiter.limit("10/minute")
def add_to_history(request: Request, movie: LibraryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check for existing history entry to perform an upsert
    existing = db.query(History).filter(
        History.user_id == current_user.id,
        History.tmdb_id == movie.tmdb_id
    ).first()
    
    if existing:
        existing.viewed_at = func.now()
        existing.rating = movie.rating
        existing.notes = movie.notes
        db.commit()
        db.refresh(existing)
        return existing
        
    new_entry = History(
        user_id=current_user.id,
        tmdb_id=movie.tmdb_id,
        title=movie.title,
        poster_path=movie.poster_path,
        rating=movie.rating,
        notes=movie.notes
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.patch("/history/{tmdb_id}", response_model=LibraryResponse)
@limiter.limit("10/minute")
def update_history_entry(request: Request, tmdb_id: str, update: HistoryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(History).filter(
        History.user_id == current_user.id,
        History.tmdb_id == tmdb_id
    ).order_by(History.viewed_at.desc()).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Movie history entry not found")
    
    if update.rating is not None:
        entry.rating = update.rating
    if update.notes is not None:
        entry.notes = update.notes
        
    db.commit()
    db.refresh(entry)
    return entry

from backend.utils.journal_analyzer import generate_journal_summary

@router.get("/journal/summary")
@limiter.limit("5/minute")
def get_journal_summary(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(History).filter(History.user_id == current_user.id).order_by(History.viewed_at.desc()).limit(10).all()
    summary = generate_journal_summary(history)
    return {"summary": summary}

@router.get("/history", response_model=List[LibraryResponse])
def get_history(skip: int = 0, limit: int = 20, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(History).filter(History.user_id == current_user.id).order_by(History.viewed_at.desc()).offset(skip).limit(limit).all()

from backend.tools.tmdb_tool import get_movie_details
from collections import Counter
from functools import lru_cache

# Wrap get_movie_details with an LRU cache to bound memory usage
@lru_cache(maxsize=1000)
def get_cached_movie_details(movie_id: int):
    return get_movie_details(movie_id)

@router.get("/persona")
def get_user_persona(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Get all library items
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    history = db.query(History).filter(History.user_id == current_user.id).all()
    
    all_movies = watchlist + history
    total_count = len(all_movies)
    
    if total_count == 0:
        return {
            "title": "Blank Canvas",
            "description": "Your cinematic journey is a mystery waiting to be written. Add your first film to begin!",
            "badge": "🎞️",
            "watchlist_count": 0,
            "history_count": 0
        }
    
    # 2. Extract unique movie IDs
    movie_ids = list(set([m.tmdb_id for m in all_movies]))
    
    genre_tally = Counter()
    for mid in movie_ids:
        try:
            m_id = int(mid)
            details = get_cached_movie_details(m_id)
            if "genres" in details:
                for g in details["genres"]:
                    genre_tally[g["name"]] += 1
        except (ValueError, TypeError):
            continue
                
    if not genre_tally:
        return {
            "title": "Curious Newcomer",
            "description": "You're dipping your toes into the vast ocean of cinema.",
            "badge": "🌊",
            "watchlist_count": len(watchlist),
            "history_count": len(history)
        }
        
    # 4. Map to persona
    top_genres = genre_tally.most_common(2)
    primary_genre = top_genres[0][0]
    secondary_genre = top_genres[1][0] if len(top_genres) > 1 else None
    
    persona_map = {
        "Action": {"title": "Adrenaline Junkie", "badge": "🔥", "desc": "You live for high-octane thrills and explosive set pieces."},
        "Adventure": {"title": "Global Explorer", "badge": "🌍", "desc": "You have an insatiable thirst for grand journeys and epic quests."},
        "Animation": {"title": "Toon Titan", "badge": "🎨", "desc": "You appreciate the limitless imagination of animated worlds."},
        "Comedy": {"title": "Laughter Guru", "badge": "😂", "desc": "You know that life is better when you're laughing."},
        "Crime": {"title": "Detective Mind", "badge": "🔍", "desc": "You love untangling complex webs of mystery and intrigue."},
        "Documentary": {"title": "Knowledge Seeker", "badge": "📖", "desc": "You're always looking for the truth behind the story."},
        "Drama": {"title": "Emotion Architect", "badge": "🎭", "desc": "You possess a deep appreciation for the human condition."},
        "Family": {"title": "Home Hero", "badge": "🏠", "desc": "You value stories that bring everyone together."},
        "Fantasy": {"title": "High-Fantasy Sovereign", "badge": "✨", "desc": "You're always ready to step into another world beyond maps."},
        "History": {"title": "Time Traveler", "badge": "⏳", "desc": "You have a deep respect for the events that shaped our world."},
        "Horror": {"title": "Midnight Dweller", "badge": "👻", "desc": "You find beauty in the shadows and thrill in the unknown."},
        "Music": {"title": "Melody Maker", "badge": "🎵", "desc": "You hear the rhythm in every story."},
        "Mystery": {"title": "Enigma Solver", "badge": "🕵️", "desc": "No secret is safe from your sharp intuition."},
        "Romance": {"title": "Cine-Romantic", "badge": "💖", "desc": "You believe in the power of love on the silver screen."},
        "Science Fiction": {"title": "Future Visionary", "badge": "🚀", "desc": "Your sights are fixed on the wonders of tomorrow."},
        "Thriller": {"title": "Suspense Specialist", "badge": "⚡", "desc": "You thrive on the edge of your seat."},
        "War": {"title": "Honor Guard", "badge": "🎖️", "desc": "You respect the stories of sacrifice and bravery."},
        "Western": {"title": "Old Soul", "badge": "🤠", "desc": "You appreciate the rugged tales of the frontier."}
    }
    
    # Custom "Cold-Start" titles for small libraries
    if total_count < 3:
        generic_titles = {
            "Action": "Rising Hero",
            "Science Fiction": "Junior Voyager",
            "Horror": "Shadow Seekers",
            "Drama": "Heartfelt Observer",
            "Comedy": "Cheerful Scout"
        }
        title = generic_titles.get(primary_genre, f"Emerging {primary_genre} Fan")
        persona = {
            "title": title,
            "badge": "🌱",
            "desc": f"Your interest in {primary_genre} is just the beginning of a great story."
        }
    else:
        # Check for special combos if secondary genre exists
        if primary_genre == "Science Fiction" and secondary_genre == "Action":
             persona = {"title": "Cyberpunk Renegade", "badge": "📟", "desc": "You love high-tech, low-life stories with plenty of action."}
        elif primary_genre == "Horror" and secondary_genre == "Thriller":
             persona = {"title": "Scream Strategist", "badge": "🔪", "desc": "You have a refined taste for suspenseful scares and sharp twists."}
        else:
            persona = persona_map.get(primary_genre, {"title": "Cinephile", "badge": "🍿", "desc": "A versatile lover of all things cinema."})
    
    return {
        **persona,
        "watchlist_count": len(watchlist),
        "history_count": len(history)
    }
@router.get("/radar")
def get_radar_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    history = db.query(History).filter(History.user_id == current_user.id).all()
    
    all_movies = []
    seen_ids = set()
    for m in watchlist + history:
        if m.tmdb_id not in seen_ids:
            all_movies.append(m)
            seen_ids.add(m.tmdb_id)
            
    import math
    import random
    import hashlib
    
    nodes = []
    for m in all_movies:
        # Deterministic position based on tmdb_id (Defect 20)
        seed = int(hashlib.md5(str(m.tmdb_id).encode()).hexdigest(), 16) % (10**9)
        rng = random.Random(seed)
        angle_deg = rng.randint(0, 360)
        radius = 50 + rng.random() * 200
        angle_rad = math.radians(angle_deg)
        
        nodes.append({
            "id": m.tmdb_id,
            "title": m.title,
            "poster_path": m.poster_path,
            "x": math.cos(angle_rad) * radius,
            "y": math.sin(angle_rad) * radius,
            "type": "watchlist" if any(x.tmdb_id == m.tmdb_id for x in watchlist) else "history"
        })
        
    return {"nodes": nodes}

@router.get("/swipe")
def get_swipe_deck(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import requests
    import os
    
    # 1. Get user library IDs
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    history = db.query(History).filter(History.user_id == current_user.id).all()
    user_movie_ids = {m.tmdb_id for m in watchlist + history}
    
    # 2. Fetch trending movies
    TMDB_API_KEY = os.getenv("TMDB_API_KEY")
    endpoint = f"https://api.themoviedb.org/3/trending/movie/week"
    params = {"api_key": TMDB_API_KEY, "language": "en-US"}
    
    response = requests.get(endpoint, params=params)
    response.raise_for_status()
    trending = response.json().get("results", [])
    
    # 3. Filter and format
    deck = []
    for m in trending:
        if str(m.get("id")) not in user_movie_ids:
            poster_path = m.get("poster_path")
            if poster_path:
                poster_path = poster_path if poster_path.startswith('/') else f"/{poster_path}"
                poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
            else:
                poster_url = None
                
            deck.append({
                "id": str(m.get("id")),
                "title": m.get("title"),
                "poster": poster_url,
                "overview": m.get("overview"),
                "vote_average": m.get("vote_average")
            })
            
    return {"deck": deck[:15]} # Return 15 fresh items
