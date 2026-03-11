from passlib.context import CryptContext
import traceback

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    password = "password123"
    print(f"Hashing password: {password}")
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    
    # Try a very long password to see if it triggers the same error
    long_password = "a" * 80
    print(f"Hashing long password (80 chars): {long_password}")
    try:
        hashed_long = pwd_context.hash(long_password)
        print(f"Long hashed: {hashed_long}")
    except Exception as e:
        print(f"Caught expected? error for long password: {e}")

except Exception as e:
    print(f"Error during diagnostic: {e}")
    traceback.print_exc()
