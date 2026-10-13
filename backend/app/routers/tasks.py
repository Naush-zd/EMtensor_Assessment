from fastapi import APIRouter, Depends
from ..loader import ProjectData, get_data

router = APIRouter()


@router.get("/tasks")
def list_tasks(data: ProjectData = Depends(get_data)) -> list[dict]:
    # latest progress per task
    latest: dict[str, dict] = {}
    for pu in sorted(data.progress_updates, key=lambda x: str(x.report_date or "")):
        latest[pu.task_id] = {
            "percent_complete": pu.percent_complete,
            "report_date": pu.report_date.isoformat() if pu.report_date else None,
            "blocker": pu.blocker,
        }

    return [
        {
            "task_id": wp.task_id,
            "parent_task_id": wp.parent_task_id,
            "dept_id": wp.dept_id,
            "task_name": wp.task_name,
            "status": wp.status,
            "component_id": wp.component_id,
            "owner_researcher_id": wp.owner_researcher_id,
            "planned_start": wp.planned_start.isoformat() if wp.planned_start else None,
            "planned_end": wp.planned_end.isoformat() if wp.planned_end else None,
            "actual_start": wp.actual_start.isoformat() if wp.actual_start else None,
            "actual_end": wp.actual_end.isoformat() if wp.actual_end else None,
            "latest_progress": latest.get(wp.task_id),
        }
        for wp in data.work_packages
    ]


@router.get("/tasks/dependencies")
def task_dependencies(data: ProjectData = Depends(get_data)) -> dict:
    task_map = {wp.task_id: wp for wp in data.work_packages}
    nodes = [
        {
            "id": wp.task_id,
            "label": wp.task_name,
            "dept_id": wp.dept_id,
            "status": wp.status,
            "is_work_package": wp.task_id.startswith("WP-"),
        }
        for wp in data.work_packages
    ]
    edges = [
        {
            "source": dep.predecessor_task_id,
            "target": dep.successor_task_id,
            "lag_days": dep.lag_days,
        }
        for dep in data.task_dependencies
        if dep.predecessor_task_id in task_map and dep.successor_task_id in task_map
    ]
    return {"nodes": nodes, "edges": edges}
