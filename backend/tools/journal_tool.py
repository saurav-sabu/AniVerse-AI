from langchain_core.tools import tool
from backend.database import SessionLocal
from backend.models.library_model import History
from backend.models.user_model import User
import logging

logger = logging.getLogger(__name__)

@tool
def add_to_journal(title: str, tmdb_id: str, poster_path: str, rating: int = None, notes: str = None, user_email: str = None):
    """
    Adds a movie to the user's cinematic journal (history).
    Use this when the user says they have watched a movie or wants to review it.
    Rating should be 1-5. Notes are optional thoughts.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return "User not found. Need user context to journal."
        
        new_entry = History(
            user_id=user.id,
            tmdb_id=str(tmdb_id),
            title=title,
            poster_path=poster_path,
            rating=rating,
            notes=notes
        )
        db.add(new_entry)
        db.commit()
        return f"Successfully added '{title}' to your cinematic journal."
    except Exception as e:
        logger.error(f"Failed to add to journal tool: {e}")
        return f"Failed to add to journal: {str(e)}"
    finally:
        db.close()
