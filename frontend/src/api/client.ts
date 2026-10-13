import type {
  OverviewData, Department, DepartmentDetail, BudgetData,
  Task, TaskDependencyGraph, ComponentTree, Person, Anomaly,
} from '../types/api'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`)
  return res.json()
}

export const api = {
  overview: () => get<OverviewData>('/overview'),
  departments: () => get<Department[]>('/departments'),
  department: (id: string) => get<DepartmentDetail>(`/departments/${id}`),
  budget: () => get<BudgetData>('/budget'),
  tasks: () => get<Task[]>('/tasks'),
  taskDependencies: () => get<TaskDependencyGraph>('/tasks/dependencies'),
  components: () => get<ComponentTree>('/components'),
  people: () => get<Person[]>('/people'),
  anomalies: () => get<Anomaly[]>('/anomalies'),
}
