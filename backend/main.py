import os
import sys
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, get_db
from backend.routes import auth_routes, recommendation_routes, library_routes, movie_routes, user_routes, friend_routes
from backend.utils.logger import get_logger
from backend.utils.rate_limit import limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

logger = get_logger(__name__)

# Validate environment variables (P0.3: Skip if TESTING=true)
REQUIRED_ENV_VARS = [
    "TMDB_API_KEY",
    "GROQ_API_KEY",
    "SECRET_KEY",
]

is_testing = os.getenv("TESTING", "false").lower() == "true"
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]

if missing_vars and not is_testing:
    logger.critical(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.critical("Backend startup aborted. Please check your .env file.")
    sys.exit(1)
elif missing_vars and is_testing:
    logger.warning("Environment validation skipped in TESTING mode.")

# Initialize Database - Only in dev mode or if forced
if not is_testing and os.getenv("ENV") != "production":
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully (Development).")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)
else:
    logger.info("Database initialization skipped (Production/Testing).")

app = FastAPI(title="CineSync AI API")

# Defect 2: Add SlowAPIMiddleware for rate limiting to work
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Enable CORS for Next.js frontend
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
# Clean origins: handle both commas and spaces (DEF-049/051)
allowed_origins = [origin.strip() for origin in allowed_origins_env.replace(",", " ").split() if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Defect 11: Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Environment-aware CSP (Defect 11 Recovery)
    env = os.getenv("ENV", "development").lower()
    script_src = "'self' 'unsafe-inline' https://cdn.jsdelivr.net"
    if env != "production":
        script_src += " 'unsafe-eval'"  # Required for some dev tools/HMR
        
    # Crucial: Allow connections to the backend API explicitly (DEF-051 Fix)
    origin_list = " ".join(allowed_origins)
    if env == "production":
        connect_sources = f"'self' {origin_list}"
    else:
        connect_sources = f"'self' http://localhost:8000 http://127.0.0.1:8000 http://localhost:3000 {origin_list}"

    response.headers["Content-Security-Policy"] = (
        f"default-src 'self'; "
        f"connect-src {connect_sources}; "
        f"img-src 'self' data: https://image.tmdb.org https://images.unsplash.com https://fastapi.tiangolo.com; "
        f"script-src {script_src}; "
        f"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        f"font-src 'self' https://fonts.gstatic.com;"
    )

    return response

# Include Routers
app.include_router(auth_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(library_routes.router)
app.include_router(movie_routes.router)
app.include_router(user_routes.router)
app.include_router(friend_routes.router)

# Global Exception Handler (DEF-040)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

@app.get("/health")
async def health(db: Session = Depends(get_db)):
    """
    Health check using the pool-managed get_db dependency (DEF-059).
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
