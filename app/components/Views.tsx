'use client'
import { useState } from 'react'
import { Plus, Check, ChevronDown, ChevronUp, Edit2, Trash2, Link as LinkIcon } from 'lucide-react'
import { Task, Project, Habit, HabitLog, NoteResource, HabitCategory } from '@/lib/supabase'
import { TaskCard } from './TaskComponents'
import { HabitTracker } from './OtherComponents'

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard ({ tasks, projects, habits, habitLogs, onToggleHabit, onToggleTask, onEditTask, onAddTask, onAddProject, onAddHabit }: {
    tasks: Task[]; projects: Project[]; habits: Habit[]; habitLogs: HabitLog[]
    onToggleHabit: (id: string) => void; onToggleTask: (id: string) => void; onEditTask: (t: Task) => void
    onAddTask: () => void; onAddProject: () => void; onAddHabit: () => void
}) {
    const today = new Date().toISOString().split('T')[0]
    const dateLabel = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
    const todayTasks = tasks.filter(t => t.due_date_time && !t.is_completed && t.due_date_time.split('T')[0] === today)
    const overdueTasks = tasks.filter(t => t.due_date_time && !t.is_completed && t.due_date_time.split('T')[0] < today)
    const activeP = projects.filter(p => p.status === 'Active').length
    const todayLogs = habitLogs.filter(l => l.log_date === today && l.is_completed)
    const pct = habits.length > 0 ? Math.round(todayLogs.length / habits.length * 100) : 0

    return (
        <div className="page" style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Greeting */}
            <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</h1>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{dateLabel}</p>
            </div>

            {/* Quick Add */}
            <div className="quick-add">
                <button className="btn btn-primary" onClick={onAddTask}><Plus size={14} />Task</button>
                <button className="btn btn-secondary" onClick={onAddProject}><Plus size={14} />Project</button>
                <button className="btn btn-secondary" onClick={onAddHabit}><Plus size={14} />Habit</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div className="stat-card">
                    <div className="stat-number" style={{ color: '#4F46E5' }}>{activeP}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number" style={{ color: overdueTasks.length > 0 ? '#EF4444' : '#F59E0B' }}>{todayTasks.length + overdueTasks.length}</div>
                    <div className="stat-label">Due Today</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number" style={{ color: pct === 100 ? '#10B981' : '#6366F1' }}>{pct}%</div>
                    <div className="stat-label">Habits</div>
                </div>
            </div>

            {/* Habit Tracker */}
            <HabitTracker habits={habits} habitLogs={habitLogs} onToggle={onToggleHabit} />

            {/* Overdue */}
            {overdueTasks.length > 0 && (
                <div>
                    <p className="section-title" style={{ color: '#EF4444', marginBottom: 8 }}>⚠ Overdue ({overdueTasks.length})</p>
                    {overdueTasks.map(t => <TaskCard key={t.id} task={t} onToggle={onToggleTask} onEdit={onEditTask} onDelete={() => { }} onDuplicate={() => { }} projects={projects} />)}
                </div>
            )}

            {/* Today */}
            <div>
                <p className="section-title" style={{ marginBottom: 8 }}>Today ({todayTasks.length})</p>
                {todayTasks.length > 0
                    ? todayTasks.map(t => <TaskCard key={t.id} task={t} onToggle={onToggleTask} onEdit={onEditTask} onDelete={() => { }} onDuplicate={() => { }} projects={projects} />)
                    : <div className="empty-state"><div className="empty-icon">🎉</div>All caught up for today!</div>
                }
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
    const [filter, setFilter] = useState<'pending' | 'all' | 'completed'>('pending')
    const [sortBy, setSortBy] = useState<'due' | 'priority' | 'created'>('due')
    const [tagFilter, setTagFilter] = useState('')

    const allTags = Array.from(new Set(tasks.flatMap(t => t.tags ?? [])))
    const priOrder = { High: 0, Medium: 1, Low: 2 }

    const filtered = tasks
        .filter(t => filter === 'all' ? true : filter === 'pending' ? !t.is_completed : t.is_completed)
        .filter(t => !tagFilter || t.tags?.includes(tagFilter))
        .sort((a, b) => {
            if (sortBy === 'due') { if (!a.due_date_time) return 1; if (!b.due_date_time) return -1; return new Date(a.due_date_time).getTime() - new Date(b.due_date_time).getTime() }
            if (sortBy === 'priority') return priOrder[a.priority] - priOrder[b.priority]
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

    const parents = filtered.filter(t => !t.parent_task_id)
    const getSubs = (id: string) => filtered.filter(t => t.parent_task_id === id)

    return (
        <div className="page" style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={onAdd} style={{ width: '100%', padding: 11 }}><Plus size={15} />New Task</button>

            {/* Filter row */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {(['pending', 'all', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.15s', background: filter === f ? '#4F46E5' : '#F3F4F6', color: filter === f ? '#fff' : '#6B7280' }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                    style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 20, fontSize: 12, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <option value="due">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="created">Newest</option>
                </select>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {['', ...allTags].map(tag => (
                        <button key={tag || '_all'} onClick={() => setTagFilter(tag)}
                            className="tag" style={{ cursor: 'pointer', background: tagFilter === tag ? '#4F46E5' : '#EEF2FF', color: tagFilter === tag ? '#fff' : '#4338CA', border: 'none', fontFamily: 'inherit' }}>
                            {tag || 'All tags'}
                        </button>
                    ))}
                </div>
            )}

            {/* Task list */}
            <div>
                {parents.map(task => (
                    <div key={task.id}>
                        <TaskCard task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} projects={projects} />
                        {getSubs(task.id).length > 0 && (
                            <div style={{ marginLeft: 16, paddingLeft: 12, borderLeft: '2px solid #E5E7EB', marginBottom: 6 }}>
                                {getSubs(task.id).map(st => <TaskCard key={st.id} task={st} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} projects={projects} />)}
                            </div>
                        )}
                    </div>
                ))}
                {parents.length === 0 && <div className="empty-state"><div className="empty-icon">✅</div>No tasks here.</div>}
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
    const grouped = projects.reduce((acc, p) => { (acc[p.area_of_life] ??= []).push(p); return acc }, {} as Record<string, Project[]>)

    return (
        <div className="page" style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button className="btn btn-primary" onClick={onAdd} style={{ width: '100%', padding: 11 }}><Plus size={15} />New Project</button>

            {Object.keys(grouped).sort().map(area => (
                <div key={area}>
                    <p className="section-title" style={{ marginBottom: 8 }}>{area}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {grouped[area].map(p => {
                            const ptasks = tasks.filter(t => t.project_id === p.id)
                            const pnotes = notes.filter(n => n.project_id === p.id)
                            const done = ptasks.filter(t => t.is_completed).length
                            const pct = ptasks.length > 0 ? (done / ptasks.length) * 100 : 0
                            const isExp = expanded === p.id
                            const statusCls = p.status === 'Active' ? 'badge-green' : p.status === 'On Hold' ? 'badge-amber' : 'badge-gray'

                            return (
                                <div key={p.id} className="card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : p.id)}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{p.name}</span>
                                                <span className={`badge ${ statusCls }`}>{p.status}</span>
                                            </div>
                                            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{done}/{ptasks.length} tasks completed</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); onEdit(p) }}><Edit2 size={13} /></button>
                                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={e => { e.stopPropagation(); if (confirm('Delete project?')) onDelete(p.id) }}><Trash2 size={13} /></button>
                                            {isExp ? <ChevronUp size={15} color="#9CA3AF" /> : <ChevronDown size={15} color="#9CA3AF" />}
                                        </div>
                                    </div>

                                    <div className="progress-track"><div className="progress-fill" style={{ width: `${ pct }%` }} /></div>

                                    {isExp && (
                                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                                            <p className="section-title" style={{ marginBottom: 8 }}>Tasks</p>
                                            {ptasks.length === 0 ? <p style={{ fontSize: 12, color: '#9CA3AF' }}>No tasks linked yet.</p>
                                                : ptasks.slice(0, 6).map(t => (
                                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                                        <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${ t.is_completed ? '#4F46E5' : '#D1D5DB' }`, background: t.is_completed ? '#4F46E5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            {t.is_completed && <Check size={10} strokeWidth={3} color="#fff" />}
                                                        </div>
                                                        <span style={{ fontSize: 12, color: t.is_completed ? '#9CA3AF' : '#374151', textDecoration: t.is_completed ? 'line-through' : 'none' }}>{t.title}</span>
                                                    </div>
                                                ))}
                                            {ptasks.length > 6 && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>+{ptasks.length - 6} more tasks</p>}

                                            {pnotes.length > 0 && (
                                                <>
                                                    <p className="section-title" style={{ marginTop: 12, marginBottom: 8 }}>Notes & Resources</p>
                                                    {pnotes.map(n => (
                                                        <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                                            <span className={`badge ${ n.type === 'Note' ? 'badge-blue' : 'badge-purple' }`}>{n.type}</span>
                                                            <span style={{ fontSize: 12, color: '#374151' }}>{n.title}</span>
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
            {projects.length === 0 && <div className="empty-state"><div className="empty-icon">🗂</div>No projects yet.</div>}
        </div>
    )
}

// ── HabitsView ────────────────────────────────────────────────────────────────
export function HabitsView ({ habits, habitLogs, onToggle, onEdit, onDelete, onAdd }: {
    habits: Habit[]; habitLogs: HabitLog[]
    onToggle: (id: string) => void; onEdit: (h: Habit) => void; onDelete: (id: string) => void; onAdd: () => void
}) {
    const [catFilter, setCatFilter] = useState<HabitCategory | 'all'>('all')
    const cats: HabitCategory[] = ['Morning', 'Midday', 'Evening']
    const today = new Date().toISOString().split('T')[0]
    const filtered = catFilter === 'all' ? habits : habits.filter(h => h.category === catFilter)

    const getStreak = (id: string) => {
        const logs = habitLogs.filter(l => l.habit_id === id && l.is_completed).sort((a, b) => b.log_date.localeCompare(a.log_date))
        let streak = 0, cur = new Date()
        for (const l of logs) {
            const diff = Math.floor((cur.getTime() - new Date(l.log_date).getTime()) / 86400000)
            if (diff <= 1) { streak++; cur = new Date(l.log_date) } else break
        }
        return streak
    }

    const catEmoji: Record<string, string> = { Morning: '🌅', Midday: '☀️', Evening: '🌙' }

    return (
        <div className="page" style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={onAdd} style={{ width: '100%', padding: 11 }}><Plus size={15} />New Habit</button>

            <div style={{ display: 'flex', gap: 6 }}>
                {(['all', ...cats] as const).map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                        style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: catFilter === c ? '#4F46E5' : '#F3F4F6', color: catFilter === c ? '#fff' : '#6B7280' }}>
                        {c === 'all' ? 'All' : `${ catEmoji[c] } ${ c }`}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(h => {
                    const done = habitLogs.find(l => l.habit_id === h.id && l.log_date === today && l.is_completed)
                    const streak = getStreak(h.id)
                    return (
                        <div key={h.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={() => onToggle(h.id)}
                                style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${ done ? '#4F46E5' : '#E5E7EB' }`, background: done ? '#4F46E5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                                {done && <Check size={16} strokeWidth={3} color="#fff" />}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{h.name}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                    <span className={`badge habit-${ h.category.toLowerCase() }`}>{catEmoji[h.category]} {h.category}</span>
                                    {streak > 0 && <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>🔥 {streak}d streak</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 2 }}>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(h)}><Edit2 size={13} /></button>
                                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => { if (confirm('Delete habit?')) onDelete(h.id) }}><Trash2 size={13} /></button>
                            </div>
                        </div>
                    )
                })}
                {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">✨</div>No habits yet.</div>}
            </div>
        </div>
    )
}

// ── NotesView ─────────────────────────────────────────────────────────────────
export function NotesView ({ notes, projects, onEdit, onDelete, onAdd }: {
    notes: NoteResource[]; projects: Project[]
    onEdit: (n: NoteResource) => void; onDelete: (id: string) => void; onAdd: () => void
}) {
    const [typeFilter, setTypeFilter] = useState<'all' | 'Note' | 'Resource'>('all')
    const filtered = typeFilter === 'all' ? notes : notes.filter(n => n.type === typeFilter)

    return (
        <div className="page" style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={onAdd} style={{ width: '100%', padding: 11 }}><Plus size={15} />New Note</button>

            <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'Note', 'Resource'] as const).map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                        style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: typeFilter === t ? '#4F46E5' : '#F3F4F6', color: typeFilter === t ? '#fff' : '#6B7280' }}>
                        {t === 'all' ? 'All' : t === 'Note' ? '📝 Notes' : '🔗 Resources'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {filtered.map(n => {
                    const proj = projects.find(p => p.id === n.project_id)
                    return (
                        <div key={n.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3, flex: 1 }}>{n.title}</h3>
                                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(n)}><Edit2 size={12} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#EF4444' }} onClick={() => { if (confirm('Delete?')) onDelete(n.id) }}><Trash2 size={12} /></button>
                                </div>
                            </div>
                            {n.content && <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</p>}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
                                <span className={`badge ${ n.type === 'Note' ? 'badge-blue' : 'badge-purple' }`}>{n.type}</span>
                                {proj && <span className="badge badge-gray">{proj.name}</span>}
                            </div>
                            {n.file_url && (
                                <a href={n.file_url} target="_blank" rel="noreferrer"
                                    style={{ fontSize: 11, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <LinkIcon size={10} />Open link ↗
                                </a>
                            )}
                        </div>
                    )
                })}
            </div>
            {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">📝</div>No notes yet.</div>}
        </div>
    )
}
