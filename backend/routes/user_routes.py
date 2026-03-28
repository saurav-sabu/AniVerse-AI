from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from backend.database import get_db
from backend.auth.get_user import get_current_user
from backend.models.user_model import User
from backend.schemas.user_schema import UserPublic
from backend.utils.rate_limit import limiter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/search", response_model=List[UserPublic])
@limiter.limit("20/minute")
def search_users(request: Request, q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Search for users by email.
    Excludes the current user from results.
    """
    if len(q) < 3:
        return []
    
    users = db.query(User).filter(
        User.email.ilike(f"%{q}%"),
        User.id != current_user.id
    ).limit(10).all()
    
    return users
