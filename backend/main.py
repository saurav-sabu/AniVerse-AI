import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routes import auth_routes, recommendation_routes, library_routes, movie_routes
from backend.utils.logger import get_logger
from backend.utils.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

logger = get_logger(__name__)

# Validate environment variables
REQUIRED_ENV_VARS = [
    "TMDB_API_KEY",
    "GROQ_API_KEY",
    "SECRET_KEY",
]

missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    logger.critical(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.critical("Backend startup aborted. Please check your .env file.")
    sys.exit(1)

# Initialize Database - Creates tables if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Database initialization failed: {e}")
    sys.exit(1)

app = FastAPI(title="CineSync AI API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for Next.js frontend
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(library_routes.router)
app.include_router(movie_routes.router)

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
