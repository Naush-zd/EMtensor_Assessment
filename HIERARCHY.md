# How the project fits together

There are **two hierarchies** and **two kinds of dependency**. Most of the interesting questions come from where they meet.

## 1. Work hierarchy: who does what, and when (`work_packages.csv`)

```
Surya Gram: 12-Village Solar Microgrid
├── WP-SIT  Site & Civil Works                 ── SIT-01 … SIT-07
├── WP-GRD  Grid & Distribution                ── GRD-01 … GRD-07
├── WP-THM  Battery Thermal Systems            ── THM-01 … THM-06
├── WP-PVE  PV & Storage Engineering           ── PVE-01 … PVE-10
├── WP-EMS  Energy Management Software         ── EMS-01 … EMS-08
├── WP-COM  Community & Tariff                 ── COM-01 … COM-05
├── WP-PUR  Procurement                        ── PUR-01 … PUR-03
└── WP-PMO  Project Office                     ── PMO-01 … PMO-04
```

**Task dependencies** (`task_dependencies.csv`) cross department lines. This is the main source of friction. One example chain:

```
SIT-04 Foundations & array structures  ──►  GRD-04 Inverter station commissioning  ──►  GRD-05 Array feeders
  ──►  PVE-04 PV arrays 1-2 installation  ──►  EMS-05 Dispatch & scheduling module  ──►  COM-04 72-hour islanded test
```

If the first task in this chain is late, every task after it is late, and a later tranche is at risk.

## 2. Component hierarchy: what is being built (`components.csv`)

```
MGR-001 Surya Gram Microgrid  (system)
├── SIT-001 Microgrid site  (subsystem, SIT)
│   ├── SIT-FND Foundations & array structures
│   ├── SIT-FIRE Fire safety system
│   └── SIT-FEN Fencing & surveillance
├── GRD-001 Grid & distribution  (subsystem, GRD)
│   ├── GRD-SUB 11 kV substation
│   ├── GRD-INV Central inverter
│   ├── GRD-DG Backup genset
│   └── GRD-FDR Array feeders ── 6 × part (GRD-FDR-R1 … GRD-FDR-G2)
├── THM-001 Battery thermal system  (subsystem, THM)
│   ├── THM-HVAC Container HVAC plant
│   ├── THM-LOOP Coolant loop
│   ├── THM-CHL Container chiller
│   └── THM-RCU Rack cooling units ── 6 × part (THM-RCU-R1 … THM-RCU-G2)
├── MTR-001 Metering & comms network  (subsystem, PVE)
│   ├── MTR-HEG-01 Head-end gateway 1
│   ├── MTR-HEG-02 Head-end gateway 2
│   ├── MTR-ACU-R1 Array comms unit 1
│   ├── MTR-ACU-R2 Array comms unit 2
│   ├── MTR-ACU-R3 Array comms unit 3
│   ├── MTR-ACU-R4 Array comms unit 4
│   ├── MTR-ACU-G1 Container comms unit 1
│   └── MTR-ACU-G2 Container comms unit 2
├── HIS-001 Data historian  (subsystem, EMS)
│   ├── HIS-SRV Historian servers
│   ├── HIS-APP Application servers
│   └── HIS-STR Storage shelves
├── GEN-001 Generation & storage  (subsystem, PVE)
│   ├── GEN-PV PV arrays ── 4 × unit (GEN-PV-R1 … GEN-PV-R4)
│   │       each unit: 16 × sub_unit, each with String fuse ×2, PV module 540 W ×12
│   └── GEN-BAT Battery containers ── 2 × unit (GEN-BAT-R1 … GEN-BAT-R2)
│           each unit: 8 × sub_unit, each with BMS controller ×2, Battery module ×4, Cell sensor ×16
├── EMS-001 Energy management software  (subsystem, EMS)
│   ├── EMS-BASE EMS baseline
│   ├── EMS-DSP Dispatch & scheduling
│   ├── EMS-MON Monitoring dashboards
│   └── EMS-APPB Consumer app & billing
└── CMY-001 Community readiness  (subsystem, COM)
    ├── CMY-CON Household connections
    ├── CMY-TRF Tariff & billing rules
    └── CMY-ISL Islanded test
```

The tree is 6 levels deep and has 315 components. Cost rolls up the tree (`quantity × unit_cost_inr` of a node plus all its descendants).

**Component dependencies** (`component_dependencies.csv`) describe what a part needs in order to run. For example, **PV array 1** needs Feeder array 1 (power), Array inverter cooling 1 (thermal), Array comms unit 1 (metering), Foundations & array structures (physical_space).
That part belongs to **Rack cooling units**, which in turn needs **Container chiller**, which needs **Coolant loop**, which needs **Container HVAC plant**, which needs **11 kV substation**.

## 3. Where they meet

- Each task can point to the component it delivers (`work_packages.component_id`). Each component names the task that governs its status (`components.governing_task_id`).
- Purchase orders buy components. Expenditures pay purchase orders. Allocations fund expenditures. Tranches fund allocations. Milestones release tranches, and milestones depend on tasks.

So you can follow one chain from **a late delivery on site to a tranche of government money being at risk**. Showing chains like that simply is the heart of this assignment.
