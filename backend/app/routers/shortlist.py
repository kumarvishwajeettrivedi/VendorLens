import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.database import get_db, ShortlistModel, SessionLocal
from app.models import ShortlistCreate, ShortlistResponse, ExcludeVendorRequest
from app.services.llm import generate_shortlist, _friendly_error

router = APIRouter(tags=["shortlist"])


# ── Progress helper ──────────────────────────────────────────────────────────

def _set_progress(shortlist_id: str, step: str):
    """Update progress label for real-time frontend feedback."""
    db = SessionLocal()
    try:
        row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
        if row:
            row.progress = step
            db.commit()
    finally:
        db.close()


# ── Background processor ─────────────────────────────────────────────────────

async def _process(shortlist_id: str, need: str, requirements: list, excluded: list):
    db = SessionLocal()
    try:
        _set_progress(shortlist_id, "Identifying top vendors…")
        result = await generate_shortlist(
            need, requirements, excluded,
            on_progress=lambda step: _set_progress(shortlist_id, step),
        )
        row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
        if row:
            row.result = result
            row.status = "done"
            row.progress = "Done"
            db.commit()
    except Exception as exc:
        row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
        if row:
            row.status = "error"
            row.error_message = _friendly_error(exc)
            row.progress = None
            db.commit()
        print(f"[shortlist] Error for {shortlist_id}: {exc}")
    finally:
        db.close()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/shortlist", response_model=ShortlistResponse, status_code=202)
async def create_shortlist(
    data: ShortlistCreate,
    bg: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if not data.need.strip():
        raise HTTPException(status_code=422, detail="Need cannot be empty.")
    if len(data.requirements) == 0:
        raise HTTPException(status_code=422, detail="Provide at least one requirement.")

    row = ShortlistModel(
        id=str(uuid.uuid4()),
        need=data.need.strip(),
        requirements=[r.model_dump() for r in data.requirements],
        excluded_vendors=data.excluded_vendors,
        status="processing",
        progress="Queued…",
        created_at=datetime.datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    bg.add_task(_process, row.id, row.need, row.requirements, row.excluded_vendors)
    return row


@router.get("/shortlist/{shortlist_id}", response_model=ShortlistResponse)
async def get_shortlist(shortlist_id: str, db: Session = Depends(get_db)):
    row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Shortlist not found.")
    return row


@router.get("/shortlists", response_model=list[ShortlistResponse])
async def list_shortlists(db: Session = Depends(get_db)):
    return (
        db.query(ShortlistModel)
        .order_by(ShortlistModel.created_at.desc())
        .limit(5)
        .all()
    )


@router.post("/shortlist/{shortlist_id}/exclude-vendor")
async def exclude_vendor(
    shortlist_id: str,
    body: ExcludeVendorRequest,
    db: Session = Depends(get_db),
):
    row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Shortlist not found.")
    if not row.result or "vendors" not in row.result:
        raise HTTPException(status_code=400, detail="No results yet.")

    matched = any(
        v["name"].lower() == body.vendor_name.lower()
        for v in row.result["vendors"]
    )
    if not matched:
        raise HTTPException(status_code=404, detail=f"Vendor '{body.vendor_name}' not found.")

    for v in row.result["vendors"]:
        if v["name"].lower() == body.vendor_name.lower():
            v["excluded"] = True

    flag_modified(row, "result")
    db.commit()
    return {"message": f"'{body.vendor_name}' excluded."}


@router.post("/shortlist/{shortlist_id}/include-vendor")
async def include_vendor(
    shortlist_id: str,
    body: ExcludeVendorRequest,
    db: Session = Depends(get_db),
):
    row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Shortlist not found.")
    if not row.result or "vendors" not in row.result:
        raise HTTPException(status_code=400, detail="No results yet.")

    for v in row.result["vendors"]:
        if v["name"].lower() == body.vendor_name.lower():
            v["excluded"] = False

    flag_modified(row, "result")
    db.commit()
    return {"message": f"'{body.vendor_name}' re-included."}


@router.delete("/shortlist/{shortlist_id}", status_code=204)
async def delete_shortlist(shortlist_id: str, db: Session = Depends(get_db)):
    row = db.query(ShortlistModel).filter(ShortlistModel.id == shortlist_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Shortlist not found.")
    db.delete(row)
    db.commit()
