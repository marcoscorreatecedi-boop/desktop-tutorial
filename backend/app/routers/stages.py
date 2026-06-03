import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import Stage, Project

router = APIRouter(prefix="/api/stages", tags=["stages"])


def stage_to_dict(s: Stage) -> dict:
    return {
        "id": s.id,
        "project_id": s.project_id,
        "name": s.name,
        "order_num": s.order_num,
        "dependencies": json.loads(s.dependencies or "[]"),
        "planned_start": s.planned_start,
        "planned_end": s.planned_end,
        "actual_start": s.actual_start,
        "actual_end": s.actual_end,
        "duration_days": s.duration_days,
        "progress": s.progress,
        "is_critical": s.is_critical,
        "status": s.status,
        "early_start": s.early_start,
        "early_finish": s.early_finish,
        "late_start": s.late_start,
        "late_finish": s.late_finish,
        "float_time": s.float_time,
    }


@router.get("")
def list_stages(project_id: int, db: Session = Depends(get_db)):
    stages = db.query(Stage).filter(Stage.project_id == project_id).order_by(Stage.order_num).all()
    return [stage_to_dict(s) for s in stages]


@router.get("/critical-path")
def get_critical_path(project_id: int, db: Session = Depends(get_db)):
    stages = db.query(Stage).filter(
        Stage.project_id == project_id,
        Stage.is_critical == True,
    ).order_by(Stage.order_num).all()
    return [stage_to_dict(s) for s in stages]


class StageUpdate(BaseModel):
    progress: Optional[float] = None
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None
    status: Optional[str] = None


@router.put("/{stage_id}")
def update_stage(stage_id: int, payload: StageUpdate, db: Session = Depends(get_db)):
    stage = db.query(Stage).filter(Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Etapa não encontrada")

    for k, v in payload.dict(exclude_none=True).items():
        setattr(stage, k, v)

    # Sync project overall progress
    stages = db.query(Stage).filter(Stage.project_id == stage.project_id).all()
    avg = sum(s.progress for s in stages) / len(stages)
    project = db.query(Project).filter(Project.id == stage.project_id).first()
    if project:
        project.overall_progress = round(avg, 1)

    db.commit()
    db.refresh(stage)
    return stage_to_dict(stage)


@router.get("/dashboard/{project_id}")
def get_dashboard(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    stages = db.query(Stage).filter(Stage.project_id == project_id).all()
    from app.models.models import Upload, Analysis
    uploads = db.query(Upload).filter(Upload.project_id == project_id).all()
    analyzed = [u for u in uploads if u.analyzed]

    issues = []
    for u in analyzed:
        if u.analysis:
            issues_list = json.loads(u.analysis.issues_found or "[]")
            issues.extend(issues_list)

    critical_stages = [s for s in stages if s.is_critical]
    delayed = [s for s in stages if s.status == "delayed"]

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "address": project.address,
            "start_date": project.start_date,
            "overall_progress": project.overall_progress,
        },
        "stats": {
            "total_stages": len(stages),
            "completed_stages": len([s for s in stages if s.status == "completed"]),
            "in_progress_stages": len([s for s in stages if s.status == "in_progress"]),
            "delayed_stages": len(delayed),
            "total_uploads": len(uploads),
            "analyzed_uploads": len(analyzed),
            "total_issues": len(issues),
            "critical_path_length": len(critical_stages),
        },
        "recent_issues": issues[:5],
        "critical_stages": [stage_to_dict(s) for s in critical_stages],
    }
