import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type AreaOfLife = 'Personal' | 'Professional' | 'Financial' | 'Health & Wealth' | 'Relationships' | 'Vision & Mission' | 'Other'
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed'
export type Priority = 'Low' | 'Medium' | 'High'
export type HabitCategory = 'Morning' | 'Midday' | 'Evening'
export type NoteType = 'Note' | 'Resource'

export interface Project {
  id: string
  name: string
  area_of_life: AreaOfLife
  status: ProjectStatus
  created_at: string
  user_id?: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  due_date_time: string | null
  tags: string[]
  reminder: string | null
  priority: Priority
  location: string | null
  deadline: string | null
  file_url: string | null
  project_id: string | null
  parent_task_id: string | null
  is_completed: boolean
  created_at: string
  user_id?: string
}

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  created_at: string
  user_id?: string
}

export interface HabitLog {
  id: string
  habit_id: string
  log_date: string
  is_completed: boolean
}

export interface NoteResource {
  id: string
  title: string
  content: string | null
  type: NoteType
  project_id: string | null
  file_url: string | null
  created_at: string
  user_id?: string
}
