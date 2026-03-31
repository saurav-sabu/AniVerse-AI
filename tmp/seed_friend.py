from backend.database import SessionLocal
from backend.models.user_model import User
from backend.models.friendship_model import Friendship

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"{u.id}: {u.email}")

# Seed a friendship between audit_user and test_user
audit = db.query(User).filter(User.email == "audit_user@example.com").first()
test = db.query(User).filter(User.email == "test@example.com").first()

if audit and test:
    # Check if exists
    f = db.query(Friendship).filter(Friendship.user_id == audit.id, Friendship.friend_id == test.id).first()
    if not f:
        f = Friendship(user_id=audit.id, friend_id=test.id, status="ACCEPTED")
        db.add(f)
        db.commit()
        print(f"Created friendship between {audit.id} and {test.id}")
    else:
        f.status = "ACCEPTED"
        db.commit()
        print(f"Updated friendship between {audit.id} and {test.id} to ACCEPTED")
db.close()
