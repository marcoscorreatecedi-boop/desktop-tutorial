from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    overall_progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploads = relationship("Upload", back_populates="project")
    stages = relationship("Stage", back_populates="project")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # 'photo' | 'audio'
    file_path = Column(String, nullable=False)
    notes = Column(Text, default="")
    analyzed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="uploads")
    analysis = relationship("Analysis", back_populates="upload", uselist=False)


class Stage(Base):
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    order_num = Column(Integer, nullable=False)
    dependencies = Column(Text, default="[]")  # JSON array of stage IDs
    planned_start = Column(String)
    planned_end = Column(String)
    actual_start = Column(String)
    actual_end = Column(String)
    duration_days = Column(Integer, default=0)
    progress = Column(Float, default=0.0)
    is_critical = Column(Boolean, default=False)
    status = Column(String, default="pending")  # pending | in_progress | completed | delayed
    early_start = Column(Integer, default=0)   # CPM forward pass (days from project start)
    early_finish = Column(Integer, default=0)
    late_start = Column(Integer, default=0)    # CPM backward pass
    late_finish = Column(Integer, default=0)
    float_time = Column(Integer, default=0)    # Total float = LS - ES

    project = relationship("Project", back_populates="stages")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    stage_identified = Column(String)
    progress_percentage = Column(Float, default=0.0)
    description = Column(Text)
    tasks_completed = Column(Text, default="[]")   # JSON array
    issues_found = Column(Text, default="[]")       # JSON array
    recommendations = Column(Text, default="[]")    # JSON array
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    upload = relationship("Upload", back_populates="analysis")
