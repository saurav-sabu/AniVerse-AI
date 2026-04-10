from sqlalchemy import text
from backend.database import SessionLocal

def run_migration():
    print("Starting robust database migration...")
    db = SessionLocal()
    try:
        # 1. Add sender_id column if it doesn't exist
        print("Step 1: Adding sender_id column...")
        try:
            db.execute(text("ALTER TABLE friendships ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE;"))
            db.commit()
            print("  - sender_id added or already exists.")
        except Exception as e:
            db.rollback()
            print(f"  - Error adding column: {e}")

        # 2. Data Cleanup: Swap IDs to ensure user_id < friend_id
        print("Step 2: Cleaning up existing data (sorting IDs)...")
        try:
            # Swap user_id and friend_id where user_id > friend_id
            db.execute(text("""
                UPDATE friendships 
                SET user_id = friend_id, friend_id = user_id 
                WHERE user_id > friend_id;
            """))
            # Delete duplicates that might have been created by the swap
            db.execute(text("""
                DELETE FROM friendships a USING friendships b
                WHERE a.id < b.id 
                AND a.user_id = b.user_id 
                AND a.friend_id = b.friend_id;
            """))
            db.commit()
            print("  - Data cleaned and sorted.")
        except Exception as e:
            db.rollback()
            print(f"  - Error cleaning data: {e}")

        # 3. Add CheckConstraint
        print("Step 3: Adding CheckConstraint...")
        try:
            db.execute(text("ALTER TABLE friendships ADD CONSTRAINT _ordered_friendship_ck CHECK (user_id < friend_id);"))
            db.commit()
            print("  - CheckConstraint added.")
        except Exception as e:
            db.rollback()
            # If it already exists, this is fine
            if "already exists" in str(e).lower():
                print("  - CheckConstraint already exists.")
            else:
                print(f"  - Error adding CheckConstraint: {e}")

        # 4. Add genres column to watchlist
        print("Step 4: Adding genres column to watchlist...")
        try:
            db.execute(text("ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS genres VARCHAR;"))
            db.commit()
            print("  - genres column added to watchlist.")
        except Exception as e:
            db.rollback()
            print(f"  - Error adding genres to watchlist: {e}")

        # 5. Add genres column to history
        print("Step 5: Adding genres column to history...")
        try:
            db.execute(text("ALTER TABLE history ADD COLUMN IF NOT EXISTS genres VARCHAR;"))
            db.commit()
            print("  - genres column added to history.")
        except Exception as e:
            db.rollback()
            print(f"  - Error adding genres to history: {e}")

        print("All migration steps processed.")
    except Exception as e:
        print(f"Unexpected migration error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
