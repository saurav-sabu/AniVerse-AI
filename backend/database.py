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

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # pool_pre_ping=True is recommended for NeonDB/Postgres to handle connection drops
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
