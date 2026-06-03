import os
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Upload, Analysis, Project
from app.services.ai_service import analyze_photo, analyze_audio_note
from app.services.schedule_service import update_stage_from_analysis

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


def upload_to_dict(u: Upload) -> dict:
    result = {
        "id": u.id,
        "project_id": u.project_id,
        "filename": u.filename,
        "original_name": u.original_name,
        "file_type": u.file_type,
        "notes": u.notes,
        "analyzed": u.analyzed,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "analysis": None,
    }
    if u.analysis:
        a = u.analysis
        result["analysis"] = {
            "id": a.id,
            "stage_identified": a.stage_identified,
            "progress_percentage": a.progress_percentage,
            "description": a.description,
            "tasks_completed": json.loads(a.tasks_completed or "[]"),
            "issues_found": json.loads(a.issues_found or "[]"),
            "recommendations": json.loads(a.recommendations or "[]"),
            "confidence": a.confidence,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
    return result


@router.get("")
def list_uploads(project_id: int, db: Session = Depends(get_db)):
    uploads = db.query(Upload).filter(Upload.project_id == project_id).order_by(Upload.created_at.desc()).all()
    return [upload_to_dict(u) for u in uploads]


@router.post("")
async def create_upload(
    project_id: int = Form(...),
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    ext = os.path.splitext(file.filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    image_exts = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
    audio_exts = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".opus"}
    file_type = "photo" if ext in image_exts else "audio" if ext in audio_exts else "other"

    upload = Upload(
        project_id=project_id,
        filename=unique_name,
        original_name=file.filename,
        file_type=file_type,
        file_path=file_path,
        notes=notes,
        analyzed=False,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload_to_dict(upload)


@router.post("/{upload_id}/analyze")
async def analyze_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload não encontrado")

    try:
        if upload.file_type == "photo":
            result = await analyze_photo(upload.file_path)
        else:
            notes_text = upload.notes or upload.original_name
            result = await analyze_audio_note(notes_text)

        analysis = db.query(Analysis).filter(Analysis.upload_id == upload_id).first()
        if not analysis:
            analysis = Analysis(upload_id=upload_id)
            db.add(analysis)

        analysis.stage_identified = result.get("stage_identified", "")
        analysis.progress_percentage = float(result.get("progress_percentage", 0))
        analysis.description = result.get("description", "")
        analysis.tasks_completed = json.dumps(result.get("tasks_completed", []))
        analysis.issues_found = json.dumps(result.get("issues_found", []))
        analysis.recommendations = json.dumps(result.get("recommendations", []))
        analysis.confidence = float(result.get("confidence", 0))

        upload.analyzed = True
        db.commit()

        # Update stage progress based on analysis
        if analysis.stage_identified:
            update_stage_from_analysis(
                db,
                upload.project_id,
                analysis.stage_identified,
                analysis.progress_percentage,
            )

        db.refresh(upload)
        return upload_to_dict(upload)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")


@router.get("/{upload_id}/file")
def serve_file(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload or not os.path.exists(upload.file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(upload.file_path)


@router.delete("/{upload_id}")
def delete_upload(upload_id: int, db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload não encontrado")
    if os.path.exists(upload.file_path):
        os.remove(upload.file_path)
    db.delete(upload)
    db.commit()
    return {"ok": True}
