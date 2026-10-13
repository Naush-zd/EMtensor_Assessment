from fastapi import APIRouter, Depends
from ..loader import ProjectData, get_data

router = APIRouter()


@router.get("/people")
def list_people(data: ProjectData = Depends(get_data)) -> list[dict]:
    dept_map = {d.dept_id: d.dept_name for d in data.departments}
    return [
        {
            "researcher_id": r.researcher_id,
            "full_name": r.full_name,
            "dept_id": r.dept_id,
            "dept_name": dept_map.get(r.dept_id, r.dept_id),
            "role": r.role,
            "email": r.email,
            "project_allocation_pct": r.project_allocation_pct,
            "monthly_cost_inr": r.monthly_cost_inr,
            "joined_on": r.joined_on.isoformat() if r.joined_on else None,
            "left_on": r.left_on.isoformat() if r.left_on else None,
            "status": r.status,
        }
        for r in data.researchers
    ]
