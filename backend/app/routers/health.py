import time
from fastapi import APIRouter
from sqlalchemy import text
from app.database import engine
from app.services.llm import check_llm_health

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    start = time.time()

    # Database check
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    # LLM check
    llm_ok = await check_llm_health()

    elapsed = round((time.time() - start) * 1000)
    overall = "ok" if (db_ok and llm_ok) else "degraded"

    return {
        "status": overall,
        "backend": True,
        "database": db_ok,
        "llm": llm_ok,
        "llm_model": "gemini-2.5-flash",
        "latency_ms": elapsed,
    }
