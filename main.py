
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database import engine
from backend.app.routes import router

app = FastAPI(
    title="DevTrack API",
    description="A project and issue management platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def home():
    return {
        "message": "Welcome to DevTrack!",
        "status": "Backend is running successfully"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-check")
def database_check():
    try:
        with engine.connect():
            return {
                "database": "Connected successfully!",
                "status": "healthy"
            }
    except Exception as e:
        return {
            "database": "Connection failed",
            "error": str(e)
        }
