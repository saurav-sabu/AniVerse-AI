from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.review_model import Review
from backend.schemas.review_schema import ReviewCreate, ReviewUpdate, ReviewResponse
from backend.auth.get_user import get_current_user
from backend.models.user_model import User
from backend.utils.logger import get_logger
from backend.utils.rate_limit import limiter

logger = get_logger(__name__)

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/{tmdb_id}", response_model=List[ReviewResponse])
@limiter.limit("30/minute")
def get_reviews(request: Request, tmdb_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Public endpoint to get reviews for a specific movie/TV show."""
    reviews = db.query(Review).filter(Review.tmdb_id == tmdb_id).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews

@router.post("/", response_model=ReviewResponse)
@limiter.limit("10/minute")
def create_review(request: Request, review: ReviewCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Protected endpoint to create a review."""
    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.tmdb_id == review.tmdb_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this title. Please edit your existing review.")
    
    new_review = Review(
        user_id=current_user.id,
        tmdb_id=review.tmdb_id,
        rating=review.rating,
        content=review.content
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.put("/{review_id}", response_model=ReviewResponse)
@limiter.limit("10/minute")
def update_review(request: Request, review_id: int, review_update: ReviewUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Protected endpoint to edit a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this review")
        
    if review_update.rating is not None:
        review.rating = review_update.rating
    if review_update.content is not None:
        review.content = review_update.content
        
    db.commit()
    db.refresh(review)
    return review

@router.delete("/{review_id}")
def delete_review(review_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Protected endpoint to delete a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
        
    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}
