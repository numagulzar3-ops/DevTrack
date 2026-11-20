
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Registration request
class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


# User information returned by the API
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: str


# Login request
class UserLogin(BaseModel):
    email: EmailStr

    password: str


# JWT token response
class Token(BaseModel):
    access_token: str
    token_type: str
