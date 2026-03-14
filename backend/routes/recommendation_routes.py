from fastapi import APIRouter, Depends, HTTPException
from backend.schemas.movie_schema import RecommendRequest, RecommendResponse
from backend.agent import get_movie_recommendation
from backend.auth.get_user import get_current_user
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["recommendations"])

@router.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest, current_user = Depends(get_current_user)):
    """
    Endpoint to get movie recommendations from the agent.
    Requires a valid JWT token.
    """
    try:
        logger.info(f"API Request from {current_user.email}: {request.query}")
        
        # Convert history format
        formatted_history = []
        if request.history:
            formatted_history = [(m.role, m.content) for m in request.history]
        
        response = get_movie_recommendation(
            request.query, 
            history=formatted_history,
            user_context={"email": current_user.email}
        )
        return {"response": response}
        
    except Exception as e:
        logger.error(f"API Error for {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
