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
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('user_id', 'tmdb_id', name='_user_watchlist_uc'),)

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tmdb_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    poster_path = Column(String)
    rating = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Note: For history, we might want to allow duplicates if the user watches multiple times,
    # but the review says "history has no uniqueness check... the same movie can be added unlimited times."
    # Let's add it to be safe if that's what's requested, or maybe a better way is to track views.
    # Actually, the user specifically mentioned issue 19: "Duplicate History Entries Allowed".
    # So I'll add a unique constraint here too.
    __table_args__ = (UniqueConstraint('user_id', 'tmdb_id', name='_user_history_uc'),)
