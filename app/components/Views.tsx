'use client'
import { useState } from 'react'
import { Plus, Check, FolderKanban, Edit, Trash2, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react'
import { Task, Project, Habit, HabitLog, NoteResource, HabitCategory } from '@/lib/supabase'
import { TaskItem } from './TaskComponents'
import { HabitTracker } from './OtherComponents'

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard ({ tasks, projects, habits, habitLogs, onToggleHabit, onToggleTask,
    onEditTask, onAddTask, onAddProject, onAddHabit }: {
        tasks: Task[]; projects: Project[]; habits: Habit[]; habitLogs: HabitLog[]
        onToggleHabit: (id: string) => void; onToggleTask: (id: string) => void
        onEditTask: (t: Task) => void; onAddTask: () => void; onAddProject: () => void; onAddHabit: () => void
    }) {
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter(t => { if (!t.due_date_time || t.is_completed) return false; return t.due_date_time.split('T')[0] === today })
    const overdueTasks = tasks.filter(t => { if (!t.due_date_time || t.is_completed) return false; return t.due_date_time.split('T')[0] < today })
    const activeProjects = projects.filter(p => p.status === 'Active')
    const todayLogs = habitLogs.filter(l => l.log_date === today)
    const completedHabits = todayLogs.filter(l => l.is_completed).length
    const pct = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0

    return (
        <div className="space-y-4">
            {/* Quick Add */}
            <div className="flex gap-2">
                <button onClick={onAddTask} className="btn btn-primary flex-1 text-xs py-2">
                    <Plus size={13} className="mr-1" />Task
                </button>
                <button onClick={onAddProject} className="btn btn-secondary flex-1 text-xs py-2">
                    <Plus size={13} className="mr-1" />Project
                </button>
                <button onClick={onAddHabit} className="btn btn-secondary flex-1 text-xs py-2">
                    <Plus size={13} className="mr-1" />Habit
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="card text-center">
                    <p className="text-2xl font-bold text-primary-600">{activeProjects.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Projects</p>
                </div>
                <div className="card text-center">
                    <p className="text-2xl font-bold text-amber-500">{todayTasks.length + overdueTasks.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tasks Due</p>
                </div>
                <div className="card text-center">
                    <p className="text-2xl font-bold text-green-600">{pct}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Habits</p>
                </div>
            </div>

            {/* Habit Tracker */}
            <HabitTracker habits={habits} habitLogs={habitLogs} onToggle={onToggleHabit} />

            {/* Overdue */}
            {overdueTasks.length > 0 && (
                <div>
                    <h2 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                        ⚠ Overdue ({overdueTasks.length})
                    </h2>
                    <div className="space-y-2">
                        {overdueTasks.map(t => (
                            <TaskItem key={t.id} task={t} onToggle={onToggleTask} onEdit={onEditTask}
                                onDelete={() => { }} onDuplicate={() => { }} projects={projects} />
                        ))}
                    </div>
                </div>
            )}

            {/* Today */}
            <div>
                <h2 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Today ({todayTasks.length})</h2>
                <div className="space-y-2">
                    {todayTasks.length > 0
                        ? todayTasks.map(t => <TaskItem key={t.id} task={t} onToggle={onToggleTask} onEdit={onEditTask} onDelete={() => { }} onDuplicate={() => { }} projects={projects} />)
                        : <p className="text-xs text-gray-400 text-center py-4 bg-white rounded-lg border border-gray-100">No tasks due today 🎉</p>
                    }
                </div>
            </div>
        </div>
    )
}

// ── TasksView ─────────────────────────────────────────────────────────────────
export function TasksView ({ tasks, projects, onToggle, onEdit, onDelete, onDuplicate, onAdd }: {
    tasks: Task[]; projects: Project[]
    onToggle: (id: string) => void; onEdit: (t: Task) => void
    onDelete: (id: string) => void; onDuplicate: (t: Task) => void; onAdd: () => void
}) {
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
    const [sortBy, setSortBy] = useState<'due' | 'priority' | 'created'>('due')
    const [tagFilter, setTagFilter] = useState('')

    const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])))

    const filtered = tasks
        .filter(t => {
            if (filter === 'pending') return !t.is_completed
            if (filter === 'completed') return t.is_completed
            return true
        })
        .filter(t => !tagFilter || t.tags?.includes(tagFilter))
        .sort((a, b) => {
            if (sortBy === 'due') {
                if (!a.due_date_time) return 1; if (!b.due_date_time) return -1
                return new Date(a.due_date_time).getTime() - new Date(b.due_date_time).getTime()
            }
            if (sortBy === 'priority') {
                const o = { High: 0, Medium: 1, Low: 2 }
                return o[a.priority] - o[b.priority]
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

    const parents = filtered.filter(t => !t.parent_task_id)
    const getSubs = (pid: string) => filtered.filter(t => t.parent_task_id === pid)

    return (
        <div className="space-y-3">
            <button onClick={onAdd} className="btn btn-primary w-full"><Plus size={14} className="mr-1" />New Task</button>

            <div className="grid grid-cols-2 gap-2">
                <select value={filter} onChange={e => setFilter(e.target.value as any)} className="input text-xs">
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="input text-xs">
                    <option value="due">Sort: Due Date</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="created">Sort: Created</option>
                </select>
            </div>

            {allTags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                    <button onClick={() => setTagFilter('')}
                        className={`tag-pill cursor-pointer ${ !tagFilter ? 'bg-primary-100 text-primary-700' : '' }`}>All</button>
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                            className={`tag-pill cursor-pointer ${ tagFilter === tag ? 'bg-primary-600 text-white' : '' }`}>{tag}</button>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                {parents.map(task => (
                    <div key={task.id}>
                        <TaskItem task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} projects={projects} />
                        {getSubs(task.id).length > 0 && (
                            <div className="ml-5 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                                {getSubs(task.id).map(st => (
                                    <TaskItem key={st.id} task={st} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} projects={projects} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {parents.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No tasks. Create your first!</p>}
            </div>
        </div>
    )
}

// ── ProjectsView ──────────────────────────────────────────────────────────────
export function ProjectsView ({ projects, tasks, notes, onEdit, onDelete, onAdd }: {
    projects: Project[]; tasks: Task[]; notes: NoteResource[]
    onEdit: (p: Project) => void; onDelete: (id: string) => void; onAdd: () => void
}) {
    const [expanded, setExpanded] = useState<string | null>(null)
    const grouped = projects.reduce((acc, p) => {
        if (!acc[p.area_of_life]) acc[p.area_of_life] = []
        acc[p.area_of_life].push(p); return acc
    }, {} as Record<string, Project[]>)

    return (
        <div className="space-y-4">
            <button onClick={onAdd} className="btn btn-primary w-full"><Plus size={14} className="mr-1" />New Project</button>
            {Object.keys(grouped).sort().map(area => (
                <div key={area}>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{area}</h2>
                    <div className="space-y-2">
                        {grouped[area].map(project => {
                            const ptasks = tasks.filter(t => t.project_id === project.id)
                            const done = ptasks.filter(t => t.is_completed).length
                            const pct = ptasks.length > 0 ? (done / ptasks.length) * 100 : 0
                            const pnotes = notes.filter(n => n.project_id === project.id)
                            const isExp = expanded === project.id
                            const statusCls = project.status === 'Active' ? 'badge badge-green' : project.status === 'On Hold' ? 'badge badge-amber' : 'badge badge-gray'

                            return (
                                <div key={project.id} className="card">
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExp ? null : project.id)}>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={statusCls}>{project.status}</span>
                                                <span className="text-xs text-gray-400">{done}/{ptasks.length} tasks</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={e => { e.stopPropagation(); onEdit(project) }} className="p-1.5 text-gray-400 hover:text-primary-600"><Edit size={13} /></button>
                                            <button onClick={e => { e.stopPropagation(); if (confirm('Delete project?')) onDelete(project.id) }} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                                            {isExp ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                                        </div>
                                    </div>
                                    <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: `${ pct }%` }} /></div>
                                    {isExp && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                            <p className="text-xs font-medium text-gray-600">Tasks</p>
                                            {ptasks.length === 0 && <p className="text-xs text-gray-400">No tasks linked</p>}
                                            {ptasks.slice(0, 5).map(t => (
                                                <div key={t.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <input type="checkbox" checked={t.is_completed} readOnly className="w-3.5 h-3.5" />
                                                    <span className={t.is_completed ? 'line-through text-gray-400' : ''}>{t.title}</span>
                                                </div>
                                            ))}
                                            {ptasks.length > 5 && <p className="text-xs text-gray-400">+{ptasks.length - 5} more</p>}
                                            {pnotes.length > 0 && (
                                                <>
                                                    <p className="text-xs font-medium text-gray-600 pt-2">Notes</p>
                                                    {pnotes.map(n => (
                                                        <div key={n.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <span className={`badge ${ n.type === 'Note' ? 'badge-blue' : 'badge-purple' }`}>{n.type}</span>
                                                            <span>{n.title}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
            {projects.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No projects yet. Create your first!</p>}
        </div>
    )
}

// ── HabitsView ────────────────────────────────────────────────────────────────
export function HabitsView ({ habits, habitLogs, onToggle, onEdit, onDelete, onAdd }: {
    habits: Habit[]; habitLogs: HabitLog[]
    onToggle: (id: string) => void; onEdit: (h: Habit) => void
    onDelete: (id: string) => void; onAdd: () => void
}) {
    const [catFilter, setCatFilter] = useState<HabitCategory | 'all'>('all')
    const cats: HabitCategory[] = ['Morning', 'Midday', 'Evening']
    const filtered = catFilter === 'all' ? habits : habits.filter(h => h.category === catFilter)
    const today = new Date().toISOString().split('T')[0]

    const getStreak = (habitId: string) => {
        const logs = habitLogs.filter(l => l.habit_id === habitId && l.is_completed).sort((a, b) => b.log_date.localeCompare(a.log_date))
        let streak = 0, cur = new Date()
        for (const log of logs) {
            const diff = Math.floor((cur.getTime() - new Date(log.log_date).getTime()) / 86400000)
            if (diff <= 1) { streak++; cur = new Date(log.log_date) } else break
        }
        return streak
    }

    return (
        <div className="space-y-3">
            <button onClick={onAdd} className="btn btn-primary w-full"><Plus size={14} className="mr-1" />New Habit</button>
            <div className="flex gap-1.5 flex-wrap">
                {(['all', ...cats] as const).map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors ${ catFilter === c ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600' }`}>
                        {c === 'all' ? 'All' : c}
                    </button>
                ))}
            </div>
            <div className="space-y-2">
                {filtered.map(habit => {
                    const completed = habitLogs.find(l => l.habit_id === habit.id && l.log_date === today && l.is_completed)
                    const streak = getStreak(habit.id)
                    return (
                        <div key={habit.id} className="card flex items-center gap-3">
                            <button onClick={() => onToggle(habit.id)}
                                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${ completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400 text-transparent' }`}>
                                <Check size={16} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900">{habit.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${ habit.category === 'Morning' ? 'habit-morning' : habit.category === 'Midday' ? 'habit-midday' : 'habit-evening' }`}>{habit.category}</span>
                                    {streak > 0 && <span className="text-xs text-amber-600">🔥 {streak}d streak</span>}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => onEdit(habit)} className="p-1.5 text-gray-400 hover:text-primary-600"><Edit size={13} /></button>
                                <button onClick={() => { if (confirm('Delete habit?')) onDelete(habit.id) }} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                            </div>
                        </div>
                    )
                })}
                {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No habits yet.</p>}
            </div>
        </div>
    )
}

// ── NotesView ─────────────────────────────────────────────────────────────────
export function NotesView ({ notes, projects, onEdit, onDelete, onAdd }: {
    notes: NoteResource[]; projects: Project[]
    onEdit: (n: NoteResource) => void; onDelete: (id: string) => void; onAdd: () => void
}) {
    const [type, setType] = useState<'all' | 'Note' | 'Resource'>('all')
    const filtered = type === 'all' ? notes : notes.filter(n => n.type === type)

    return (
        <div className="space-y-3">
            <button onClick={onAdd} className="btn btn-primary w-full"><Plus size={14} className="mr-1" />New Note</button>
            <div className="flex gap-1.5">
                {(['all', 'Note', 'Resource'] as const).map(t => (
                    <button key={t} onClick={() => setType(t)}
                        className={`px-3 py-1.5 text-xs rounded-full transition-colors ${ type === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600' }`}>
                        {t === 'all' ? 'All' : t + 's'}
                    </button>
                ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {filtered.map(note => {
                    const project = projects.find(p => p.id === note.project_id)
                    return (
                        <div key={note.id} className="card">
                            <div className="flex items-start justify-between mb-1.5">
                                <h3 className="text-sm font-medium text-gray-900 leading-snug flex-1 mr-2 line-clamp-2">{note.title}</h3>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => onEdit(note)} className="p-1 text-gray-400 hover:text-primary-600"><Edit size={13} /></button>
                                    <button onClick={() => { if (confirm('Delete note?')) onDelete(note.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                                </div>
                            </div>
                            {note.content && <p className="text-xs text-gray-500 line-clamp-3 mb-2">{note.content}</p>}
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className={`badge ${ note.type === 'Note' ? 'badge-blue' : 'badge-purple' }`}>{note.type}</span>
                                {project && <span className="text-gray-400">{project.name}</span>}
                            </div>
                            {note.file_url && (
                                <a href={note.file_url} target="_blank" rel="noreferrer"
                                    className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:underline">
                                    <LinkIcon size={11} /> Open Link ↗
                                </a>
                            )}
                        </div>
                    )
                })}
            </div>
            {filtered.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No notes yet.</p>}
        </div>
    )
}
