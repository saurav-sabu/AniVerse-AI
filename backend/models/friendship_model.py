from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint, CheckConstraint
from sqlalchemy.sql import func
from backend.database import Base

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) # Tracks who initiated
    status = Column(String, default="PENDING") # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Ensure we don't have duplicate friendship entries
    __table_args__ = (
        UniqueConstraint('user_id', 'friend_id', name='_user_friend_uc'),
        # Defect 34: Ensure user_id < friend_id to prevent bidirectional duplicates
        CheckConstraint('user_id < friend_id', name='_ordered_friendship_ck'),
    )


