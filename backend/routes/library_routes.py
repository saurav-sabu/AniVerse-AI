from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.library_model import Watchlist, History
from backend.schemas.library_schema import LibraryCreate, LibraryResponse, HistoryUpdate
from backend.auth.get_user import get_current_user
from backend.models.user_model import User

router = APIRouter(prefix="/library", tags=["library"])

@router.post("/watchlist", response_model=LibraryResponse)
def add_to_watchlist(movie: LibraryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def get_watchlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()

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
def add_to_history(movie: LibraryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def update_history_entry(tmdb_id: str, update: HistoryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def get_journal_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(History).filter(History.user_id == current_user.id).order_by(History.viewed_at.desc()).limit(10).all()
    summary = generate_journal_summary(history)
    return {"summary": summary}

@router.get("/history", response_model=List[LibraryResponse])
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(History).filter(History.user_id == current_user.id).order_by(History.viewed_at.desc()).limit(20).all()

from backend.tools.tmdb_tool import get_movie_details
from collections import Counter

@router.get("/persona")
def get_user_persona(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Get all library items
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    history = db.query(History).filter(History.user_id == current_user.id).all()
    
    all_movies = watchlist + history
    if not all_movies:
        return {
            "title": "New Cinephile",
            "description": "Start adding movies to discover your cinematic identity!",
            "badge": "🎬"
        }
    
    # 2. Extract unique movie IDs
    movie_ids = list(set([m.tmdb_id for m in all_movies]))
    
    # 3. Tally genres
    genre_tally = Counter()
    for mid in movie_ids:
        details = get_movie_details(movie_id=int(mid))
        if "genres" in details:
            for g in details["genres"]:
                genre_tally[g["name"]] += 1
                
    if not genre_tally:
        return {
            "title": "Explorer",
            "description": "You're just beginning your journey.",
            "badge": "🚀"
        }
        
    # 4. Map to persona
    top_genre = genre_tally.most_common(1)[0][0]
    
    persona_map = {
        "Action": {"title": "Adrenaline Junkie", "badge": "🔥", "desc": "You live for high-octane thrills and explosive set pieces."},
        "Adventure": {"title": "Global Explorer", "badge": "🌍", "desc": "You have an insatiable thirst for grand journeys and epic quests."},
        "Animation": {"title": "Toon Titan", "badge": "🎨", "desc": "You appreciate the limitless imagination of animated worlds."},
        "Comedy": {"title": "Laughter Guru", "badge": "😂", "desc": "You know that life is better when you're laughing."},
        "Crime": {"title": "Detective Mind", "badge": "🔍", "desc": "You love untangling complex webs of mystery and intrigue."},
        "Documentary": {"title": "Knowledge Seeker", "badge": "📖", "desc": "You're always looking for the truth behind the story."},
        "Drama": {"title": "Emotion Architect", "badge": "🎭", "desc": "You possess a deep appreciation for the human condition."},
        "Family": {"title": "Home Hero", "badge": "🏠", "desc": "You value stories that bring everyone together."},
        "Fantasy": {"title": "Multiverse Voyager", "badge": "✨", "desc": "You're always ready to step into another world."},
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
    
    persona = persona_map.get(top_genre, {"title": "Cinephile", "badge": "🍿", "desc": "A versatile lover of all things cinema."})
    
    return {
        **persona,
        "watchlist_count": len(watchlist),
        "history_count": len(history)
    }
@router.get("/radar")
async def get_radar_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    
    nodes = []
    for m in all_movies:
        angle_deg = random.randint(0, 360)
        radius = 50 + random.random() * 200
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
async def get_swipe_deck(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
