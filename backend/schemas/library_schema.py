from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class LibraryBase(BaseModel):
    tmdb_id: str
    title: str
    poster_path: Optional[str] = None
    genres: Optional[str] = None # Comma-separated genre names
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = Field(None, max_length=2000)

class LibraryCreate(LibraryBase):
    pass

class HistoryUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = Field(None, max_length=2000)

class LibraryResponse(LibraryBase):
    id: int
    user_id: int
    added_at: Optional[datetime] = None  # For watchlist
    viewed_at: Optional[datetime] = None # For history

    model_config = ConfigDict(from_attributes=True)
