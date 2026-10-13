# AI_USAGE.md

## AI tools used

**Claude Sonnet 4.6 (via Claude Code CLI)** was used throughout this project.

## Where AI was used

### Planning
- Helped identify which problem statement (K04 Surya Gram) was the best fit given the 7-day constraint, based on domain simplicity.
- Designed the project structure, API surface, and anomaly detection rules — reviewed and approved before implementation began.

### Backend
- `loader.py`: AI generated the initial CSV parsing logic with `pandas` + safe helper functions. Reviewed and verified that messy-data edge cases (empty dates, commas in numbers, "In Progress" vs. "in_progress") are handled correctly.
- `models.py`: AI generated Pydantic models. Field optionality was cross-checked against actual CSV data.
- `anomalies.py`: AI drafted all 8 rules. Each rule was verified against the data by hand (e.g. confirmed R3 fires, confirmed R1 count matches manual count of expenses on unreleased tranches).
- All routers: AI generated initial implementations. Reviewed for correctness of budget aggregation logic.

### Tests
- AI generated test stubs. The `test_expenditure_amounts_positive` test was corrected after discovering EX00241 is a legitimate credit adjustment (-₹297,340) — AI had assumed all amounts would be positive.

### Frontend
- AI generated all React/TypeScript components, Tailwind styling, and API client. The layout and colour choices were reviewed and accepted.

## What was changed or rejected

- **Rejected**: AI initially proposed a D3-based SVG DAG for task dependencies. This was replaced with a simpler card-grid approach after recognising that 58 nodes + 69 edges would be unreadable without a proper graph layout algorithm.
- **Changed**: Initial test for expenditure amounts was corrected to allow negative values (credit adjustments).
- **Changed**: `_parse_date` was left with `dayfirst=False` intentionally to match ISO date format in the data, despite a pandas warning.
- **Accepted as-is**: All anomaly rules, budget aggregation logic, component tree builder.
