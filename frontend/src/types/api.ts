export interface OverviewData {
  as_of: string
  grant_total_inr: number
  released_total_inr: number
  overall_pct_complete: number
  tasks_total: number
  tasks_completed: number
  tasks_in_progress: number
  tasks_not_started: number
  milestones: Milestone[]
  tranches: Tranche[]
  dept_progress: Record<string, DeptProgress>
}

export interface Milestone {
  milestone_id: string
  milestone_name: string
  due_date: string | null
  releases_tranche_id: string | null
  reported_status: string
  linked_task_ids: string[]
}

export interface Tranche {
  tranche_id: string
  pct_of_grant: number
  amount_inr: number
  condition_milestone_id: string
  expected_release: string | null
  actual_release: string | null
  status: string
}

export interface DeptProgress {
  total: number
  completed: number
  in_progress: number
}

export interface Department {
  dept_id: string
  dept_name: string
  scope: string
  total_budget_inr: number
  allocated_inr: number
  spent_inr: number
  head_researcher_id: string
  researcher_count: number
  tasks_total: number
  tasks_completed: number
  tasks_in_progress: number
  pct_complete: number
}

export interface DepartmentDetail extends Department {
  allocated_total_inr: number
  allocated_released_inr: number
  spent_total_inr: number
  tasks: Task[]
  latest_progress: Record<string, ProgressUpdate>
  researchers: ResearcherSummary[]
  anomalies: Anomaly[]
}

export interface Task {
  task_id: string
  parent_task_id: string | null
  dept_id: string
  task_name: string
  status: string
  component_id: string | null
  owner_researcher_id: string | null
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  latest_progress?: ProgressUpdate | null
}

export interface ProgressUpdate {
  percent_complete: number
  report_date: string | null
  blocker: string | null
  note?: string | null
}

export interface ResearcherSummary {
  researcher_id: string
  full_name: string
  role: string
  status: string
  project_allocation_pct: number
}

export interface BudgetData {
  grant_total_inr: number
  released_total_inr: number
  allocated_total_inr: number
  allocated_released_inr: number
  spent_total_inr: number
  unspent_released_inr: number
  tranches: Tranche[]
  by_dept: BudgetByDept[]
}

export interface BudgetByDept {
  dept_id: string
  dept_name: string
  budget_inr: number
  allocated_inr: number
  allocated_released_inr: number
  spent_inr: number
  by_category: Record<string, { allocated_inr: number; spent_inr: number }>
}

export interface TaskDependencyGraph {
  nodes: TaskNode[]
  edges: TaskEdge[]
}

export interface TaskNode {
  id: string
  label: string
  dept_id: string
  status: string
  is_work_package: boolean
}

export interface TaskEdge {
  source: string
  target: string
  lag_days: number
}

export interface ComponentTree {
  tree: ComponentNode[]
  total: number
}

export interface ComponentNode {
  component_id: string
  component_name: string
  component_type: string
  owner_dept_id: string
  quantity: number
  unit_cost_inr: number
  governing_task_id: string | null
  status: string
  children: ComponentNode[]
}

export interface Person {
  researcher_id: string
  full_name: string
  dept_id: string
  dept_name: string
  role: string
  email: string
  project_allocation_pct: number
  monthly_cost_inr: number
  joined_on: string | null
  left_on: string | null
  status: string
}

export interface Anomaly {
  rule_id: string
  severity: 'error' | 'warning'
  entity_type: string
  entity_id: string
  message: string
  detail: string
}
