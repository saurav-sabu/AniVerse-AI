from fastapi import APIRouter, HTTPException, Depends
from backend.tools.tmdb_tool import get_movie_trailer
from backend.auth.get_user import get_current_user

router = APIRouter(prefix="/movies", tags=["movies"])

@router.get("/trailer/{tmdb_id}")
async def fetch_trailer(tmdb_id: int, current_user: dict = Depends(get_current_user)):
    """
    Fetch the YouTube trailer key for a given movie.
    """
    try:
        # Use .invoke() for the StructuredTool
        trailer_key = get_movie_trailer(movie_id=tmdb_id)
        if "Error" in trailer_key or "No official trailer" in trailer_key:
            raise HTTPException(status_code=404, detail=trailer_key)
        return {"key": trailer_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
