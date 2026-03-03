'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Project, Task, Habit, HabitLog, NoteResource } from '@/lib/supabase'
import Auth from './components/Auth'
import Navigation from './components/Navigation'
import { TaskModal } from './components/TaskComponents'
import { ProjectModal, HabitModal, NoteModal } from './components/OtherComponents'
import { Dashboard, TasksView, ProjectsView, HabitsView, NotesView } from './components/Views'

// ── Register service worker + request notifications ───────────────────────────
async function requestNotificationPermission () {
  if (!('Notification' in window)) return
  const perm = await Notification.requestPermission()
  if (perm === 'granted' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered')
    } catch (e) { console.error('SW registration failed', e) }
  }
}

// ── Reminder polling (check every minute) ────────────────────────────────────
function useReminderNotifications (tasks: Task[]) {
  useEffect(() => {
    const check = () => {
      if (Notification.permission !== 'granted') return
      const now = Date.now()
      tasks.forEach(t => {
        if (!t.reminder || t.is_completed) return
        const rem = new Date(t.reminder).getTime()
        if (rem > now && rem - now < 60000) {
          new Notification('LifeSync Reminder', { body: t.title, icon: '/icon-192.png' })
        }
      })
    }
    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [tasks])
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App () {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([])
  const [notes, setNotes] = useState<NoteResource[]>([])

  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: Task | null }>({ open: false })
  const [projectModal, setProjectModal] = useState<{ open: boolean; project?: Project | null }>({ open: false })
  const [habitModal, setHabitModal] = useState<{ open: boolean; habit?: Habit | null }>({ open: false })
  const [noteModal, setNoteModal] = useState<{ open: boolean; note?: NoteResource | null }>({ open: false })

  useReminderNotifications(tasks)

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (session?.user) fetchData(); else setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) await fetchData(); else setLoading(false)
  }

  const fetchData = async () => {
    setLoading(true)
    const [proj, task, hab, logs, note] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('habits').select('*').order('created_at', { ascending: false }),
      supabase.from('habit_logs').select('*').order('log_date', { ascending: false }),
      supabase.from('notes_resources').select('*').order('created_at', { ascending: false }),
    ])
    if (proj.data) setProjects(proj.data)
    if (task.data) setTasks(task.data)
    if (hab.data) setHabits(hab.data)
    if (logs.data) setHabitLogs(logs.data)
    if (note.data) setNotes(note.data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProjects([]); setTasks([]); setHabits([]); setHabitLogs([]); setNotes([])
  }

  // ── Task handlers ───────────────────────────────────────────────────────────
  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const { error } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', id)
    if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t))
  }

  const handleSaveTask = async (data: Partial<Task>) => {
    if (taskModal.task) {
      const { error } = await supabase.from('tasks').update(data).eq('id', taskModal.task.id)
      if (!error) setTasks(tasks.map(t => t.id === taskModal.task!.id ? { ...t, ...data } : t))
    } else {
      const { data: newTask, error } = await supabase.from('tasks').insert([data]).select()
      if (!error && newTask) setTasks([...newTask, ...tasks])
    }
    setTaskModal({ open: false })
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(tasks.filter(t => t.id !== id))
  }

  const handleDuplicateTask = async (task: Task) => {
    const { data: newTask, error } = await supabase.from('tasks').insert([{
      title: task.title + ' (copy)', description: task.description, priority: task.priority,
      project_id: task.project_id, due_date_time: task.due_date_time, tags: task.tags,
      location: task.location, reminder: task.reminder,
    }]).select()
    if (!error && newTask) setTasks([...newTask, ...tasks])
  }

  // ── Project handlers ────────────────────────────────────────────────────────
  const handleSaveProject = async (data: Partial<Project>) => {
    if (projectModal.project) {
      const { error } = await supabase.from('projects').update(data).eq('id', projectModal.project.id)
      if (!error) setProjects(projects.map(p => p.id === projectModal.project!.id ? { ...p, ...data } : p))
    } else {
      const { data: newProj, error } = await supabase.from('projects').insert([data]).select()
      if (!error && newProj) setProjects([...newProj, ...projects])
    }
    setProjectModal({ open: false })
  }

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(projects.filter(p => p.id !== id))
  }

  // ── Habit handlers ──────────────────────────────────────────────────────────
  const handleToggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = habitLogs.find(l => l.habit_id === habitId && l.log_date === today)
    if (existing) {
      const { error } = await supabase.from('habit_logs').update({ is_completed: !existing.is_completed }).eq('id', existing.id)
      if (!error) setHabitLogs(habitLogs.map(l => l.id === existing.id ? { ...l, is_completed: !l.is_completed } : l))
    } else {
      const { data: newLog, error } = await supabase.from('habit_logs').insert([{ habit_id: habitId, log_date: today, is_completed: true }]).select()
      if (!error && newLog) setHabitLogs([...newLog, ...habitLogs])
    }
  }

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (habitModal.habit) {
      const { error } = await supabase.from('habits').update(data).eq('id', habitModal.habit.id)
      if (!error) setHabits(habits.map(h => h.id === habitModal.habit!.id ? { ...h, ...data } : h))
    } else {
      const { data: newH, error } = await supabase.from('habits').insert([data]).select()
      if (!error && newH) setHabits([...newH, ...habits])
    }
    setHabitModal({ open: false })
  }

  const handleDeleteHabit = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (!error) setHabits(habits.filter(h => h.id !== id))
  }

  // ── Note handlers ───────────────────────────────────────────────────────────
  const handleSaveNote = async (data: Partial<NoteResource>) => {
    if (noteModal.note) {
      const { error } = await supabase.from('notes_resources').update(data).eq('id', noteModal.note.id)
      if (!error) setNotes(notes.map(n => n.id === noteModal.note!.id ? { ...n, ...data } : n))
    } else {
      const { data: newNote, error } = await supabase.from('notes_resources').insert([data]).select()
      if (!error && newNote) setNotes([...newNote, ...notes])
    }
    setNoteModal({ open: false })
  }

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('notes_resources').delete().eq('id', id)
    if (!error) setNotes(notes.filter(n => n.id !== id))
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading LifeSync…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Auth onLogin={() => { setUser({}); fetchData() }} />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onRequestNotifications={requestNotificationPermission}
      />

      <main className="container py-4 pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard tasks={tasks} projects={projects} habits={habits} habitLogs={habitLogs}
            onToggleHabit={handleToggleHabit} onToggleTask={handleToggleTask}
            onEditTask={task => setTaskModal({ open: true, task })}
            onAddTask={() => setTaskModal({ open: true })}
            onAddProject={() => setProjectModal({ open: true })}
            onAddHabit={() => setHabitModal({ open: true })} />
        )}
        {activeTab === 'tasks' && (
          <TasksView tasks={tasks} projects={projects}
            onToggle={handleToggleTask}
            onEdit={task => setTaskModal({ open: true, task })}
            onDelete={handleDeleteTask}
            onDuplicate={handleDuplicateTask}
            onAdd={() => setTaskModal({ open: true })} />
        )}
        {activeTab === 'projects' && (
          <ProjectsView projects={projects} tasks={tasks} notes={notes}
            onEdit={project => setProjectModal({ open: true, project })}
            onDelete={handleDeleteProject}
            onAdd={() => setProjectModal({ open: true })} />
        )}
        {activeTab === 'habits' && (
          <HabitsView habits={habits} habitLogs={habitLogs}
            onToggle={handleToggleHabit}
            onEdit={habit => setHabitModal({ open: true, habit })}
            onDelete={handleDeleteHabit}
            onAdd={() => setHabitModal({ open: true })} />
        )}
        {activeTab === 'notes' && (
          <NotesView notes={notes} projects={projects}
            onEdit={note => setNoteModal({ open: true, note })}
            onDelete={handleDeleteNote}
            onAdd={() => setNoteModal({ open: true })} />
        )}
      </main>

      {/* Modals */}
      {taskModal.open && (
        <TaskModal task={taskModal.task} projects={projects} tasks={tasks}
          onSave={handleSaveTask} onClose={() => setTaskModal({ open: false })} />
      )}
      {projectModal.open && (
        <ProjectModal project={projectModal.project}
          onSave={handleSaveProject} onClose={() => setProjectModal({ open: false })} />
      )}
      {habitModal.open && (
        <HabitModal habit={habitModal.habit}
          onSave={handleSaveHabit} onClose={() => setHabitModal({ open: false })} />
      )}
      {noteModal.open && (
        <NoteModal note={noteModal.note} projects={projects}
          onSave={handleSaveNote} onClose={() => setNoteModal({ open: false })} />
      )}
    </div>
  )
}
