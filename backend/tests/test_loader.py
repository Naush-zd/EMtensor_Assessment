"""Tests that every CSV loads without crashing and key fields have the right types."""
import os
import pytest
from datetime import date

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


def _loader():
    from app.loader import load_project_data
    return load_project_data(DATA_DIR)


def test_all_csvs_load():
    data = _loader()
    assert len(data.departments) > 0
    assert len(data.researchers) > 0
    assert len(data.tranches) > 0
    assert len(data.allocations) > 0
    assert len(data.work_packages) > 0
    assert len(data.task_dependencies) > 0
    assert len(data.milestones) > 0
    assert len(data.progress_updates) > 0
    assert len(data.components) > 0
    assert len(data.component_dependencies) > 0
    assert len(data.purchase_orders) > 0
    assert len(data.expenditures) > 0
    assert len(data.timesheets) > 0


def test_dept_budget_is_float():
    data = _loader()
    for d in data.departments:
        assert isinstance(d.total_budget_inr, float)


def test_researcher_allocation_is_float():
    data = _loader()
    for r in data.researchers:
        assert isinstance(r.project_allocation_pct, float)


def test_dates_are_date_or_none():
    data = _loader()
    for t in data.tranches:
        assert t.actual_release is None or isinstance(t.actual_release, date)
    for wp in data.work_packages:
        assert wp.planned_start is None or isinstance(wp.planned_start, date)


def test_milestone_linked_tasks_parsed():
    data = _loader()
    m2 = next(m for m in data.milestones if m.milestone_id == "M2")
    assert "PUR-03" in m2.linked_task_ids
    assert "PVE-02" in m2.linked_task_ids


def test_tranche_status():
    data = _loader()
    released = [t for t in data.tranches if t.status == "released"]
    assert len(released) == 2  # T1 and T2


def test_work_package_status_normalised():
    data = _loader()
    # COM-04 has "In Progress" in raw data; should be normalised
    com04 = next((wp for wp in data.work_packages if wp.task_id == "COM-04"), None)
    assert com04 is not None
    assert com04.status == "in_progress"


def test_expenditure_amounts_are_floats():
    """Amounts are floats; negative values (adjustments/credits) are valid messy-data."""
    data = _loader()
    for e in data.expenditures:
        assert isinstance(e.amount_inr, float)
