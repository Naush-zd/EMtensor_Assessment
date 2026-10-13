from __future__ import annotations
from datetime import date
from typing import Optional
from pydantic import BaseModel


class Department(BaseModel):
    dept_id: str
    dept_name: str
    scope: str
    total_budget_inr: float
    head_researcher_id: str


class Researcher(BaseModel):
    researcher_id: str
    full_name: str
    dept_id: str
    role: str
    email: str
    project_allocation_pct: float
    monthly_cost_inr: float
    joined_on: Optional[date]
    left_on: Optional[date]
    status: str  # active / on_leave / exited


class FundingTranche(BaseModel):
    tranche_id: str
    pct_of_grant: float
    amount_inr: float
    condition_milestone_id: str
    expected_release: Optional[date]
    actual_release: Optional[date]
    status: str  # released / pending


class BudgetAllocation(BaseModel):
    allocation_id: str
    dept_id: str
    category: str
    tranche_id: str
    amount_inr: float


class WorkPackage(BaseModel):
    task_id: str
    parent_task_id: Optional[str]
    dept_id: str
    task_name: str
    component_id: Optional[str]
    owner_researcher_id: Optional[str]
    planned_start: Optional[date]
    planned_end: Optional[date]
    actual_start: Optional[date]
    actual_end: Optional[date]
    status: str  # not_started / in_progress / completed


class TaskDependency(BaseModel):
    predecessor_task_id: str
    successor_task_id: str
    dependency_type: str
    lag_days: int


class Milestone(BaseModel):
    milestone_id: str
    milestone_name: str
    due_date: Optional[date]
    linked_task_ids: list[str]
    releases_tranche_id: Optional[str]
    reported_status: str  # achieved / on_track / at_risk / delayed


class ProgressUpdate(BaseModel):
    update_id: str
    task_id: str
    report_date: Optional[date]
    percent_complete: float
    reported_by: str
    blocker: Optional[str]
    note: Optional[str]


class Component(BaseModel):
    component_id: str
    parent_component_id: Optional[str]
    component_name: str
    component_type: str
    owner_dept_id: str
    quantity: float
    unit_cost_inr: float
    governing_task_id: Optional[str]
    status: str  # planned / ordered / delivered / in_progress / installed / tested


class ComponentDependency(BaseModel):
    component_id: str
    depends_on_component_id: str
    dependency_type: str  # ems / metering / physical_space / power / thermal


class PurchaseOrder(BaseModel):
    po_id: str
    dept_id: str
    vendor: str
    component_id: Optional[str]
    category: str
    po_amount_inr: float
    order_date: Optional[date]
    expected_delivery: Optional[date]
    actual_delivery: Optional[date]
    po_status: str  # open / closed / cancelled


class Expenditure(BaseModel):
    expense_id: str
    dept_id: str
    allocation_id: str
    category: str
    po_id: Optional[str]
    vendor: Optional[str]
    amount_inr: float
    expense_date: Optional[date]
    description: Optional[str]
    invoice_no: Optional[str]
    requested_by: str
    approved_by: str


class Timesheet(BaseModel):
    researcher_id: str
    week_start: Optional[date]
    task_id: Optional[str]
    activity: Optional[str]
    hours: float
