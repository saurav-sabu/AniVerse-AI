from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter
from functools import lru_cache
from backend.models.library_model import Watchlist, History
from backend.tools.tmdb_tool import get_movie_details

@lru_cache(maxsize=1000)
def get_cached_movie_details(movie_id: int):
    return get_movie_details(movie_id)

def calculate_persona(db: Session, user_id: int):
    # 1. Get all library items
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == user_id).all()
    history = db.query(History).filter(History.user_id == user_id).all()
    
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
        
    # 3. Map to persona
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
