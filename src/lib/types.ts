export type Role = 'admin' | 'employee'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type ProjectStatus = 'active' | 'completed' | 'archived'

export interface Profile {
  id: string
  name: string
  role: Role
  created_at: string
}

export interface Shift {
  id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  note?: string
  profiles?: Profile
}

export interface Attendance {
  id: string
  user_id: string
  date: string
  clock_in?: string
  clock_out?: string
  break_minutes?: number
  profiles?: Profile
}

export interface Project {
  id: string
  name: string
  description?: string
  due_date?: string
  status: ProjectStatus
  created_by?: string
}

export interface Task {
  id: string
  project_id?: string
  assigned_to?: string
  title: string
  description?: string
  progress: number
  due_date?: string
  status: TaskStatus
  created_at: string
  updated_at: string
  profiles?: Profile
  projects?: Project
}
