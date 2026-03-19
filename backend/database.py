import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # Fallback or placeholder for development
    SQLALCHEMY_DATABASE_URL = "sqlite:///./temp_db.db"

engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

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
