from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LibraryBase(BaseModel):
    tmdb_id: str
    title: str
    poster_path: Optional[str] = None
    rating: Optional[int] = None
    notes: Optional[str] = None

class LibraryCreate(LibraryBase):
    pass

class HistoryUpdate(BaseModel):
    rating: Optional[int] = None
    notes: Optional[str] = None

class LibraryResponse(LibraryBase):
    id: int
    user_id: int
    added_at: Optional[datetime] = None  # For watchlist
    viewed_at: Optional[datetime] = None # For history

    class Config:
        from_attributes = True
