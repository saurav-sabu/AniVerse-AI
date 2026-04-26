from fastapi import APIRouter, HTTPException, Depends
from backend.tools.tmdb_tool import (
    get_movie_trailer, get_movie_details, get_movie_credits,
    get_person_details, get_person_movie_credits,
    get_top_rated_movies, get_trending_movies, search_multi_media,
    get_movie_recommendations_json, get_movie_watch_providers_json, get_movie_images_json
)
from backend.auth.get_user import get_current_user
from backend.models.user_model import User
from backend.utils.logger import get_logger

logger = get_logger(__name__)


from backend.utils.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/movies", tags=["movies"])

@router.get("/trailer/{tmdb_id}")
@limiter.limit("15/minute")
def fetch_trailer(request: Request, tmdb_id: str, current_user: User = Depends(get_current_user)):
    """
    Fetch the YouTube trailer key for a given movie.
    """
    try:
        # Use .invoke() for the StructuredTool
        trailer_key = get_movie_trailer(movie_id=tmdb_id)
        if "Error" in trailer_key or "No official trailer" in trailer_key:
            raise HTTPException(status_code=404, detail=trailer_key)
        return {"key": trailer_key}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trailer fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trailer information from external source.")

@router.get("/trending")
@limiter.limit("30/minute")
def fetch_trending_movies(request: Request, time_window: str = "day"):
    try:
        data = get_trending_movies(time_window=time_window)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top_rated")
@limiter.limit("30/minute")
def fetch_top_rated_movies(request: Request, page: int = 1):
    try:
        data = get_top_rated_movies(page=page)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details/{tmdb_id}")
@limiter.limit("30/minute")
def fetch_movie_details(request: Request, tmdb_id: int):
    try:
        data = get_movie_details(movie_id=tmdb_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/credits/{tmdb_id}")
@limiter.limit("30/minute")
def fetch_movie_credits(request: Request, tmdb_id: int):
    try:
        data = get_movie_credits(movie_id=tmdb_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/person/{person_id}")
@limiter.limit("30/minute")
def fetch_person_details(request: Request, person_id: int):
    try:
        data = get_person_details(person_id=person_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/person/{person_id}/credits")
@limiter.limit("30/minute")
def fetch_person_credits(request: Request, person_id: int):
    try:
        data = get_person_movie_credits(person_id=person_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
@limiter.limit("60/minute")
def search_media(request: Request, query: str, page: int = 1):
    try:
        data = search_multi_media(query=query, page=page)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details/{tmdb_id}/recommendations")
@limiter.limit("30/minute")
def fetch_movie_recommendations(request: Request, tmdb_id: int):
    try:
        data = get_movie_recommendations_json(movie_id=tmdb_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details/{tmdb_id}/providers")
@limiter.limit("30/minute")
def fetch_movie_providers(request: Request, tmdb_id: int):
    try:
        data = get_movie_watch_providers_json(movie_id=tmdb_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details/{tmdb_id}/images")
@limiter.limit("30/minute")
def fetch_movie_images(request: Request, tmdb_id: int):
    try:
        data = get_movie_images_json(movie_id=tmdb_id)
        if "error" in data:
            raise HTTPException(status_code=500, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
