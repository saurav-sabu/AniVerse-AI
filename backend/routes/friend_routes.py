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
        if existing.status == "REJECTED":
            # Allow re-sending if it was rejected previously by resetting it
            existing.status = "PENDING"
            existing.user_id = current_user.id # Current user becomes the sender
            existing.friend_id = friend_id
            existing.created_at = datetime.utcnow()
            db.commit()
            return existing
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
@limiter.limit("10/minute")
def get_pending_requests(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all incoming pending friend requests.
    """
    requests = db.query(Friendship).filter(
        Friendship.friend_id == current_user.id,
        Friendship.status == "PENDING"
    ).all()
    
    if not requests:
        return []

    # Batch query users to avoid N+1 (Defect 4 & 5)
    sender_ids = [r.user_id for r in requests]
    senders = db.query(User).filter(User.id.in_(sender_ids)).all()
    user_map = {u.id: u.email for u in senders}
    
    result = []
    for r in requests:
        result.append(FriendshipRequest(
            id=r.id,
            user_id=r.user_id,
            friend_id=r.friend_id,
            status=r.status,
            created_at=r.created_at,
            sender_email=user_map.get(r.user_id, "Unknown")
        ))
        
    return result

@router.post("/requests/{request_id}/accept")
@limiter.limit("10/minute")
def accept_friend_request(request: Request, request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
@limiter.limit("10/minute")
def reject_friend_request(request: Request, request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Reject a friend request (Defect 2).
    """
    friend_req = db.query(Friendship).filter(Friendship.id == request_id, Friendship.friend_id == current_user.id).first()
    
    if not friend_req:
        raise HTTPException(status_code=404, detail="Friend request not found")
        
    try:
        friend_req.status = "REJECTED"
        db.commit()
        return {"message": "Friend request rejected"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to reject friend request: {e}")
        raise HTTPException(status_code=500, detail="An error occurred")

@router.get("/list", response_model=List[FriendProfile])
@limiter.limit("20/minute")
def list_friends(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    List all accepted friends (Defect 4).
    """
    friendships = db.query(Friendship).filter(
        ((Friendship.user_id == current_user.id) | (Friendship.friend_id == current_user.id)),
        Friendship.status == "ACCEPTED"
    ).all()
    
    if not friendships:
        return []

    # Batch query users to avoid N+1
    friend_ids = [f.friend_id if f.user_id == current_user.id else f.user_id for f in friendships]
    friend_users = db.query(User).filter(User.id.in_(friend_ids)).all()
    user_map = {u.id: u for u in friend_users}
    
    result = []
    for fid in friend_ids:
        friend_user = user_map.get(fid)
        if friend_user:
            result.append(FriendProfile(
                id=friend_user.id,
                email=friend_user.email,
                status="ACCEPTED"
            ))
            
    return result

@router.delete("/{friend_id}")
@limiter.limit("10/minute")
def remove_friend(request: Request, friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Unfriend an accepted friend (Defect 7).
    """
    friendship = db.query(Friendship).filter(
        (((Friendship.user_id == current_user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == current_user.id))),
        Friendship.status == "ACCEPTED"
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    try:
        db.delete(friendship)
        db.commit()
        return {"message": "Friend removed"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to remove friend: {e}")
        raise HTTPException(status_code=500, detail="An error occurred")

@router.get("/{friend_id}/library")
@limiter.limit("10/minute")
def get_friend_library(request: Request, friend_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

    # Fetch User Profile (Defect 1)
    friend_user = db.query(User).filter(User.id == friend_id).first()
    if not friend_user:
        raise HTTPException(status_code=404, detail="User not found")
        
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
        "profile": {"id": friend_user.id, "email": friend_user.email}
    }
