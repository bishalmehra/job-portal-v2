import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import connect_db, close_db
from routers import auth, jobs, host, applications

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="Job Portal API",
    description="Backend for Job Portal — user job search & host job management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth", tags=["Auth"])
app.include_router(jobs.router,         prefix="/api/jobs", tags=["Jobs (User)"])
app.include_router(host.router,         prefix="/api/host", tags=["Host"])
app.include_router(applications.router, prefix="/api",      tags=["Applications"])

@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "Job Portal API is running"}