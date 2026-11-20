
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.app.dependencies import (
    get_db,
    get_current_user,
    get_admin_user
)
from backend.app.models import User
from backend.app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token
)
from backend.app.security import hash_password, verify_password
from backend.app.auth import create_access_token


router = APIRouter()


# USER REGISTRATION
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered"
        )

    return new_user


# USER LOGIN
@router.post(
    "/login",
    response_model=Token
)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    # Find the user by email
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    # Verify the password
    if not user or not verify_password(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Generate JWT access token
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



# GET CURRENT AUTHENTICATED USER
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user



# ADMIN-ONLY DASHBOARD
@router.get("/admin/dashboard")
def admin_dashboard(
    admin_user: User = Depends(get_admin_user)
):
    return {
        "message": "Welcome to the DevTrack Admin Dashboard!",
        "admin": admin_user.full_name,
        "role": admin_user.role
    }
