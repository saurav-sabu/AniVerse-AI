import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user_model import User
from backend.schemas.auth_schema import UserCreate, UserLogin, UserResponse, Token, ForgotPasswordRequest
from backend.auth.auth_utils import get_password_hash, verify_password, create_access_token
from backend.utils.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/auth", tags=["auth"])

from fastapi.responses import JSONResponse

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    from backend.utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info(f"Registering user: {user.email}")
    
    is_production = os.getenv("ENV") == "production"
    logger.debug(f"Cookie Security - Production: {is_production}")
    
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
        
        access_token = create_access_token(data={"sub": new_user.email})
        
        # Explicit Response for cookie reliability
        content = {"id": new_user.id, "email": new_user.email}
        response = JSONResponse(content=content)
        response.set_cookie(
            key="access_token", 
            value=access_token, 
            httponly=True, 
            samesite="lax", 
            secure=is_production, 
            max_age=604800
        )
        
        logger.info(f"User registered successfully: {user.email}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration exception for {user.email}: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    from backend.utils.logger import get_logger
    logger = get_logger(__name__)
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": db_user.email})
    
    # Force secure=False for localhost (Defect 6 Critical Fix)
    is_localhost = any(h in str(request.url) for h in ["localhost", "127.0.0.1"])
    is_production = os.getenv("ENV") == "production" and not is_localhost
    
    logger.debug(f"Login Cookie - Prod: {is_production} | Local: {is_localhost} | Secure: {is_production}")
    
    content = {"access_token": access_token, "token_type": "bearer"}
    response = JSONResponse(content=content)
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        samesite="lax", 
        secure=is_production,
        max_age=604800
    )
    
    return response

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
