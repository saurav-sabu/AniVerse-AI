import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
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

# Initialize Database - Creates tables if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    if not is_testing:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

app = FastAPI(title="CineSync AI API")

# Defect 2: Add SlowAPIMiddleware for rate limiting to work
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Enable CORS for Next.js frontend
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

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
        
    # Crucial: Allow connections to the backend API explicitly (Defect 11 Recovery)
    response.headers["Content-Security-Policy"] = (
        f"default-src 'self'; "
        f"connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 {os.getenv('ALLOWED_ORIGINS', '')}; "
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

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
