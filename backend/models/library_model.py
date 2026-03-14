from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tmdb_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    poster_path = Column(String)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tmdb_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    poster_path = Column(String)
    rating = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())
