from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewBase(BaseModel):
    tmdb_id: str
    rating: float = Field(..., ge=1, le=10)
    content: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=1, le=10)
    content: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    user_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
