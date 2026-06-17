"""
MVP recommendation engine — rule-based, no ML.
Produces up to 5 recommendations ranked by confidence.
"""
from datetime import datetime, timezone, timedelta
from typing import Any


def _days_ago(ts: datetime | None) -> float:
    if ts is None:
        return 999
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - ts).total_seconds() / 86_400


def build_recommendations(
    enrollments: list[dict[str, Any]],
    progress_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    enrollments  — rows from: enrollments JOIN courses JOIN content_items
    progress_rows — rows from: progress WHERE user_id = ?

    Returns list of recommendation dicts.
    """
    progress_by_item: dict[str, dict] = {
        str(p["content_item_id"]): dict(p) for p in progress_rows
    }

    recs: list[dict[str, Any]] = []

    for row in enrollments:
        item_id       = str(row["content_item_id"])
        prog          = progress_by_item.get(item_id, {})
        is_completed  = bool(prog.get("completed", False))
        score         = float(prog.get("score") or 0)
        prog_seconds  = int(prog.get("progress_seconds") or 0)
        last_accessed = prog.get("updated_at")
        content_type  = str(row["content_type"])
        item_title    = str(row["item_title"])
        course_title  = str(row["course_title"])
        days_idle     = _days_ago(last_accessed)

        if is_completed:
            continue  # skip already done items

        # ── Rule 1: failed quiz (score < 70, has attempts) ───────────────────
        if content_type == "quiz" and prog.get("attempts", 0) > 0 and score < 70:
            recs.append({
                "content_item_id": item_id,
                "content_title":   item_title,
                "course_name":     course_title,
                "content_type":    content_type,
                "reason":          f"Obtuviste {score:.0f}% — repasa y vuelve a intentarlo",
                "confidence":      0.95,
                "duration_minutes": int(row.get("duration_seconds") or 0) // 60,
            })
            continue

        # ── Rule 2: video started but not finished ────────────────────────────
        if content_type == "video" and prog_seconds > 0:
            duration = int(row.get("duration_seconds") or 1)
            watched  = prog_seconds / max(duration, 1)
            if watched < 0.9:
                recs.append({
                    "content_item_id": item_id,
                    "content_title":   item_title,
                    "course_name":     course_title,
                    "content_type":    content_type,
                    "reason":          f"Continúa donde lo dejaste ({int(watched*100)}% visto)",
                    "confidence":      0.88,
                    "duration_minutes": max(0, (duration - prog_seconds) // 60),
                })
                continue

        # ── Rule 3: idle for 3+ days on an in-progress item ──────────────────
        if days_idle >= 3 and prog:
            recs.append({
                "content_item_id": item_id,
                "content_title":   item_title,
                "course_name":     course_title,
                "content_type":    content_type,
                "reason":          f"Llevas {int(days_idle)} días sin avanzar en este curso",
                "confidence":      0.75,
                "duration_minutes": int(row.get("duration_seconds") or 0) // 60,
            })
            continue

        # ── Rule 4: not started yet ───────────────────────────────────────────
        if not prog:
            recs.append({
                "content_item_id": item_id,
                "content_title":   item_title,
                "course_name":     course_title,
                "content_type":    content_type,
                "reason":          "Siguiente contenido pendiente en tu ruta",
                "confidence":      0.60,
                "duration_minutes": int(row.get("duration_seconds") or 0) // 60,
            })

    # Sort by confidence desc, return top 5
    recs.sort(key=lambda r: r["confidence"], reverse=True)
    for i, r in enumerate(recs[:5]):
        r["id"] = f"rec-{i+1}"
    return recs[:5]
