import json
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.models import Stage, Project


DEFAULT_STAGES = [
    {"name": "Terraplanagem e Fundação", "order_num": 1, "duration_days": 20, "dependencies": []},
    {"name": "Estrutura (pilares, vigas, laje)", "order_num": 2, "duration_days": 30, "dependencies": [1]},
    {"name": "Alvenaria e Vedação", "order_num": 3, "duration_days": 25, "dependencies": [2]},
    {"name": "Cobertura", "order_num": 4, "duration_days": 15, "dependencies": [2]},
    {"name": "Instalações Elétricas", "order_num": 5, "duration_days": 20, "dependencies": [3]},
    {"name": "Instalações Hidráulicas", "order_num": 6, "duration_days": 20, "dependencies": [3]},
    {"name": "Revestimentos Externos", "order_num": 7, "duration_days": 20, "dependencies": [4]},
    {"name": "Revestimentos Internos", "order_num": 8, "duration_days": 25, "dependencies": [5, 6]},
    {"name": "Esquadrias (portas e janelas)", "order_num": 9, "duration_days": 10, "dependencies": [8]},
    {"name": "Acabamentos e Pintura", "order_num": 10, "duration_days": 20, "dependencies": [8, 9]},
    {"name": "Limpeza e Entrega", "order_num": 11, "duration_days": 5, "dependencies": [7, 10]},
]


def seed_default_stages(db: Session, project_id: int, start_date: date):
    created = db.query(Stage).filter(Stage.project_id == project_id).all()
    if created:
        return created

    stage_id_map = {}
    new_stages = []

    for i, s in enumerate(DEFAULT_STAGES):
        stage = Stage(
            project_id=project_id,
            name=s["name"],
            order_num=s["order_num"],
            duration_days=s["duration_days"],
            dependencies="[]",
            status="pending",
            progress=0.0,
        )
        db.add(stage)
        db.flush()
        stage_id_map[s["order_num"]] = stage.id
        new_stages.append((stage, s["dependencies"]))

    # Map order numbers to real IDs
    for stage, dep_orders in new_stages:
        dep_ids = [stage_id_map[o] for o in dep_orders if o in stage_id_map]
        stage.dependencies = json.dumps(dep_ids)

    # Calculate planned dates using CPM
    stages_data = []
    for stage, dep_orders in new_stages:
        dep_ids = [stage_id_map[o] for o in dep_orders if o in stage_id_map]
        stages_data.append({
            "id": stage.id,
            "duration_days": stage.duration_days,
            "dependencies_list": dep_ids,
            "stage_obj": stage,
        })

    from app.services.ai_service import calculate_critical_path
    stages_data = calculate_critical_path(stages_data)

    for s in stages_data:
        obj = s["stage_obj"]
        obj.early_start = s["early_start"]
        obj.early_finish = s["early_finish"]
        obj.late_start = s["late_start"]
        obj.late_finish = s["late_finish"]
        obj.float_time = s["float_time"]
        obj.is_critical = s["is_critical"]
        obj.planned_start = (start_date + timedelta(days=s["early_start"])).isoformat()
        obj.planned_end = (start_date + timedelta(days=s["early_finish"])).isoformat()

    db.commit()
    return db.query(Stage).filter(Stage.project_id == project_id).all()


def update_stage_from_analysis(db: Session, project_id: int, stage_name: str, progress: float):
    stage = db.query(Stage).filter(
        Stage.project_id == project_id,
        Stage.name == stage_name,
    ).first()

    if not stage:
        return

    if progress > stage.progress:
        stage.progress = progress

    if progress > 0 and stage.status == "pending":
        stage.status = "in_progress"
        if not stage.actual_start:
            stage.actual_start = date.today().isoformat()

    if progress >= 100:
        stage.status = "completed"
        if not stage.actual_end:
            stage.actual_end = date.today().isoformat()

    # Update overall project progress
    stages = db.query(Stage).filter(Stage.project_id == project_id).all()
    if stages:
        avg = sum(s.progress for s in stages) / len(stages)
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.overall_progress = round(avg, 1)

    db.commit()
