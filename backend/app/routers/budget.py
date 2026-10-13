from fastapi import APIRouter, Depends
from ..loader import ProjectData, get_data

router = APIRouter()


@router.get("/budget")
def get_budget(data: ProjectData = Depends(get_data)) -> dict:
    grant_total = sum(t.amount_inr for t in data.tranches)
    released_total = sum(t.amount_inr for t in data.tranches if t.status == "released")

    alloc_map = {a.allocation_id: a for a in data.allocations}
    released_tranche_ids = {t.tranche_id for t in data.tranches if t.status == "released"}

    allocated_total = sum(a.amount_inr for a in data.allocations)
    allocated_released = sum(a.amount_inr for a in data.allocations if a.tranche_id in released_tranche_ids)
    spent_total = sum(e.amount_inr for e in data.expenditures)

    # Per-dept breakdown
    by_dept: dict[str, dict] = {}
    for dept in data.departments:
        by_dept[dept.dept_id] = {
            "dept_id": dept.dept_id,
            "dept_name": dept.dept_name,
            "budget_inr": dept.total_budget_inr,
            "allocated_inr": 0.0,
            "allocated_released_inr": 0.0,
            "spent_inr": 0.0,
            "by_category": {},
        }

    for a in data.allocations:
        d = by_dept.get(a.dept_id)
        if not d:
            continue
        d["allocated_inr"] += a.amount_inr
        if a.tranche_id in released_tranche_ids:
            d["allocated_released_inr"] += a.amount_inr
        cat = d["by_category"].setdefault(a.category, {"allocated_inr": 0.0, "spent_inr": 0.0})
        cat["allocated_inr"] += a.amount_inr

    for e in data.expenditures:
        al = alloc_map.get(e.allocation_id)
        dept_id = al.dept_id if al else e.dept_id
        d = by_dept.get(dept_id)
        if not d:
            continue
        d["spent_inr"] += e.amount_inr
        cat_key = al.category if al else e.category
        cat = d["by_category"].setdefault(cat_key, {"allocated_inr": 0.0, "spent_inr": 0.0})
        cat["spent_inr"] += e.amount_inr

    tranches_detail = [
        {
            "tranche_id": t.tranche_id,
            "amount_inr": t.amount_inr,
            "pct_of_grant": t.pct_of_grant,
            "status": t.status,
            "actual_release": t.actual_release.isoformat() if t.actual_release else None,
            "condition_milestone_id": t.condition_milestone_id,
        }
        for t in data.tranches
    ]

    return {
        "grant_total_inr": grant_total,
        "released_total_inr": released_total,
        "allocated_total_inr": allocated_total,
        "allocated_released_inr": allocated_released,
        "spent_total_inr": spent_total,
        "unspent_released_inr": released_total - spent_total,
        "tranches": tranches_detail,
        "by_dept": list(by_dept.values()),
    }
