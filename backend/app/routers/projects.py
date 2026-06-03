from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.database import get_db
from app.models.models import Project
from app.services.schedule_service import seed_default_stages

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    address: Optional[str] = ""
    start_date: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("")
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@router.post("")
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    start = payload.start_date or date.today().isoformat()
    project = Project(
        name=payload.name,
        address=payload.address or "",
        start_date=start,
        overall_progress=0.0,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    seed_default_stages(db, project.id, date.fromisoformat(start))
    return project


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return p


@router.put("/{project_id}")
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    for k, v in payload.dict(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    db.delete(p)
    db.commit()
    return {"ok": True}
