from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from backend.schemas.user_schema import UserPublic

class FriendshipRequest(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    created_at: datetime
    sender_email: Optional[str] = None

    class Config:
        from_attributes = True

class FriendProfile(BaseModel):
    id: int
    email: str
    status: str
