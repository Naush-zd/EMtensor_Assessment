# Surya Gram Dashboard

Project management dashboard for the **Surya Gram 12-Village Solar Microgrid** (K04), a ₹29.6 crore MNRE-funded grant.

## Quick start

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DATA_DIR=../data uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # starts at http://localhost:3000, proxies /api to :8000
```

**Tests:**
```bash
cd backend
DATA_DIR=../data python -m pytest tests/ -v
```

## 5-minute tour

1. **Overview** — land here first. See overall % complete, which tranches are released, milestone status, and per-department progress bars at a glance.

2. **Anomaly banner** — a red bar at the top counts rule violations (e.g. same person approved their own expense, exited staff still logging hours). Click "View all anomalies" to open a side panel with plain-language descriptions of every finding.

3. **Departments** — click any department card to drill into its tasks, staff, budget, and anomalies.

4. **Budget** — waterfall from grant total → released → allocated → spent. Red cells flag over-allocation. Category breakdown table at the bottom.

5. **Dependencies** — Task tab: each task card shows its incoming/outgoing dependency count, colour-coded by status. Filter by department. Edge list shows the full chain. Component tab: lists all 43 component dependency edges by type (power, thermal, metering, etc.).

6. **People** — search and filter all 61 researchers. Exited staff shown greyed out.

## Data

All data lives in `data/` and is loaded read-only at startup. The app tolerates messy data (invalid dates become null, negative amounts such as credit adjustments are preserved).

## API

| Endpoint | Description |
|---|---|
| `GET /api/overview` | Project summary, milestones, tranches |
| `GET /api/departments` | All departments with budget+progress |
| `GET /api/departments/{id}` | Department detail |
| `GET /api/budget` | Full budget waterfall |
| `GET /api/tasks` | All tasks with latest progress |
| `GET /api/tasks/dependencies` | DAG edge list |
| `GET /api/components` | Component tree |
| `GET /api/components/dependencies` | Component dep edge list |
| `GET /api/people` | All researchers |
| `GET /api/anomalies` | All detected rule violations |
