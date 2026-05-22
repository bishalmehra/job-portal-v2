from fastapi import APIRouter, HTTPException, Depends, status, Query
from datetime import datetime, timezone
from bson import ObjectId
from core.database import get_db
from core.security import get_current_user, require_role
from models.schemas import ApplicationCreate, ApplicationStatus
from typing import Optional

router = APIRouter()


def _serialize(doc: dict) -> dict:
    """Convert ALL ObjectId fields to strings."""
    result = {}
    for k, v in doc.items():
        if k == "_id":
            result["id"] = str(v)
        elif isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, dict):
            result[k] = {dk: str(dv) if isinstance(dv, ObjectId) else dv for dk, dv in v.items()}
        else:
            result[k] = v
    return result


# ── User: submit application ───────────────────────────────────────────────────

@router.post(
    "/jobs/{job_id}/apply",
    status_code=status.HTTP_201_CREATED,
    summary="Apply for a job (user only)",
)
async def apply(
    job_id: str,
    body: ApplicationCreate,
    current_user: dict = Depends(require_role("user")),
):
    db = get_db()
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.jobs.find_one({"_id": oid, "is_active": True})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or no longer active")

    existing = await db.applications.find_one({
        "job_id": oid, "user_id": ObjectId(current_user["id"])
    })
    if existing:
        raise HTTPException(status_code=409, detail="You have already applied for this job")

    # Store host_id as ObjectId for consistent querying
    host_id = job["host_id"]
    if not isinstance(host_id, ObjectId):
        host_id = ObjectId(str(host_id))

    doc = {
        **body.model_dump(),
        "job_id":    oid,
        "user_id":   ObjectId(current_user["id"]),
        "job_title": job["title"],
        "company":   job["company"],
        "host_id":   host_id,
        "status":    ApplicationStatus.pending.value,
        "applied_at": datetime.now(timezone.utc),
    }
    result  = await db.applications.insert_one(doc)
    created = await db.applications.find_one({"_id": result.inserted_id})
    return _serialize(created)


# ── User: list own applications ────────────────────────────────────────────────

@router.get(
    "/my-applications",
    summary="List all applications submitted by the current user",
)
async def my_applications(
    current_user: dict = Depends(require_role("user")),
):
    db   = get_db()
    docs = await db.applications.find(
        {"user_id": ObjectId(current_user["id"])}
    ).sort("applied_at", -1).to_list(100)
    return [_serialize(d) for d in docs]


# ── Host: see applications for a job ──────────────────────────────────────────

@router.get(
    "/host/jobs/{job_id}/applications",
    summary="Get all applications for one of the host\'s job listings",
)
async def job_applications(
    job_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    host: dict = Depends(require_role("host")),
):
    db = get_db()
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    # Verify job belongs to this host
    job = await db.jobs.find_one({"_id": oid, "host_id": ObjectId(host["id"])})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Query applications — try both ObjectId and string for host_id compatibility
    host_oid = ObjectId(host["id"])
    query = {
        "job_id": oid,
        "$or": [
            {"host_id": host_oid},
            {"host_id": str(host_oid)},
        ]
    }
    if status_filter:
        query["status"] = status_filter

    docs = await db.applications.find(query).sort("applied_at", -1).to_list(500)

    # Fallback: if no results with host_id filter, fetch by job_id only
    if not docs:
        fallback_query = {"job_id": oid}
        if status_filter:
            fallback_query["status"] = status_filter
        docs = await db.applications.find(fallback_query).sort("applied_at", -1).to_list(500)

    return {
        "job_title":    job["title"],
        "total":        len(docs),
        "applications": [_serialize(d) for d in docs],
    }


# ── Host: update application status ───────────────────────────────────────────

@router.patch(
    "/host/applications/{app_id}/status",
    summary="Update the status of an application (host only)",
)
async def update_status(
    app_id:     str,
    new_status: ApplicationStatus = Query(...),
    host:       dict = Depends(require_role("host")),
):
    db = get_db()
    try:
        oid = ObjectId(app_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    # Find app — check both ObjectId and string host_id
    host_oid = ObjectId(host["id"])
    app = await db.applications.find_one({
        "_id": oid,
        "$or": [{"host_id": host_oid}, {"host_id": str(host_oid)}]
    })
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.applications.update_one(
        {"_id": oid},
        {"$set": {"status": new_status.value, "reviewed_at": datetime.now(timezone.utc)}}
    )
    updated = await db.applications.find_one({"_id": oid})
    return _serialize(updated)