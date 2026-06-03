from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import models  # noqa: ensure models are registered
from app.routers import projects, uploads, stages

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CivilNobre - Diário de Obra", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(uploads.router)
app.include_router(stages.router)


@app.get("/health")
def health():
    return {"status": "ok", "app": "CivilNobre"}
