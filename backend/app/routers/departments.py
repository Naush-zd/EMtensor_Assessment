from fastapi import APIRouter, Depends, HTTPException
from ..loader import ProjectData, get_data
from ..anomalies import detect_all

router = APIRouter()


@router.get("/departments")
def list_departments(data: ProjectData = Depends(get_data)) -> list[dict]:
    anomalies = detect_all(data)
    alloc_by_dept: dict[str, float] = {}
    for a in data.allocations:
        alloc_by_dept[a.dept_id] = alloc_by_dept.get(a.dept_id, 0) + a.amount_inr

    alloc_map = {a.allocation_id: a for a in data.allocations}
    spent_by_dept: dict[str, float] = {}
    for e in data.expenditures:
        al = alloc_map.get(e.allocation_id)
        dept = al.dept_id if al else e.dept_id
        spent_by_dept[dept] = spent_by_dept.get(dept, 0) + e.amount_inr

    leaf_tasks = [wp for wp in data.work_packages if wp.parent_task_id and not wp.task_id.startswith("WP-")]
    task_progress: dict[str, dict] = {}
    for wp in leaf_tasks:
        d = task_progress.setdefault(wp.dept_id, {"total": 0, "completed": 0, "in_progress": 0})
        d["total"] += 1
        if wp.status == "completed":
            d["completed"] += 1
        elif wp.status == "in_progress":
            d["in_progress"] += 1

    anomaly_counts: dict[str, int] = {}
    for an in anomalies:
        # attribute to dept via entity id lookup where possible
        pass  # simple: count not needed per dept in listing

    researcher_by_dept: dict[str, int] = {}
    for r in data.researchers:
        researcher_by_dept[r.dept_id] = researcher_by_dept.get(r.dept_id, 0) + 1

    result = []
    for dept in data.departments:
        tp = task_progress.get(dept.dept_id, {"total": 0, "completed": 0, "in_progress": 0})
        pct = round((tp["completed"] / tp["total"]) * 100, 1) if tp["total"] else 0
        result.append({
            "dept_id": dept.dept_id,
            "dept_name": dept.dept_name,
            "scope": dept.scope,
            "total_budget_inr": dept.total_budget_inr,
            "allocated_inr": alloc_by_dept.get(dept.dept_id, 0),
            "spent_inr": spent_by_dept.get(dept.dept_id, 0),
            "head_researcher_id": dept.head_researcher_id,
            "researcher_count": researcher_by_dept.get(dept.dept_id, 0),
            "tasks_total": tp["total"],
            "tasks_completed": tp["completed"],
            "tasks_in_progress": tp["in_progress"],
            "pct_complete": pct,
        })
    return result


@router.get("/departments/{dept_id}")
def get_department(dept_id: str, data: ProjectData = Depends(get_data)) -> dict:
    dept = next((d for d in data.departments if d.dept_id == dept_id), None)
    if not dept:
        raise HTTPException(404, f"Department {dept_id} not found")

    tasks = [
        {
            "task_id": wp.task_id,
            "task_name": wp.task_name,
            "status": wp.status,
            "planned_start": wp.planned_start.isoformat() if wp.planned_start else None,
            "planned_end": wp.planned_end.isoformat() if wp.planned_end else None,
            "actual_start": wp.actual_start.isoformat() if wp.actual_start else None,
            "actual_end": wp.actual_end.isoformat() if wp.actual_end else None,
            "component_id": wp.component_id,
            "owner_researcher_id": wp.owner_researcher_id,
        }
        for wp in data.work_packages
        if wp.dept_id == dept_id and wp.parent_task_id and not wp.task_id.startswith("WP-")
    ]

    researchers = [
        {
            "researcher_id": r.researcher_id,
            "full_name": r.full_name,
            "role": r.role,
            "status": r.status,
            "project_allocation_pct": r.project_allocation_pct,
        }
        for r in data.researchers if r.dept_id == dept_id
    ]

    alloc_map = {a.allocation_id: a for a in data.allocations}
    dept_allocs = [a for a in data.allocations if a.dept_id == dept_id]
    released_tranche_ids = {t.tranche_id for t in data.tranches if t.status == "released"}

    allocated_released = sum(a.amount_inr for a in dept_allocs if a.tranche_id in released_tranche_ids)
    allocated_total = sum(a.amount_inr for a in dept_allocs)

    dept_expenditures = [e for e in data.expenditures if e.dept_id == dept_id]
    spent_total = sum(e.amount_inr for e in dept_expenditures)

    # latest progress per task
    latest_progress: dict[str, dict] = {}
    for pu in sorted(data.progress_updates, key=lambda x: x.report_date or "0000"):
        if any(t["task_id"] == pu.task_id for t in tasks):
            latest_progress[pu.task_id] = {
                "percent_complete": pu.percent_complete,
                "report_date": pu.report_date.isoformat() if pu.report_date else None,
                "blocker": pu.blocker,
                "note": pu.note,
            }

    anomalies = detect_all(data)
    dept_anomalies = [
        {
            "rule_id": a.rule_id,
            "severity": a.severity,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "message": a.message,
        }
        for a in anomalies
        if _anomaly_belongs_to_dept(a, dept_id, data)
    ]

    return {
        "dept_id": dept.dept_id,
        "dept_name": dept.dept_name,
        "scope": dept.scope,
        "total_budget_inr": dept.total_budget_inr,
        "allocated_total_inr": allocated_total,
        "allocated_released_inr": allocated_released,
        "spent_total_inr": spent_total,
        "tasks": tasks,
        "latest_progress": latest_progress,
        "researchers": researchers,
        "anomalies": dept_anomalies,
    }


def _anomaly_belongs_to_dept(anomaly, dept_id: str, data: ProjectData) -> bool:
    eid = anomaly.entity_id
    if anomaly.entity_type == "expenditure":
        exp = next((e for e in data.expenditures if e.expense_id == eid), None)
        return exp is not None and exp.dept_id == dept_id
    if anomaly.entity_type == "purchase_order":
        po = next((p for p in data.purchase_orders if p.po_id == eid), None)
        return po is not None and po.dept_id == dept_id
    if anomaly.entity_type == "task":
        wp = next((w for w in data.work_packages if w.task_id == eid), None)
        return wp is not None and wp.dept_id == dept_id
    if anomaly.entity_type == "timesheet":
        rid = eid.split("/")[0]
        res = next((r for r in data.researchers if r.researcher_id == rid), None)
        return res is not None and res.dept_id == dept_id
    return False
