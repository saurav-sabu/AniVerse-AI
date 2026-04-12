from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from backend.database import Base

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tmdb_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    poster_path = Column(String)
    genres = Column(String, nullable=True) # Comma-separated or JSON string for N+1 optimization
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('user_id', 'tmdb_id', name='_user_watchlist_uc'),)

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tmdb_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    poster_path = Column(String)
    genres = Column(String, nullable=True)
    rating = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Ensure unique history entries per user/movie
    __table_args__ = (UniqueConstraint('user_id', 'tmdb_id', name='_user_history_uc'),)
