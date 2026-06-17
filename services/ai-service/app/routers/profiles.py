from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user
from app.db.mongodb import profiles_col

router = APIRouter(prefix="/profiles", tags=["profiles"])

_DEFAULT_PROFILE = {"pace": "medium", "preferred_types": [], "completion_rate": 0.0}


class ActivityLog(BaseModel):
    action:          str
    content_item_id: str
    duration_sec:    int    = 0
    score:           float  | None = None
    was_offline:     bool   = False


@router.get("/{user_id}")
async def get_profile(user_id: str, user=Depends(get_current_user)):
    if user["id"] != user_id and user["role"] not in ("admin", "support"):
        raise HTTPException(403, "Acceso denegado")

    col = profiles_col()
    doc = await col.find_one({"user_id": user_id}, {"_id": 0})

    if not doc:
        doc = {
            "user_id":         user_id,
            "profile":         _DEFAULT_PROFILE.copy(),
            "strengths":       [],
            "weaknesses":      [],
            "activity_log":    [],
            "recommendations": [],
            "updated_at":      datetime.now(timezone.utc),
        }
        await col.insert_one({**doc})

    return doc


@router.post("/{user_id}/activity", status_code=202)
async def log_activity(user_id: str, body: ActivityLog, user=Depends(get_current_user)):
    if user["id"] != user_id:
        raise HTTPException(403, "Acceso denegado")

    col   = profiles_col()
    entry = {
        "action":          body.action,
        "content_item_id": body.content_item_id,
        "duration_sec":    body.duration_sec,
        "score":           body.score,
        "was_offline":     body.was_offline,
        "timestamp":       datetime.now(timezone.utc),
    }

    # Aggregation pipeline upsert: $ifNull guarantees required fields on every write
    await col.update_one(
        {"user_id": user_id},
        [
            {
                "$set": {
                    "user_id":    user_id,
                    "profile":    {"$ifNull": ["$profile", _DEFAULT_PROFILE]},
                    "strengths":  {"$ifNull": ["$strengths",  []]},
                    "weaknesses": {"$ifNull": ["$weaknesses", []]},
                    "recommendations": {"$ifNull": ["$recommendations", []]},
                    "activity_log": {
                        "$slice": [
                            {"$concatArrays": [{"$ifNull": ["$activity_log", []]}, [entry]]},
                            -500,
                        ]
                    },
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        ],
        upsert=True,
    )

    # Update preferred content types
    if body.action in ("video_watched", "content_completed"):
        content_type = "video" if "video" in body.action else "document"
        await col.update_one(
            {"user_id": user_id},
            {"$addToSet": {"profile.preferred_types": content_type}},
        )

    return {"logged": True}
