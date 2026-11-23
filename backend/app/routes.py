
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.app.dependencies import (
    get_db,
    get_current_user,
    get_admin_user
)
from backend.app.models import ActivityEvent, User, Project, Task
from backend.app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    ProjectCreate,
    ProjectResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    ActivityResponse,
)
from backend.app.security import hash_password, verify_password
from backend.app.auth import create_access_token


router = APIRouter()


# -------------------------
# AUTHENTICATION
# -------------------------

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


@router.post("/login", response_model=Token)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user or not verify_password(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# -------------------------
# PROJECT ENDPOINTS
# -------------------------

@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user.id
    )

    db.add(new_project)
    db.flush()
    db.add(ActivityEvent(owner_id=current_user.id, action="project_created", subject=new_project.name, project_id=new_project.id))
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get("/projects", response_model=list[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(
        Project.owner_id == current_user.id
    ).order_by(Project.created_at.desc()).all()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project(project_id, db, current_user)
    if (project.name, project.description) != (project_data.name, project_data.description):
        project.name = project_data.name
        project.description = project_data.description
        db.add(ActivityEvent(owner_id=current_user.id, action="project_updated", subject=project.name, project_id=project.id))
        db.commit()
        db.refresh(project)
    return project


@router.delete(
    "/projects/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    db.add(ActivityEvent(owner_id=current_user.id, action="project_deleted", subject=project.name, project_id=project.id))
    db.delete(project)
    db.commit()


# -------------------------
# TASK ENDPOINTS
# -------------------------

@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_task(
    project_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        due_date=task_data.due_date,
        project_id=project.id
    )

    db.add(new_task)
    db.add(ActivityEvent(owner_id=current_user.id, action="task_created", subject=new_task.title, project_id=project.id))
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get(
    "/projects/{project_id}/tasks",
    response_model=list[TaskResponse]
)
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return db.query(Task).filter(
        Task.project_id == project.id
    ).order_by(Task.created_at.desc()).all()


@router.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Task).join(Project).filter(
        Project.owner_id == current_user.id
    ).order_by(Task.created_at.desc(), Task.id.desc()).all()


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.owner_id == current_user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    updates = task_data.model_dump(exclude_unset=True)
    for field in ("title", "priority", "completed", "status"):
        if field in updates and updates[field] is None:
            raise HTTPException(status_code=422, detail=f"{field} cannot be null")

    if "status" in updates:
        completed = updates["status"] == "done"
        if "completed" in updates and updates["completed"] != completed:
            raise HTTPException(status_code=422, detail="Task status and completion disagree")
        updates["completed"] = completed
    elif "completed" in updates and task.completed != updates["completed"]:
        updates["status"] = "done" if updates["completed"] else "todo"


    changed_fields = {
        field: value for field, value in updates.items()
        if getattr(task, field) != value
    }
    for field, value in changed_fields.items():
        setattr(task, field, value)

    if changed_fields:
        action = "task_updated"
        if "completed" in changed_fields:
            action = "task_completed" if task.completed else "task_reopened"
        db.add(ActivityEvent(owner_id=current_user.id, action=action, subject=task.title, project_id=task.project_id))

    db.commit()
    db.refresh(task)

    return task


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Project)
        .filter(
            Task.id == task_id,
            Project.owner_id == current_user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    db.add(ActivityEvent(owner_id=current_user.id, action="task_deleted", subject=task.title, project_id=task.project_id))
    db.delete(task)
    db.commit()


@router.get("/activity", response_model=list[ActivityResponse])
def get_activity(
    kind: Literal["project", "task"] | None = None,
    project_id: int | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = db.query(ActivityEvent).filter(ActivityEvent.owner_id == current_user.id)
    if project_id is not None:
        get_project(project_id, db, current_user)
        events = events.filter(ActivityEvent.project_id == project_id)
    if kind is not None:
        events = events.filter(ActivityEvent.action.startswith(f"{kind}_", autoescape=True))
    return events.order_by(
        ActivityEvent.created_at.desc(), ActivityEvent.id.desc()
    ).limit(limit).all()


# -------------------------
# ADMIN DASHBOARD
# -------------------------

@router.get("/admin/dashboard")
def admin_dashboard(
    admin_user: User = Depends(get_admin_user)
):
    return {
        "message": "Welcome to the DevTrack Admin Dashboard!",
        "admin": admin_user.full_name,
        "role": admin_user.role
    }
