# Assignment K04: Surya Gram: 12-Village Solar Microgrid

Time allowed: 7 days · Expected effort: 12–16 hours · Data "as of" date: **15 September 2026**

## The situation

**Tribal Development Energy Cooperative, Nandurbar** received a government grant of about **₹29.6 crore** from the **Ministry of New & Renewable Energy**. The cooperative is electrifying 12 villages with a solar microgrid: site works, grid interconnection, battery containers with thermal management, four PV arrays, smart metering, an energy-management system, and household connections with a fair tariff.

The grant is released in four tranches, and each tranche is released only after the funding agency verifies a milestone.
Eight departments share the work:

- **Site & Civil Works (SIT):** Land levelling, foundations, fencing, fire safety
- **Grid & Distribution (GRD):** Substation, inverter station, backup genset, array feeders
- **Battery Thermal Systems (THM):** Container HVAC, coolant loop, fire suppression
- **PV & Storage Engineering (PVE):** PV arrays, battery containers, metering network
- **Energy Management Software (EMS):** Data historian, EMS, billing, consumer app
- **Community & Tariff (COM):** Household survey, connections, tariff, village handover
- **Procurement (PUR):** Tendering, evaluation, award
- **Project Office (PMO):** Governance, MNRE reporting, contingency

At the moment, every office keeps its own spreadsheet. The project head learns about problems late. Department heads
cannot see when another department is blocking them. The funding agency's last review asked uncomfortable questions
about spending. The exports from those spreadsheets are in `data/`. They are **real-world messy**: some records conflict
with each other or break project rules, and nobody has checked.

**Build a web application that lets everyone involved understand where the project stands, where the money went, what
depends on what, and what needs attention now.**

## Who uses it

- **Project Director:** will villages be energised before monsoon, is the next MNRE tranche at risk
- **Department heads (8):** their work, budget and staff, and whatever blocks them
- **Accounts:** grant received vs allocated vs spent, audit exceptions
- **Engineers, technicians & field staff:** their assignments and hours
- **MNRE reviewer (read-only):** plain-language status

You will not satisfy everyone equally in 7 days. Deciding whom to serve first, and how, is part of the assignment.

## Project rules (the data should follow these, and some of it does not)

1. A department may spend only from allocations whose tranche has been **released**.
2. Equipment or civil works above **₹5,00,000** must go through a **purchase order**. Total payments on a PO must not exceed the PO value.
3. The requester and the approver of an expense must be different people. People who have left the project cannot approve expenses or log hours.
4. Task dependencies are **finish-to-start**: a task cannot start before its predecessors finish, or finish before them.
5. A component can be installed only when every component it depends on (ems, metering, physical_space, power, thermal) is installed.
6. 100% allocation = 40 hours per week.
7. Milestone status is self-reported by the project office.

## What you have

`data/` contains one CSV file per table, plus `component_hierarchy.json`. Read `data/README.md` for the data dictionary
and `HIERARCHY.md` for how the work breakdown and the component tree relate. You may reshape the data however you like,
but **the CSV files are the source of truth**. Your app must load them as provided, without hand-editing.

## What to build

**Core (everyone):**

- A **FastAPI** backend (Python, Pydantic models) that loads the CSVs, validates them, and serves the API your UI needs.
- A **React** frontend that covers these areas:
  1. Overall project progress and milestone and tranche status.
  2. Department-level views.
  3. Dependencies, both between tasks and between components, in a form a non-engineer can follow.
  4. Budget: received, allocated, spent.
  5. A simple people table (the `researchers.csv` file lists everyone on the project).
- **Anomaly detection:** the app should surface records that break the rules above, or look suspicious, and explain each one in plain language.
- Tests for the parts you consider most important.
- Everything runs with a single `docker compose up`.

**Stretch (optional, pick what showcases you):**

- A **Node.js** service, for example a weekly digest or notification service, or a CSV watcher that re-imports when files change.
- "What if" analysis: what happens downstream if a task slips by N days.
- Role-based views.
- Accessibility.
- Responsive or tablet layout.
- Export for the funding agency.
- Anything else you believe the users need.

We deliberately left gaps. **Questions are welcome and are part of the evaluation.** Send them to the channel below within
the first 48 hours. All answers are published in a shared FAQ, so read it.

## What to submit

1. A Git repository with a **real history**: branches, meaningful commits, and at least one PR with a description. Please do not squash.
2. `README.md`: how to run it, and a 5-minute tour for a first-time user.
3. `DECISIONS.md` (max 2 pages): which users you prioritised and why, how you decided what counts as an anomaly, what you rejected, what you would do next.
4. A wireframe or sketch made **before** coding. A photo of paper is fine.
5. `AI_USAGE.md`: AI tools are allowed. Tell us where you used them and what you changed or rejected.
6. Optional: a 3–5 minute screen recording walking through the app as the project head.

## How we will judge it

- **Clarity for the end user:** can a busy person understand the project's state in under a minute, and find the detail when they need it?
- **Information design:** are hierarchy, dependencies, money and time shown in ways that fit the data?
- **Correctness:** are your numbers and flags right? Does the app cope with messy data without crashing or silently hiding it?
- **Code quality:** structure, naming, typing, separation of concerns, tests, API design, and whether we could hand your repo to a teammate.
- **Engineering process:** Git history, how you handled the mid-assignment update, and how well you explain your decisions.

A small number of well-crafted, well-reasoned screens beats a large number of shallow ones.
