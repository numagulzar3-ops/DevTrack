
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# USER SCHEMAS

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# PROJECT SCHEMAS

class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    status: str
    owner_id: int
    created_at: datetime


# TASK SCHEMAS

class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    due_date: Optional[datetime] = None


TaskStatus = Literal["todo", "in_progress", "done"]


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    priority: Optional[str] = Field(
        default=None,
        pattern="^(low|medium|high)$"
    )
    completed: Optional[bool] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    priority: str
    completed: bool
    status: TaskStatus
    due_date: Optional[datetime]
    project_id: int
    created_at: datetime


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    subject: str
    created_at: datetime
