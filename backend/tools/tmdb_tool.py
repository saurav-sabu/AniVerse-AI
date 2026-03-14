import os
import requests
from langchain_core.tools import tool
from backend.utils.logger import get_logger
from dotenv import load_dotenv

load_dotenv()
logger = get_logger(__name__)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"

@tool
def search_tmdb_movies(query: str) -> str:
    """
    Search for movies on TMDB based on a text query.
    Returns a formatted string containing titles, release dates, and overviews of matching movies.
    """
    if not TMDB_API_KEY:
        logger.error("TMDB_API_KEY not found in environment variables.")
        return "Error: TMDB API key is missing. Please configure it in the .env file."

    logger.info(f"Searching TMDB for: {query}")
    
    endpoint = f"{BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": query,
        "language": "en-US",
        "page": 1,
        "include_adult": False
    }

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        if not results:
            return f"No movies found for query: '{query}'"

        formatted_results = []
        for movie in results[:5]:  # Limit to top 5 results
            title = movie.get("title", "N/A")
            movie_id = movie.get("id", "N/A")
            release_date = movie.get("release_date", "N/A")
            overview = movie.get("overview", "No description available.")
            poster_path = movie.get("poster_path")
            backdrop_path = movie.get("backdrop_path")
            
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
            backdrop_url = f"https://image.tmdb.org/t/p/original{backdrop_path}" if backdrop_path else None
            
            formatted_results.append(
                f"Title: {title} (ID: {movie_id})\n"
                f"Release Date: {release_date}\n"
                f"Overview: {overview}\n"
                f"Poster: {poster_url}\n"
                f"Backdrop: {backdrop_url}\n"
            )

        return "\n---\n".join(formatted_results)

    except requests.exceptions.RequestException as e:
        logger.error(f"TMDB API request failed: {e}")
        return f"Error connecting to TMDB API: {str(e)}"

@tool
def get_movie_watch_providers(movie_id: int) -> str:
    """
    Get the watch providers (streaming, rent, buy) for a specific movie by its TMDB ID.
    Returns a formatted string of providers available in the US.
    """
    if not TMDB_API_KEY:
        return "Error: TMDB API key is missing."

    logger.info(f"Fetching watch providers for movie ID: {movie_id}")
    
    endpoint = f"{BASE_URL}/movie/{movie_id}/watch/providers"
    params = {"api_key": TMDB_API_KEY}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", {})
        us_providers = results.get("US", {})  # Defaulting to US region
        
        if not us_providers:
            return "No watch provider information available for this movie in the US."

        output = []
        
        if "flatrate" in us_providers:
            streaming = [p["provider_name"] for p in us_providers["flatrate"]]
            output.append(f"Streaming on: {', '.join(streaming)}")
        
        if "rent" in us_providers:
            rent = [p["provider_name"] for p in us_providers["rent"]]
            output.append(f"Available to Rent on: {', '.join(rent)}")
            
        if "buy" in us_providers:
            buy = [p["provider_name"] for p in us_providers["buy"]]
            output.append(f"Available to Buy on: {', '.join(buy)}")

        return "\n".join(output) if output else "No common streaming/rental providers found."

    except requests.exceptions.RequestException as e:
        logger.error(f"TMDB Watch Providers API failed: {e}")
        return f"Error fetching watch providers: {str(e)}"

@tool
def get_movie_reviews(movie_id: int) -> str:
    """
    Get a summary of user reviews for a specific movie by its TMDB ID.
    Returns a formatted string containing snippets from top reviews to help understand the 'vibe'.
    """
    if not TMDB_API_KEY:
        return "Error: TMDB API key is missing."

    logger.info(f"Fetching reviews for movie ID: {movie_id}")
    
    endpoint = f"{BASE_URL}/movie/{movie_id}/reviews"
    params = {"api_key": TMDB_API_KEY, "language": "en-US", "page": 1}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        if not results:
            return "No user reviews available for this movie."

        formatted_reviews = []
        positive_keywords = ["great", "amazing", "masterpiece", "loved", "excellent", "best", "brilliant", "gripping"]
        scores = []

        for review in results[:3]:
            content = review.get("content", "").lower()
            # Basic sentiment scoring
            pos_hits = sum(1 for word in positive_keywords if word in content)
            scores.append(pos_hits)
            
            snippet = (review.get("content", "")[:300] + '...') if len(review.get("content", "")) > 300 else review.get("content", "")
            formatted_reviews.append(f"Review: \"{snippet}\"")

        avg_positivity = sum(scores) / len(scores) if scores else 0
        vibe_score = "Highly Acclaimed" if avg_positivity > 2 else "Solid Vibe" if avg_positivity > 0.5 else "Mixed Reactions"

        return f"Vibe Score: {vibe_score}\n\n" + "\n\n".join(formatted_reviews)

    except requests.exceptions.RequestException as e:
        logger.error(f"TMDB Reviews API failed: {e}")
        return f"Error fetching movie reviews: {str(e)}"

def get_movie_trailer(movie_id: int) -> str:
    """
    Get the YouTube video ID for the official trailer of a movie by its TMDB ID.
    Returns the YouTube key (e.g., 'dQw4w9WgXcQ') or a message if none found.
    """
    if not TMDB_API_KEY:
        return "Error: TMDB API key is missing."

    logger.info(f"Fetching trailer for movie ID: {movie_id}")
    
    endpoint = f"{BASE_URL}/movie/{movie_id}/videos"
    params = {"api_key": TMDB_API_KEY, "language": "en-US"}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        # Look for "Trailer" of type "YouTube"
        trailers = [r for r in results if r.get("site") == "YouTube" and (r.get("type") == "Trailer" or r.get("type") == "Teaser")]
        
        if not trailers:
            return "No official trailer found on YouTube for this movie."

        # Prefer "Trailer" over "Teaser"
        official_trailer = next((t for t in trailers if t.get("type") == "Trailer"), trailers[0])
        return official_trailer.get("key", "")

    except requests.exceptions.RequestException as e:
        logger.error(f"TMDB Videos API failed: {e}")
        return f"Error fetching movie trailer: {str(e)}"

def get_movie_details(movie_id: int) -> dict:
    """
    Get detailed information for a specific movie by its TMDB ID, including genres.
    Returns a dictionary of movie details.
    """
    if not TMDB_API_KEY:
        return {"error": "TMDB API key is missing."}

    logger.info(f"Fetching details for movie ID: {movie_id}")
    
    endpoint = f"{BASE_URL}/movie/{movie_id}"
    params = {"api_key": TMDB_API_KEY, "language": "en-US"}

    try:
        response = requests.get(endpoint, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"TMDB Details API failed: {e}")
        return {"error": str(e)}
