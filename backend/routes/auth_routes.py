from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user_model import User
from backend.schemas.auth_schema import UserCreate, UserLogin, UserResponse, Token, ForgotPasswordRequest
from backend.auth.auth_utils import get_password_hash, verify_password, create_access_token
from backend.utils.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    from backend.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info(f"Registering user: {user.email}")
    
    # Password complexity and length are validated by UserCreate (auth_schema.py)
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            logger.warning(f"Registration failed: Email {user.email} already exists")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user.password)
        new_user = User(email=user.email, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"User registered successfully: {user.email}")
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration exception for {user.email}: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred. Please try again later.")

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from backend.utils.logger import get_logger
    logger = get_logger(__name__)
    
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Avoid user enumeration by returning 200 even if user doesn't exist
        return {"message": "If this email is registered, a reset link will be sent shortly."}
    
    # Mock sending email
    logger.info(f"MOCK PASSWORD RESET: Link sent to {body.email} (valid for 1 hour)")
    return {"message": "Success! Check your inbox for the reset link."}
