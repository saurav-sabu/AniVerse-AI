from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from backend.database import SessionLocal
from backend.models.user_model import User
from backend.models.library_model import History
from backend.utils.logger import get_logger

logger = get_logger(__name__)

@tool
def add_to_journal(title: str, tmdb_id: str, poster_path: str, rating: int = None, notes: str = None, config: RunnableConfig = None):
    """
    Adds a movie to the user's cinematic journal (history).
    Use this when the user says they have watched a movie or wants to review it.
    Rating should be 1-5. Notes are optional thoughts.
    """
    if config:
        user_email = config.get("configurable", {}).get("user_email")
    else:
        user_email = None
    
    if not user_email:
        return "User context missing (email). Cannot journal without user profile."

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return "User not found in system. Need valid user context to journal."
        
        # Check for existing entry (Upsert)
        existing_entry = db.query(History).filter(
            History.user_id == user.id,
            History.tmdb_id == str(tmdb_id)
        ).first()

        if existing_entry:
            existing_entry.rating = rating if rating is not None else existing_entry.rating
            existing_entry.notes = notes if notes is not None else existing_entry.notes
            msg = f"Updated '{title}' in your cinematic journal."
        else:
            new_entry = History(
                user_id=user.id,
                tmdb_id=str(tmdb_id),
                title=title,
                poster_path=poster_path,
                rating=rating,
                notes=notes
            )
            db.add(new_entry)
            msg = f"Successfully added '{title}' to your cinematic journal."
        
        db.commit()
        return msg
    except Exception as e:
        logger.error(f"Failed to add to journal tool: {e}")
        return f"An error occurred while journaling the movie."
    finally:
        db.close()
