from fastapi import APIRouter, Depends, HTTPException
from backend.schemas.movie_schema import RecommendRequest, RecommendResponse
from backend.agent import get_movie_recommendation
from backend.auth.get_user import get_current_user
from backend.utils.logger import get_logger
from backend.utils.rate_limit import limiter
from fastapi import Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.library_model import Watchlist, History
from backend.models.user_model import User

logger = get_logger(__name__)

router = APIRouter(tags=["recommendations"])

@router.post("/recommend", response_model=RecommendResponse)
@limiter.limit("5/minute")
def recommend(request: Request, recommend_request: RecommendRequest, current_user = Depends(get_current_user)):
    """
    Endpoint to get movie recommendations from the agent.
    Requires a valid JWT token.
    """
    try:
        logger.info(f"API Request from {current_user.email}: {recommend_request.query}")
        
        # Convert history format
        formatted_history = []
        if recommend_request.history:
            formatted_history = [(m.role, m.content) for m in recommend_request.history]
        
        response = get_movie_recommendation(
            recommend_request.query, 
            history=formatted_history,
            user_context={"email": current_user.email}
        )
        return {"response": response}
        
    except Exception as e:
        logger.error(f"API Error for {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")

@router.get("/recommend/surprise", response_model=RecommendResponse)
@limiter.limit("3/minute")
def surprise_me(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Endpoint to get a surprise movie recommendation based on persona and history.
    """
    try:
        # 1. Fetch user's library stats for context
        watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
        history = db.query(History).filter(History.user_id == current_user.id).all()
        
        excluded_titles = list(set([m.title for m in watchlist + history]))
        
        # 2. Build a context-rich query for the agent
        # Re-using the logic from Persona (though a bit simplified for the prompt)
        context_prompt = (
            f"I am a user with {len(watchlist)} movies in my Vault and {len(history)} movies in my History. "
            f"My favorite genres seem to be represented by these titles: {', '.join(excluded_titles[-5:]) if excluded_titles else 'None yet'}. "
            "GIVE ME ONE absolute surprise recommendation that matches my vibe but isn't something I've already seen. "
            f"EXCLUDE these titles from your search: {', '.join(excluded_titles) if excluded_titles else 'None'}. "
            "Reason why this is a 'surprise' for me and provide it in [METADATA: {...}] format."
        )
        
        logger.info(f"Surprise Me request for {current_user.email}")
        
        response = get_movie_recommendation(
            context_prompt,
            user_context={"email": current_user.email}
        )
        
        return {"response": response}
        
    except Exception as e:
        logger.error(f"Surprise Me Error for {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate a surprise recommendation.")
