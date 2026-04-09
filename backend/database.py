import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
IS_TESTING = os.getenv("TESTING", "false").lower() == "true"
ENV = os.getenv("ENV", "development").lower()

if not SQLALCHEMY_DATABASE_URL:
    if ENV == "production" and not IS_TESTING:
        raise ValueError("DATABASE_URL must be set in production environment.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./temp_db.db"

engine_kwargs = {}

if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = int(os.getenv("DB_POOL_SIZE", "5"))
    engine_kwargs["max_overflow"] = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    engine_kwargs["pool_timeout"] = 30
    engine_kwargs["pool_recycle"] = 1800  # Recycle connections every 30 minutes
elif SQLALCHEMY_DATABASE_URL and "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}


engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# Dependency to get db session
def get_db():
    from backend.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.debug("get_db: Initializing session")
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"get_db: Session error: {e}")
        raise
    finally:
        logger.debug("get_db: Closing session")
        db.close()
