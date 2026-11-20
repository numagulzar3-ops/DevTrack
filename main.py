
from fastapi import FastAPI

from backend.app.database import engine, Base
from backend.app import models
from backend.app.routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DevTrack API",
    description="A project and issue management platform",
    version="1.0.0"
)

# Register API routes
app.include_router(router)


@app.get("/")
def home():
    return {
        "message": "Welcome to DevTrack!",
        "status": "Backend is running successfully"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/db-check")
def database_check():
    try:
        with engine.connect() as connection:
            return {
                "database": "Connected successfully!",
                "status": "healthy"
            }
    except Exception as e:
        return {
            "database": "Connection failed",
            "error": str(e)
        }
