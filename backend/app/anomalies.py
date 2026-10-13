"""
Anomaly detection: 8 rules that check project-rule violations in the data.
Each rule returns a list of Anomaly objects.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Literal

from .loader import ProjectData

Severity = Literal["error", "warning"]

STATUS_ORDER = {
    "planned": 0, "ordered": 1, "delivered": 2,
    "in_progress": 3, "installed": 4, "tested": 5,
}


@dataclass
class Anomaly:
    rule_id: str
    severity: Severity
    entity_type: str
    entity_id: str
    message: str
    detail: str


def detect_all(data: ProjectData) -> list[Anomaly]:
    results: list[Anomaly] = []
    for fn in [r1, r2, r3, r4, r5, r6, r7, r8]:
        results.extend(fn(data))
    results.sort(key=lambda a: (0 if a.severity == "error" else 1, a.rule_id))
    return results


def r1(data: ProjectData) -> list[Anomaly]:
    """Expense draws from an allocation whose tranche has not been released."""
    released = {t.tranche_id for t in data.tranches if t.status == "released"}
    alloc_tranche = {a.allocation_id: a.tranche_id for a in data.allocations}
    out = []
    for e in data.expenditures:
        t_id = alloc_tranche.get(e.allocation_id)
        if t_id and t_id not in released:
            out.append(Anomaly(
                rule_id="R1",
                severity="error",
                entity_type="expenditure",
                entity_id=e.expense_id,
                message=f"Expense {e.expense_id} charged to allocation {e.allocation_id} "
                        f"whose tranche {t_id} has not been released.",
                detail=f"Amount ₹{e.amount_inr:,.0f} | Date {e.expense_date} | "
                       f"Tranche {t_id} status: pending",
            ))
    return out


def r2(data: ProjectData) -> list[Anomaly]:
    """Total payments on a PO must not exceed the PO value."""
    po_map = {po.po_id: po for po in data.purchase_orders}
    po_spent: dict[str, float] = {}
    for e in data.expenditures:
        if e.po_id:
            po_spent[e.po_id] = po_spent.get(e.po_id, 0.0) + e.amount_inr
    out = []
    for po_id, spent in po_spent.items():
        po = po_map.get(po_id)
        if po and spent > po.po_amount_inr:
            excess = spent - po.po_amount_inr
            out.append(Anomaly(
                rule_id="R2",
                severity="error",
                entity_type="purchase_order",
                entity_id=po_id,
                message=f"PO {po_id} ({po.vendor}) has been overpaid by ₹{excess:,.0f}.",
                detail=f"PO value ₹{po.po_amount_inr:,.0f} | Total paid ₹{spent:,.0f} | "
                       f"Excess ₹{excess:,.0f}",
            ))
    return out


def r3(data: ProjectData) -> list[Anomaly]:
    """Requester and approver of an expense must be different people."""
    out = []
    for e in data.expenditures:
        if e.requested_by and e.approved_by and e.requested_by == e.approved_by:
            out.append(Anomaly(
                rule_id="R3",
                severity="error",
                entity_type="expenditure",
                entity_id=e.expense_id,
                message=f"Expense {e.expense_id} was requested and approved by the same person ({e.requested_by}).",
                detail=f"Amount ₹{e.amount_inr:,.0f} | Date {e.expense_date} | Person {e.requested_by}",
            ))
    return out


def r4(data: ProjectData) -> list[Anomaly]:
    """Exited/left people cannot approve expenses or log hours after their exit date."""
    left_map: dict[str, date] = {}
    for r in data.researchers:
        if r.left_on and r.status == "exited":
            left_map[r.researcher_id] = r.left_on

    out = []
    for e in data.expenditures:
        left = left_map.get(e.approved_by)
        if left and e.expense_date and e.expense_date > left:
            out.append(Anomaly(
                rule_id="R4",
                severity="error",
                entity_type="expenditure",
                entity_id=e.expense_id,
                message=f"Expense {e.expense_id} approved by {e.approved_by} who left on {left}.",
                detail=f"Approval date {e.expense_date} is after exit date {left}",
            ))
        left_req = left_map.get(e.requested_by)
        if left_req and e.expense_date and e.expense_date > left_req:
            out.append(Anomaly(
                rule_id="R4",
                severity="warning",
                entity_type="expenditure",
                entity_id=e.expense_id,
                message=f"Expense {e.expense_id} requested by {e.requested_by} who left on {left_req}.",
                detail=f"Request date {e.expense_date} is after exit date {left_req}",
            ))

    for ts in data.timesheets:
        left = left_map.get(ts.researcher_id)
        if left and ts.week_start and ts.week_start > left:
            out.append(Anomaly(
                rule_id="R4",
                severity="warning",
                entity_type="timesheet",
                entity_id=f"{ts.researcher_id}/{ts.week_start}",
                message=f"{ts.researcher_id} logged {ts.hours}h on {ts.week_start} after leaving on {left}.",
                detail=f"Task {ts.task_id or 'admin'} | Hours {ts.hours}",
            ))
    return out


def r5(data: ProjectData) -> list[Anomaly]:
    """Finish-to-start: a task cannot start before its predecessor finishes."""
    task_map = {wp.task_id: wp for wp in data.work_packages}
    out = []
    for dep in data.task_dependencies:
        pred = task_map.get(dep.predecessor_task_id)
        succ = task_map.get(dep.successor_task_id)
        if not pred or not succ:
            continue
        pred_end = pred.actual_end or pred.planned_end
        succ_start = succ.actual_start or succ.planned_start
        if pred_end and succ_start and succ_start < pred_end:
            out.append(Anomaly(
                rule_id="R5",
                severity="warning",
                entity_type="task",
                entity_id=succ.task_id,
                message=f"Task {succ.task_id} started before predecessor {pred.task_id} finished.",
                detail=f"Predecessor end: {pred_end} | Successor start: {succ_start}",
            ))
    return out


def r6(data: ProjectData) -> list[Anomaly]:
    """A component cannot be installed before its dependencies are installed."""
    installed_statuses = {"installed", "tested"}
    comp_map = {c.component_id: c for c in data.components}
    out = []
    for dep in data.component_dependencies:
        comp = comp_map.get(dep.component_id)
        req = comp_map.get(dep.depends_on_component_id)
        if not comp or not req:
            continue
        comp_level = STATUS_ORDER.get(comp.status, -1)
        req_level = STATUS_ORDER.get(req.status, -1)
        if comp_level >= STATUS_ORDER["installed"] and comp.status in installed_statuses:
            if req.status not in installed_statuses:
                out.append(Anomaly(
                    rule_id="R6",
                    severity="error",
                    entity_type="component",
                    entity_id=comp.component_id,
                    message=f"Component {comp.component_id} is {comp.status} but its "
                            f"{dep.dependency_type} dependency {req.component_id} is only {req.status}.",
                    detail=f"Dependency type: {dep.dependency_type}",
                ))
    return out


def r7(data: ProjectData) -> list[Anomaly]:
    """100% allocation = 40 h/week. Researcher logging >40 h/week is over-allocated."""
    from collections import defaultdict
    week_hours: dict[tuple[str, str], float] = defaultdict(float)
    for ts in data.timesheets:
        key = (ts.researcher_id, str(ts.week_start))
        week_hours[key] += ts.hours

    researcher_alloc = {r.researcher_id: r.project_allocation_pct for r in data.researchers}
    out = []
    for (rid, week), total in week_hours.items():
        alloc_pct = researcher_alloc.get(rid, 100)
        max_hours = 40.0 * (alloc_pct / 100.0)
        if total > max_hours + 0.01:  # small tolerance for rounding
            out.append(Anomaly(
                rule_id="R7",
                severity="warning",
                entity_type="timesheet",
                entity_id=f"{rid}/{week}",
                message=f"{rid} logged {total:.1f}h in week {week}, exceeding their "
                        f"{alloc_pct:.0f}% allocation cap of {max_hours:.0f}h.",
                detail=f"Over by {total - max_hours:.1f}h",
            ))
    return out


def r8(data: ProjectData) -> list[Anomaly]:
    """Equipment or civil works above ₹5,00,000 must go through a purchase order."""
    threshold = 500_000
    po_categories = {"equipment", "civil_works"}
    out = []
    for e in data.expenditures:
        if e.category in po_categories and e.amount_inr > threshold and not e.po_id:
            out.append(Anomaly(
                rule_id="R8",
                severity="error",
                entity_type="expenditure",
                entity_id=e.expense_id,
                message=f"Expense {e.expense_id} for ₹{e.amount_inr:,.0f} ({e.category}) "
                        f"exceeds ₹5,00,000 but has no purchase order.",
                detail=f"Vendor: {e.vendor or 'N/A'} | Date {e.expense_date} | "
                       f"Dept {e.dept_id}",
            ))
    return out
