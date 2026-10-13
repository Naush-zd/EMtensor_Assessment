from fastapi import APIRouter, Depends
from ..loader import ProjectData, get_data

router = APIRouter()

TODAY = "2026-09-15"


@router.get("/overview")
def get_overview(data: ProjectData = Depends(get_data)) -> dict:
    # Overall progress from leaf tasks (exclude WP- parent rows)
    leaf_tasks = [wp for wp in data.work_packages if wp.parent_task_id and not wp.task_id.startswith("WP-")]
    total = len(leaf_tasks)
    completed = sum(1 for t in leaf_tasks if t.status == "completed")
    in_progress = sum(1 for t in leaf_tasks if t.status == "in_progress")
    not_started = total - completed - in_progress
    overall_pct = round((completed / total) * 100, 1) if total else 0

    milestones = [
        {
            "milestone_id": m.milestone_id,
            "milestone_name": m.milestone_name,
            "due_date": m.due_date.isoformat() if m.due_date else None,
            "releases_tranche_id": m.releases_tranche_id,
            "reported_status": m.reported_status,
            "linked_task_ids": m.linked_task_ids,
        }
        for m in data.milestones
    ]

    tranches = [
        {
            "tranche_id": t.tranche_id,
            "pct_of_grant": t.pct_of_grant,
            "amount_inr": t.amount_inr,
            "condition_milestone_id": t.condition_milestone_id,
            "expected_release": t.expected_release.isoformat() if t.expected_release else None,
            "actual_release": t.actual_release.isoformat() if t.actual_release else None,
            "status": t.status,
        }
        for t in data.tranches
    ]

    grant_total = sum(t.amount_inr for t in data.tranches)
    released_total = sum(t.amount_inr for t in data.tranches if t.status == "released")

    # Per-dept task progress
    dept_progress = {}
    for wp in leaf_tasks:
        d = dept_progress.setdefault(wp.dept_id, {"total": 0, "completed": 0, "in_progress": 0})
        d["total"] += 1
        if wp.status == "completed":
            d["completed"] += 1
        elif wp.status == "in_progress":
            d["in_progress"] += 1

    return {
        "as_of": TODAY,
        "grant_total_inr": grant_total,
        "released_total_inr": released_total,
        "overall_pct_complete": overall_pct,
        "tasks_total": total,
        "tasks_completed": completed,
        "tasks_in_progress": in_progress,
        "tasks_not_started": not_started,
        "milestones": milestones,
        "tranches": tranches,
        "dept_progress": dept_progress,
    }
