# DECISIONS.md

## Which users we prioritised

**Primary: Project Director and MNRE reviewer.**

The assignment says "A small number of well-crafted, well-reasoned screens beats a large number of shallow ones." The single most valuable thing a busy Project Director needs is to answer: *Will the villages be energised before monsoon, and is the next tranche at risk?* That shaped every design choice.

The Overview page is designed to answer both questions in under 30 seconds:
- Overall % complete and task counts in the hero row
- Tranche release status (T1+T2 released, T3+T4 pending with their milestone conditions)
- Milestone status (self-reported, flagged in the anomaly panel when at-risk)
- Per-department progress bars showing where the project is slow

**Secondary: Department heads.** The Departments page gives each head their own view — tasks, people, budget spent vs. allocated, and anomalies scoped to their department.

**Accounts / MNRE reviewer** are served by the Budget page (grant → released → allocated → spent waterfall with category breakdowns).

We did not build role-based views — everyone sees everything. That would be the next step with a real auth layer.

## What counts as an anomaly

We implemented the 8 rules in the assignment brief literally:

| Rule | Description |
|------|-------------|
| R1 | Expense draws from an allocation whose tranche is not released |
| R2 | Total payments on a PO exceed the PO value |
| R3 | Same person requested and approved an expense |
| R4 | Person who has exited approved an expense or logged hours after their exit date |
| R5 | Task started before its predecessor finished (finish-to-start violation) |
| R6 | Component is installed but a dependency it requires is not yet installed |
| R7 | Researcher logged more hours in a week than their allocation % allows |
| R8 | Equipment/civil-works expense above ₹5,00,000 has no purchase order |

Severity is **error** when the rule is clear-cut and financial (R1, R2, R3, R8) or operationally impossible (R6). It is **warning** for situations that may have a legitimate explanation (R4 requester side, R5, R7) or where the data is self-reported and we're flagging a likely mistake rather than a definite one.

We do not flag:
- Negative expenditures (EX00241 is a credit adjustment — legitimate accounting)
- Tasks with "In Progress" instead of "in_progress" in the status field — we normalise these at load time rather than treating them as anomalies

## What we rejected / cut

- **What-if analysis** (stretch goal): would require a proper scheduling engine. Not worth implementing shallowly.
- **Node-edge SVG DAG** with D3/layout: 58 leaf tasks + 69 edges is too many to lay out legibly in a fixed-size SVG without a proper graph layout library. We chose a card grid with inline edge counts instead — more readable for a non-engineer audience.
- **Role-based views**: needs auth; out of scope for a 7-day prototype.
- **CSV watcher Node.js service**: nice but adds complexity without changing the core value.

## What we would do next

1. Auto-refresh data every N minutes (already structured around a singleton `get_data()`; add cache invalidation).
2. Role-based views: Project Director, Dept Head, Accounts, MNRE (read-only).
3. Proper graph layout for the task DAG (dagre-d3 or similar).
4. Export to PDF for MNRE review meetings.
5. "What if task X slips by N days" impact analysis propagating through the dependency chain.
