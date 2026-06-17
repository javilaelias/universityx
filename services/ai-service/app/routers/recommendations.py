from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.db.mongodb import profiles_col
from app.db.postgres import get_pool
from app.services.recommender import build_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

_DEFAULT_PROFILE = {"pace": "medium", "preferred_types": [], "completion_rate": 0.0}


@router.get("/{user_id}")
async def get_recommendations(user_id: str, user=Depends(get_current_user)):
    pool = await get_pool()

    enrollments = await pool.fetch(
        """
        SELECT
          ci.id              AS content_item_id,
          ci.type            AS content_type,
          ci.title           AS item_title,
          ci.duration_seconds,
          co.title           AS course_title,
          e.progress_pct
        FROM   enrollments e
        JOIN   courses      co ON co.id = e.course_id
        JOIN   modules       m  ON m.course_id = co.id
        JOIN   content_items ci ON ci.module_id = m.id
        WHERE  e.user_id     = $1
          AND  e.progress_pct < 100
          AND  (m.release_date IS NULL OR m.release_date <= NOW())
        ORDER  BY co.id, m.position, ci.position
        """,
        user_id,
    )

    progress = await pool.fetch(
        """
        SELECT content_item_id, completed, progress_seconds, score, attempts, updated_at
        FROM   progress
        WHERE  user_id = $1
        """,
        user_id,
    )

    recs = build_recommendations(
        [dict(r) for r in enrollments],
        [dict(p) for p in progress],
    )

    col = profiles_col()
    # Aggregation pipeline upsert: $ifNull guarantees required fields on every write
    await col.update_one(
        {"user_id": user_id},
        [
            {
                "$set": {
                    "user_id":      user_id,
                    "profile":      {"$ifNull": ["$profile", _DEFAULT_PROFILE]},
                    "strengths":    {"$ifNull": ["$strengths",  []]},
                    "weaknesses":   {"$ifNull": ["$weaknesses", []]},
                    "activity_log": {"$ifNull": ["$activity_log", []]},
                    "recommendations": recs,
                    "updated_at":   datetime.now(timezone.utc),
                }
            }
        ],
        upsert=True,
    )

    return {"recommendations": recs, "generated_at": datetime.now(timezone.utc).isoformat()}
