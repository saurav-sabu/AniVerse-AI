from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.auth.get_user import get_current_user
from backend.models.user_model import User
from backend.models.friendship_model import Friendship
from backend.models.library_model import Watchlist, History
from backend.schemas.friend_schema import FriendshipRequest, FriendProfile
from backend.utils.logger import get_logger
from backend.utils.rate_limit import limiter
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter(prefix="/friends", tags=["friends"])

@router.post("/request/{friend_id}", response_model=FriendshipRequest)
@limiter.limit("5/minute")
def send_friend_request(request: Request, friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Send a friend request to a user.
    """
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    
    # Check if friend exists
    friend = db.query(User).filter(User.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check for existing friendship/request (symmetrical)
    existing = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == current_user.id))
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Friendship or request already exists (Status: {existing.status})")
        
    try:
        new_request = Friendship(
            user_id=current_user.id,
            friend_id=friend_id,
            status="PENDING"
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        return new_request
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to send friend request: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while sending friend request")

@router.get("/requests/pending", response_model=List[FriendshipRequest])
def get_pending_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all incoming pending friend requests.
    """
    requests = db.query(Friendship).filter(
        Friendship.friend_id == current_user.id,
        Friendship.status == "PENDING"
    ).all()
    
    # Attach sender email for display
    for r in requests:
        sender = db.query(User).filter(User.id == r.user_id).first()
        r.sender_email = sender.email if sender else "Unknown"
        
    return requests

@router.post("/requests/{request_id}/accept")
def accept_friend_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Accept a friend request.
    """
    friend_req = db.query(Friendship).filter(Friendship.id == request_id, Friendship.friend_id == current_user.id).first()
    
    if not friend_req:
        raise HTTPException(status_code=404, detail="Friend request not found")
        
    if friend_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request is no longer pending")
        
    try:
        friend_req.status = "ACCEPTED"
        db.commit()
        return {"message": "Friend request accepted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to accept friend request: {e}")
        raise HTTPException(status_code=500, detail="An error occurred")

@router.post("/requests/{request_id}/reject")
def reject_friend_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Reject a friend request.
    """
    friend_req = db.query(Friendship).filter(Friendship.id == request_id, Friendship.friend_id == current_user.id).first()
    
    if not friend_req:
        raise HTTPException(status_code=404, detail="Friend request not found")
        
    try:
        db.delete(friend_req)
        db.commit()
        return {"message": "Friend request rejected"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to reject friend request: {e}")
        raise HTTPException(status_code=500, detail="An error occurred")

@router.get("/list", response_model=List[FriendProfile])
def list_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    List all accepted friends.
    """
    friendships = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) | (Friendship.friend_id == current_user.id)),
        Friendship.status == "ACCEPTED"
    ).all()
    
    friends = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == current_user.id else f.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        if friend_user:
            friends.append({
                "id": friend_user.id,
                "email": friend_user.email,
                "status": "ACCEPTED"
            })
            
    return friends

@router.get("/{friend_id}/library")
def get_friend_library(friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Fetch a friend's library (Watchlist, History, Persona).
    Only allowed if the friendship is ACCEPTED.
    """
    friendship = db.query(Friendship).filter(
        (((Friendship.user_id == current_user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == current_user.id))),
        Friendship.status == "ACCEPTED"
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=403, detail="You can only view the library of accepted friends")
        
    # Fetch Data
    # 1. Watchlist
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == friend_id).all()
    
    # 2. History
    history = db.query(History).filter(History.user_id == friend_id).order_by(History.viewed_at.desc()).limit(10).all()
    
    # 3. Persona
    from backend.utils.persona_engine import calculate_persona
    persona = calculate_persona(db, friend_id)
    
    return {
        "watchlist": watchlist,
        "history": history,
        "persona": persona,
        "profile": {"id": friend.id, "email": friend.email}
    }
