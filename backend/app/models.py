
from sqlalchemy import Column, Integer, String, DateTime, func
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    # Unique identifier for every user
    id = Column(Integer, primary_key=True, index=True)

    # User's full name
    full_name = Column(String(100), nullable=False)

    # Email must be unique
    email = Column(String(255), unique=True, nullable=False, index=True)

    # We will store hashed passwords, NEVER plain passwords
    password_hash = Column(String(255), nullable=False)

    # User permissions: admin or member
    role = Column(String(20), default="member", nullable=False)

    # Automatically records account creation time
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
