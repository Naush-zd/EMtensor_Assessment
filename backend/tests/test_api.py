"""API smoke tests: endpoints return 200 with expected shape."""
import os
import pytest
from fastapi.testclient import TestClient

os.environ["DATA_DIR"] = os.path.join(os.path.dirname(__file__), "..", "..", "data")


@pytest.fixture(scope="module")
def client():
    from app.loader import get_data
    get_data.cache_clear()
    from app.main import app
    return TestClient(app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_overview(client):
    r = client.get("/api/overview")
    assert r.status_code == 200
    body = r.json()
    assert "overall_pct_complete" in body
    assert "milestones" in body
    assert "tranches" in body
    assert len(body["tranches"]) == 4


def test_departments(client):
    r = client.get("/api/departments")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 8
    dept_ids = {d["dept_id"] for d in body}
    assert "SIT" in dept_ids and "EMS" in dept_ids


def test_department_detail(client):
    r = client.get("/api/departments/SIT")
    assert r.status_code == 200
    body = r.json()
    assert body["dept_id"] == "SIT"
    assert "tasks" in body
    assert "researchers" in body


def test_budget(client):
    r = client.get("/api/budget")
    assert r.status_code == 200
    body = r.json()
    assert "grant_total_inr" in body
    assert "spent_total_inr" in body
    assert body["grant_total_inr"] > 0


def test_tasks(client):
    r = client.get("/api/tasks")
    assert r.status_code == 200
    tasks = r.json()
    assert len(tasks) > 0
    assert all("task_id" in t for t in tasks)


def test_task_dependencies(client):
    r = client.get("/api/tasks/dependencies")
    assert r.status_code == 200
    body = r.json()
    assert "nodes" in body and "edges" in body


def test_people(client):
    r = client.get("/api/people")
    assert r.status_code == 200
    people = r.json()
    assert len(people) == 61


def test_anomalies(client):
    r = client.get("/api/anomalies")
    assert r.status_code == 200
    anomalies = r.json()
    assert isinstance(anomalies, list)
    if anomalies:
        assert "rule_id" in anomalies[0]
        assert "severity" in anomalies[0]
        assert "message" in anomalies[0]


def test_department_not_found(client):
    r = client.get("/api/departments/DOESNOTEXIST")
    assert r.status_code == 404
