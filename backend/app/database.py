import os
import uuid
import datetime
from sqlalchemy import create_engine, Column, String, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Ensure data directory exists (relative to CWD = backend/)
_db_path = settings.database_url.replace("sqlite:///", "")
os.makedirs(os.path.dirname(_db_path) if os.path.dirname(_db_path) else ".", exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ShortlistModel(Base):
    __tablename__ = "shortlists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    need = Column(String, nullable=False)
    requirements = Column(JSON, nullable=False)     # [{"text": str, "weight": int}]
    excluded_vendors = Column(JSON, default=list)
    result = Column(JSON, nullable=True)            # full comparison JSON
    status = Column(String, default="pending")      # pending | processing | done | error
    progress = Column(String, nullable=True)        # human-readable step label
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
