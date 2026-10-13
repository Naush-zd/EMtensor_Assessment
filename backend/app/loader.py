"""
Load all CSVs from DATA_DIR at startup and expose via get_data() singleton.
Messy data is tolerated: bad dates become None, bad numbers become 0.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date
from functools import lru_cache
from typing import Optional

import pandas as pd

from .models import (
    BudgetAllocation, Component, ComponentDependency, Department, Expenditure,
    FundingTranche, Milestone, ProgressUpdate, PurchaseOrder, Researcher,
    TaskDependency, Timesheet, WorkPackage,
)

DATA_DIR = os.environ.get("DATA_DIR", "/app/data")


def _parse_date(val) -> Optional[date]:
    if pd.isna(val) or val == "":
        return None
    try:
        return pd.to_datetime(str(val), dayfirst=False, errors="coerce").date()
    except Exception:
        return None


def _safe_float(val, default: float = 0.0) -> float:
    try:
        if pd.isna(val):
            return default
        return float(str(val).replace(",", "").strip())
    except Exception:
        return default


def _safe_str(val, default: str = "") -> str:
    if pd.isna(val):
        return default
    return str(val).strip()


def _safe_int(val, default: int = 0) -> int:
    try:
        if pd.isna(val):
            return default
        return int(float(str(val)))
    except Exception:
        return default


@dataclass
class ProjectData:
    departments: list[Department] = field(default_factory=list)
    researchers: list[Researcher] = field(default_factory=list)
    tranches: list[FundingTranche] = field(default_factory=list)
    allocations: list[BudgetAllocation] = field(default_factory=list)
    work_packages: list[WorkPackage] = field(default_factory=list)
    task_dependencies: list[TaskDependency] = field(default_factory=list)
    milestones: list[Milestone] = field(default_factory=list)
    progress_updates: list[ProgressUpdate] = field(default_factory=list)
    components: list[Component] = field(default_factory=list)
    component_dependencies: list[ComponentDependency] = field(default_factory=list)
    purchase_orders: list[PurchaseOrder] = field(default_factory=list)
    expenditures: list[Expenditure] = field(default_factory=list)
    timesheets: list[Timesheet] = field(default_factory=list)


def _load_departments(path: str) -> list[Department]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(Department(
            dept_id=_safe_str(r["dept_id"]),
            dept_name=_safe_str(r["dept_name"]),
            scope=_safe_str(r.get("scope", "")),
            total_budget_inr=_safe_float(r["total_budget_inr"]),
            head_researcher_id=_safe_str(r["head_researcher_id"]),
        ))
    return result


def _load_researchers(path: str) -> list[Researcher]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(Researcher(
            researcher_id=_safe_str(r["researcher_id"]),
            full_name=_safe_str(r["full_name"]),
            dept_id=_safe_str(r["dept_id"]),
            role=_safe_str(r["role"]),
            email=_safe_str(r["email"]),
            project_allocation_pct=_safe_float(r["project_allocation_pct"]),
            monthly_cost_inr=_safe_float(r["monthly_cost_inr"]),
            joined_on=_parse_date(r.get("joined_on")),
            left_on=_parse_date(r.get("left_on")),
            status=_safe_str(r["status"], "active"),
        ))
    return result


def _load_tranches(path: str) -> list[FundingTranche]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(FundingTranche(
            tranche_id=_safe_str(r["tranche_id"]),
            pct_of_grant=_safe_float(r["pct_of_grant"]),
            amount_inr=_safe_float(r["amount_inr"]),
            condition_milestone_id=_safe_str(r["condition_milestone_id"]),
            expected_release=_parse_date(r.get("expected_release")),
            actual_release=_parse_date(r.get("actual_release")),
            status=_safe_str(r["status"], "pending"),
        ))
    return result


def _load_allocations(path: str) -> list[BudgetAllocation]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(BudgetAllocation(
            allocation_id=_safe_str(r["allocation_id"]),
            dept_id=_safe_str(r["dept_id"]),
            category=_safe_str(r["category"]),
            tranche_id=_safe_str(r["tranche_id"]),
            amount_inr=_safe_float(r["amount_inr"]),
        ))
    return result


def _load_work_packages(path: str) -> list[WorkPackage]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        raw_status = _safe_str(r.get("status", "not_started")).lower().strip()
        # normalise "In Progress" → "in_progress"
        status_map = {
            "in progress": "in_progress",
            "not started": "not_started",
            "not_started": "not_started",
            "in_progress": "in_progress",
            "completed": "completed",
        }
        status = status_map.get(raw_status, raw_status)
        result.append(WorkPackage(
            task_id=_safe_str(r["task_id"]),
            parent_task_id=_safe_str(r.get("parent_task_id")) or None,
            dept_id=_safe_str(r["dept_id"]),
            task_name=_safe_str(r["task_name"]),
            component_id=_safe_str(r.get("component_id")) or None,
            owner_researcher_id=_safe_str(r.get("owner_researcher_id")) or None,
            planned_start=_parse_date(r.get("planned_start")),
            planned_end=_parse_date(r.get("planned_end")),
            actual_start=_parse_date(r.get("actual_start")),
            actual_end=_parse_date(r.get("actual_end")),
            status=status,
        ))
    return result


def _load_task_dependencies(path: str) -> list[TaskDependency]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(TaskDependency(
            predecessor_task_id=_safe_str(r["predecessor_task_id"]),
            successor_task_id=_safe_str(r["successor_task_id"]),
            dependency_type=_safe_str(r["dependency_type"]),
            lag_days=_safe_int(r.get("lag_days", 0)),
        ))
    return result


def _load_milestones(path: str) -> list[Milestone]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        linked_raw = _safe_str(r.get("linked_task_ids", ""))
        linked = [t.strip() for t in linked_raw.split(";") if t.strip()]
        result.append(Milestone(
            milestone_id=_safe_str(r["milestone_id"]),
            milestone_name=_safe_str(r["milestone_name"]),
            due_date=_parse_date(r.get("due_date")),
            linked_task_ids=linked,
            releases_tranche_id=_safe_str(r.get("releases_tranche_id")) or None,
            reported_status=_safe_str(r.get("reported_status", "on_track")),
        ))
    return result


def _load_progress_updates(path: str) -> list[ProgressUpdate]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(ProgressUpdate(
            update_id=_safe_str(r["update_id"]),
            task_id=_safe_str(r["task_id"]),
            report_date=_parse_date(r.get("report_date")),
            percent_complete=_safe_float(r.get("percent_complete", 0)),
            reported_by=_safe_str(r.get("reported_by", "")),
            blocker=_safe_str(r.get("blocker")) or None,
            note=_safe_str(r.get("note")) or None,
        ))
    return result


def _load_components(path: str) -> list[Component]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(Component(
            component_id=_safe_str(r["component_id"]),
            parent_component_id=_safe_str(r.get("parent_component_id")) or None,
            component_name=_safe_str(r["component_name"]),
            component_type=_safe_str(r["component_type"]),
            owner_dept_id=_safe_str(r["owner_dept_id"]),
            quantity=_safe_float(r.get("quantity", 1)),
            unit_cost_inr=_safe_float(r.get("unit_cost_inr", 0)),
            governing_task_id=_safe_str(r.get("governing_task_id")) or None,
            status=_safe_str(r.get("status", "planned")),
        ))
    return result


def _load_component_dependencies(path: str) -> list[ComponentDependency]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(ComponentDependency(
            component_id=_safe_str(r["component_id"]),
            depends_on_component_id=_safe_str(r["depends_on_component_id"]),
            dependency_type=_safe_str(r["dependency_type"]),
        ))
    return result


def _load_purchase_orders(path: str) -> list[PurchaseOrder]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(PurchaseOrder(
            po_id=_safe_str(r["po_id"]),
            dept_id=_safe_str(r["dept_id"]),
            vendor=_safe_str(r["vendor"]),
            component_id=_safe_str(r.get("component_id")) or None,
            category=_safe_str(r["category"]),
            po_amount_inr=_safe_float(r["po_amount_inr"]),
            order_date=_parse_date(r.get("order_date")),
            expected_delivery=_parse_date(r.get("expected_delivery")),
            actual_delivery=_parse_date(r.get("actual_delivery")),
            po_status=_safe_str(r.get("po_status", "open")),
        ))
    return result


def _load_expenditures(path: str) -> list[Expenditure]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(Expenditure(
            expense_id=_safe_str(r["expense_id"]),
            dept_id=_safe_str(r["dept_id"]),
            allocation_id=_safe_str(r["allocation_id"]),
            category=_safe_str(r["category"]),
            po_id=_safe_str(r.get("po_id")) or None,
            vendor=_safe_str(r.get("vendor")) or None,
            amount_inr=_safe_float(r["amount_inr"]),
            expense_date=_parse_date(r.get("expense_date")),
            description=_safe_str(r.get("description")) or None,
            invoice_no=_safe_str(r.get("invoice_no")) or None,
            requested_by=_safe_str(r.get("requested_by", "")),
            approved_by=_safe_str(r.get("approved_by", "")),
        ))
    return result


def _load_timesheets(path: str) -> list[Timesheet]:
    df = pd.read_csv(path, dtype=str)
    result = []
    for _, r in df.iterrows():
        result.append(Timesheet(
            researcher_id=_safe_str(r["researcher_id"]),
            week_start=_parse_date(r.get("week_start")),
            task_id=_safe_str(r.get("task_id")) or None,
            activity=_safe_str(r.get("activity")) or None,
            hours=_safe_float(r.get("hours", 0)),
        ))
    return result


def load_project_data(data_dir: str = DATA_DIR) -> ProjectData:
    def p(name: str) -> str:
        return os.path.join(data_dir, name)

    return ProjectData(
        departments=_load_departments(p("departments.csv")),
        researchers=_load_researchers(p("researchers.csv")),
        tranches=_load_tranches(p("funding_tranches.csv")),
        allocations=_load_allocations(p("budget_allocations.csv")),
        work_packages=_load_work_packages(p("work_packages.csv")),
        task_dependencies=_load_task_dependencies(p("task_dependencies.csv")),
        milestones=_load_milestones(p("milestones.csv")),
        progress_updates=_load_progress_updates(p("progress_updates.csv")),
        components=_load_components(p("components.csv")),
        component_dependencies=_load_component_dependencies(p("component_dependencies.csv")),
        purchase_orders=_load_purchase_orders(p("purchase_orders.csv")),
        expenditures=_load_expenditures(p("expenditures.csv")),
        timesheets=_load_timesheets(p("timesheets.csv")),
    )


@lru_cache(maxsize=1)
def get_data() -> ProjectData:
    return load_project_data()
