from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
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
    # Exclude users who are already friends or have a pending/rejected request (Defect 14)
    from backend.models.friendship_model import Friendship
    
    # Simple, direct query to get all related IDs
    id_list_1 = db.query(Friendship.friend_id).filter(Friendship.user_id == current_user.id).all()
    id_list_2 = db.query(Friendship.user_id).filter(Friendship.friend_id == current_user.id).all()
    
    related_ids = set([r[0] for r in id_list_1] + [r[0] for r in id_list_2])
    related_ids.add(current_user.id) # Safety check: exclude self again
    
    users_query = db.query(User).filter(User.email.ilike(f"%{q}%"))
    if related_ids:
        users_query = users_query.filter(~User.id.in_(list(related_ids)))
        
    users = users_query.limit(10).all()
    
    return users
