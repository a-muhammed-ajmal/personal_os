'use client'

import { useState, useEffect } from 'react'
import { supabase, Project, Task, Habit, HabitLog, NoteResource } from '@/lib/supabase'
import Auth from './components/Auth'
import AppShell from './components/AppShell'
import { TaskModal } from './components/TaskComponents'
import { ProjectModal, HabitModal, NoteModal } from './components/OtherComponents'
import { Dashboard, TasksView, ProjectsView, HabitsView, NotesView } from './components/Views'
import { Toaster, toast } from './components/Toast'

// ── Service Worker ────────────────────────────────────────────────────────────
async function registerSW () {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return
  const perm = await Notification.requestPermission()
  if (perm === 'granted') {
    try { await navigator.serviceWorker.register('/sw.js') } catch (e) { console.warn('SW failed', e) }
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App () {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
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

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUserId(session.user.id); setUserEmail(session.user.email ?? ''); fetchData() }
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUserId(session.user.id); setUserEmail(session.user.email ?? '') }
      else { setUserId(null); setUserEmail(''); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Reminder check every 60s ────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (Notification.permission !== 'granted') return
      const now = Date.now()
      tasks.forEach(t => {
        if (!t.reminder || t.is_completed) return
        const rem = new Date(t.reminder).getTime()
        if (rem > now && rem - now < 60000)
          new Notification('LifeSync Reminder', { body: t.title, icon: '/icon-192.png' })
      })
    }
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [tasks])

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)
    const [p, t, h, l, n] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('habits').select('*').order('created_at', { ascending: false }),
      supabase.from('habit_logs').select('*').order('log_date', { ascending: false }),
      supabase.from('notes_resources').select('*').order('created_at', { ascending: false }),
    ])
    if (p.data) setProjects(p.data); if (p.error) console.error(p.error)
    if (t.data) setTasks(t.data); if (t.error) console.error(t.error)
    if (h.data) setHabits(h.data); if (h.error) console.error(h.error)
    if (l.data) setHabitLogs(l.data); if (l.error) console.error(l.error)
    if (n.data) setNotes(n.data); if (n.error) console.error(n.error)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null); setProjects([]); setTasks([]); setHabits([]); setHabitLogs([]); setNotes([])
  }

  // ── Sanitize helper — strip empty strings for nullable cols ─────────────────
  const clean = (d: Record<string, any>) => {
    const nullable = ['project_id', 'parent_task_id', 'due_date_time', 'deadline', 'reminder', 'location', 'description', 'file_url', 'content']
    const out: Record<string, any> = { ...d }
    nullable.forEach(k => { if (out[k] === '' || out[k] === undefined) out[k] = null })
    // never send is_completed in insert (has DB default)
    delete out.is_completed
    return out
  }

  // ── Task handlers ───────────────────────────────────────────────────────────
  const handleToggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id); if (!task) return
    const { error } = await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', id)
    if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t))
    else toast('Failed to update task', 'error')
  }

  const handleSaveTask = async (data: Partial<Task>) => {
    const payload = clean(data as any)
    if (taskModal.task) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', taskModal.task.id)
      if (!error) { setTasks(tasks.map(t => t.id === taskModal.task!.id ? { ...t, ...payload } : t)); toast('Task updated') }
      else { toast(error.message, 'error'); console.error(error) }
    } else {
      const { data: rows, error } = await supabase.from('tasks').insert([{ ...payload, user_id: userId }]).select()
      if (!error && rows) { setTasks([...rows, ...tasks]); toast('Task created') }
      else { toast(error?.message ?? 'Failed', 'error'); console.error(error) }
    }
    setTaskModal({ open: false })
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) { setTasks(tasks.filter(t => t.id !== id)); toast('Task deleted') }
    else toast(error.message, 'error')
  }

  const handleDuplicateTask = async (task: Task) => {
    const payload = clean({ title: task.title + ' (copy)', description: task.description, priority: task.priority, project_id: task.project_id, due_date_time: task.due_date_time, tags: task.tags, location: task.location, reminder: task.reminder, deadline: task.deadline } as any)
    const { data: rows, error } = await supabase.from('tasks').insert([{ ...payload, user_id: userId }]).select()
    if (!error && rows) { setTasks([...rows, ...tasks]); toast('Task duplicated') }
    else toast(error?.message ?? 'Failed', 'error')
  }

  // ── Project handlers ────────────────────────────────────────────────────────
  const handleSaveProject = async (data: Partial<Project>) => {
    if (projectModal.project) {
      const { error } = await supabase.from('projects').update(data).eq('id', projectModal.project.id)
      if (!error) { setProjects(projects.map(p => p.id === projectModal.project!.id ? { ...p, ...data } : p)); toast('Project updated') }
      else toast(error.message, 'error')
    } else {
      const { data: rows, error } = await supabase.from('projects').insert([{ ...data, user_id: userId }]).select()
      if (!error && rows) { setProjects([...rows, ...projects]); toast('Project created') }
      else { toast(error?.message ?? 'Failed', 'error'); console.error(error) }
    }
    setProjectModal({ open: false })
  }

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) { setProjects(projects.filter(p => p.id !== id)); toast('Project deleted') }
    else toast(error.message, 'error')
  }

  // ── Habit handlers ──────────────────────────────────────────────────────────
  const handleToggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = habitLogs.find(l => l.habit_id === habitId && l.log_date === today)
    if (existing) {
      const { error } = await supabase.from('habit_logs').update({ is_completed: !existing.is_completed }).eq('id', existing.id)
      if (!error) setHabitLogs(habitLogs.map(l => l.id === existing.id ? { ...l, is_completed: !l.is_completed } : l))
    } else {
      const { data: rows, error } = await supabase.from('habit_logs').insert([{ habit_id: habitId, log_date: today, is_completed: true }]).select()
      if (!error && rows) setHabitLogs([...rows, ...habitLogs])
      else console.error(error)
    }
  }

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (habitModal.habit) {
      const { error } = await supabase.from('habits').update(data).eq('id', habitModal.habit.id)
      if (!error) { setHabits(habits.map(h => h.id === habitModal.habit!.id ? { ...h, ...data } : h)); toast('Habit updated') }
      else toast(error.message, 'error')
    } else {
      const { data: rows, error } = await supabase.from('habits').insert([{ ...data, user_id: userId }]).select()
      if (!error && rows) { setHabits([...rows, ...habits]); toast('Habit created') }
      else { toast(error?.message ?? 'Failed', 'error'); console.error(error) }
    }
    setHabitModal({ open: false })
  }

  const handleDeleteHabit = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (!error) { setHabits(habits.filter(h => h.id !== id)); toast('Habit deleted') }
    else toast(error.message, 'error')
  }

  // ── Note handlers ───────────────────────────────────────────────────────────
  const handleSaveNote = async (data: Partial<NoteResource>) => {
    const payload = clean(data as any)
    if (noteModal.note) {
      const { error } = await supabase.from('notes_resources').update(payload).eq('id', noteModal.note.id)
      if (!error) { setNotes(notes.map(n => n.id === noteModal.note!.id ? { ...n, ...payload } : n)); toast('Note updated') }
      else toast(error.message, 'error')
    } else {
      const { data: rows, error } = await supabase.from('notes_resources').insert([{ ...payload, user_id: userId }]).select()
      if (!error && rows) { setNotes([...rows, ...notes]); toast('Note created') }
      else { toast(error?.message ?? 'Failed', 'error'); console.error(error) }
    }
    setNoteModal({ open: false })
  }

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('notes_resources').delete().eq('id', id)
    if (!error) { setNotes(notes.filter(n => n.id !== id)); toast('Deleted') }
    else toast(error.message, 'error')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid #4F46E5', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Loading LifeSync…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  if (!userId) return <Auth onLogin={(uid, email) => { setUserId(uid); setUserEmail(email); fetchData() }} />

  return (
    <>
      <AppShell activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} onNotif={registerSW} userEmail={userEmail}>
        {activeTab === 'dashboard' && (
          <Dashboard tasks={tasks} projects={projects} habits={habits} habitLogs={habitLogs}
            onToggleHabit={handleToggleHabit} onToggleTask={handleToggleTask}
            onEditTask={t => setTaskModal({ open: true, task: t })}
            onAddTask={() => setTaskModal({ open: true })}
            onAddProject={() => setProjectModal({ open: true })}
            onAddHabit={() => setHabitModal({ open: true })} />
        )}
        {activeTab === 'tasks' && (
          <TasksView tasks={tasks} projects={projects}
            onToggle={handleToggleTask}
            onEdit={t => setTaskModal({ open: true, task: t })}
            onDelete={handleDeleteTask} onDuplicate={handleDuplicateTask}
            onAdd={() => setTaskModal({ open: true })} />
        )}
        {activeTab === 'projects' && (
          <ProjectsView projects={projects} tasks={tasks} notes={notes}
            onEdit={p => setProjectModal({ open: true, project: p })}
            onDelete={handleDeleteProject} onAdd={() => setProjectModal({ open: true })} />
        )}
        {activeTab === 'habits' && (
          <HabitsView habits={habits} habitLogs={habitLogs}
            onToggle={handleToggleHabit}
            onEdit={h => setHabitModal({ open: true, habit: h })}
            onDelete={handleDeleteHabit} onAdd={() => setHabitModal({ open: true })} />
        )}
        {activeTab === 'notes' && (
          <NotesView notes={notes} projects={projects}
            onEdit={n => setNoteModal({ open: true, note: n })}
            onDelete={handleDeleteNote} onAdd={() => setNoteModal({ open: true })} />
        )}
      </AppShell>

      {taskModal.open && <TaskModal task={taskModal.task} projects={projects} allTasks={tasks} onSave={handleSaveTask} onClose={() => setTaskModal({ open: false })} />}
      {projectModal.open && <ProjectModal project={projectModal.project} onSave={handleSaveProject} onClose={() => setProjectModal({ open: false })} />}
      {habitModal.open && <HabitModal habit={habitModal.habit} onSave={handleSaveHabit} onClose={() => setHabitModal({ open: false })} />}
      {noteModal.open && <NoteModal note={noteModal.note} projects={projects} onSave={handleSaveNote} onClose={() => setNoteModal({ open: false })} />}
      <Toaster />
    </>
  )
}
