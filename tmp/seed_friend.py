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
    # Check if exists (respecting the user_id < friend_id check constraint)
    u_id, f_id = sorted([audit.id, test.id])
    f = db.query(Friendship).filter(Friendship.user_id == u_id, Friendship.friend_id == f_id).first()
    if not f:
        f = Friendship(user_id=u_id, friend_id=f_id, sender_id=audit.id, status="ACCEPTED")
        db.add(f)
        db.commit()
        print(f"Created friendship between {u_id} and {f_id}")
    else:
        f.status = "ACCEPTED"
        db.commit()
        print(f"Updated friendship between {audit.id} and {test.id} to ACCEPTED")
db.close()
