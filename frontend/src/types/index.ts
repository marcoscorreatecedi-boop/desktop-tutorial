export interface Project {
  id: number
  name: string
  address: string
  start_date: string
  end_date?: string
  overall_progress: number
  created_at: string
}

export interface Analysis {
  id: number
  stage_identified: string
  progress_percentage: number
  description: string
  tasks_completed: string[]
  issues_found: string[]
  recommendations: string[]
  confidence: number
  created_at: string
}

export interface Upload {
  id: number
  project_id: number
  filename: string
  original_name: string
  file_type: 'photo' | 'audio' | 'other'
  notes: string
  analyzed: boolean
  created_at: string
  analysis?: Analysis | null
}

export interface Stage {
  id: number
  project_id: number
  name: string
  order_num: number
  dependencies: number[]
  planned_start: string
  planned_end: string
  actual_start?: string
  actual_end?: string
  duration_days: number
  progress: number
  is_critical: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  early_start: number
  early_finish: number
  late_start: number
  late_finish: number
  float_time: number
}

export interface DashboardStats {
  project: {
    id: number
    name: string
    address: string
    start_date: string
    overall_progress: number
  }
  stats: {
    total_stages: number
    completed_stages: number
    in_progress_stages: number
    delayed_stages: number
    total_uploads: number
    analyzed_uploads: number
    total_issues: number
    critical_path_length: number
  }
  recent_issues: string[]
  critical_stages: Stage[]
}
