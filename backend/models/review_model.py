from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from backend.database import Base
from datetime import datetime, timezone

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tmdb_id = Column(String, nullable=False, index=True) # TMDB ID of the movie/tv show
    rating = Column(Float, nullable=False) # 1-10 scale
    content = Column(String, nullable=True) # The review text
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
