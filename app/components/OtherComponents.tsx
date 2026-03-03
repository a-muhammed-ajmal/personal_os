'use client'
import { useState } from 'react'
import { X, Check, Link as LinkIcon } from 'lucide-react'
import { Project, Habit, HabitLog, NoteResource, AreaOfLife, HabitCategory } from '@/lib/supabase'

function Field ({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label className="label">{label}</label>{children}</div>
}

function Modal ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ padding: '16px 20px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}

// ── ProjectModal ──────────────────────────────────────────────────────────────
export function ProjectModal ({ project, onSave, onClose }: {
    project?: Project | null; onSave: (d: Partial<Project>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<Project>>({
        name: project?.name ?? '', area_of_life: project?.area_of_life ?? 'Personal', status: project?.status ?? 'Active'
    })
    const areas: AreaOfLife[] = ['Personal', 'Professional', 'Financial', 'Health & Wealth', 'Relationships', 'Vision & Mission', 'Other']

    return (
        <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose}>
            <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Project Name *">
                    <input className="input" placeholder="e.g. Website Redesign" value={form.name ?? ''}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                </Field>
                <Field label="Area of Life">
                    <select className="input" value={form.area_of_life} onChange={e => setForm(f => ({ ...f, area_of_life: e.target.value as AreaOfLife }))}>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </Field>
                <Field label="Status">
                    <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                    </select>
                </Field>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                    {project ? 'Save Changes' : 'Create Project'}
                </button>
            </form>
        </Modal>
    )
}

// ── HabitModal ────────────────────────────────────────────────────────────────
export function HabitModal ({ habit, onSave, onClose }: {
    habit?: Habit | null; onSave: (d: Partial<Habit>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<Habit>>({ name: habit?.name ?? '', category: habit?.category ?? 'Morning' })

    return (
        <Modal title={habit ? 'Edit Habit' : 'New Habit'} onClose={onClose}>
            <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Habit Name *">
                    <input className="input" placeholder="e.g. Morning meditation" value={form.name ?? ''}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                </Field>
                <Field label="Time of Day">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {(['Morning', 'Midday', 'Evening'] as HabitCategory[]).map(c => (
                            <button key={c} type="button"
                                onClick={() => setForm(f => ({ ...f, category: c }))}
                                style={{ padding: '10px 8px', borderRadius: 8, border: `1.5px solid ${ form.category === c ? '#4F46E5' : '#E5E7EB' }`, background: form.category === c ? '#EEF2FF' : '#fff', color: form.category === c ? '#4F46E5' : '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                {c === 'Morning' ? '🌅' : c === 'Midday' ? '☀️' : '🌙'} {c}
                            </button>
                        ))}
                    </div>
                </Field>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                    {habit ? 'Save Changes' : 'Create Habit'}
                </button>
            </form>
        </Modal>
    )
}

// ── NoteModal ─────────────────────────────────────────────────────────────────
export function NoteModal ({ note, projects, onSave, onClose }: {
    note?: NoteResource | null; projects: Project[]
    onSave: (d: Partial<NoteResource>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<NoteResource>>({
        title: note?.title ?? '', content: note?.content ?? '',
        type: note?.type ?? 'Note', project_id: note?.project_id ?? '', file_url: note?.file_url ?? ''
    })

    return (
        <Modal title={note ? 'Edit Note' : 'New Note'} onClose={onClose}>
            <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                    {(['Note', 'Resource'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                            style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 500, borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: form.type === t ? '#fff' : 'transparent', color: form.type === t ? '#111827' : '#9CA3AF', boxShadow: form.type === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                            {t === 'Note' ? '📝 Note' : '🔗 Resource'}
                        </button>
                    ))}
                </div>
                <Field label="Title *">
                    <input className="input" placeholder="Title" value={form.title ?? ''}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
                </Field>
                <Field label="Content">
                    <textarea className="input" placeholder="Write something…" value={form.content ?? ''}
                        onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} style={{ resize: 'none' }} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Project">
                        <select className="input" value={form.project_id ?? ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value || null }))}>
                            <option value="">No project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </Field>
                    <Field label="URL / Link">
                        <input className="input" type="url" placeholder="https://…" value={form.file_url ?? ''}
                            onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} />
                    </Field>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                    {note ? 'Save Changes' : 'Create Note'}
                </button>
            </form>
        </Modal>
    )
}

// ── HabitTracker (Dashboard widget) ──────────────────────────────────────────
export function HabitTracker ({ habits, habitLogs, onToggle }: {
    habits: Habit[]; habitLogs: HabitLog[]; onToggle: (id: string) => void
}) {
    const today = new Date().toISOString().split('T')[0]
    const cats: { key: HabitCategory; emoji: string }[] = [
        { key: 'Morning', emoji: '🌅' }, { key: 'Midday', emoji: '☀️' }, { key: 'Evening', emoji: '🌙' }
    ]

    if (habits.length === 0) return (
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>No habits yet — add one to track daily!</p>
        </div>
    )

    return (
        <div className="card" style={{ gap: 0 }}>
            <p className="section-title" style={{ marginBottom: 12 }}>Today's Habits</p>
            {cats.map(({ key, emoji }) => {
                const catHabits = habits.filter(h => h.category === key)
                if (!catHabits.length) return null
                const done = catHabits.filter(h => habitLogs.find(l => l.habit_id === h.id && l.log_date === today && l.is_completed)).length

                return (
                    <div key={key} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span className={`badge habit-${ key.toLowerCase() }`}>{emoji} {key}</span>
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{done}/{catHabits.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {catHabits.map(h => {
                                const completed = habitLogs.find(l => l.habit_id === h.id && l.log_date === today && l.is_completed)
                                return (
                                    <button key={h.id} onClick={() => onToggle(h.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${ completed ? '#4F46E5' : '#E5E7EB' }`, background: completed ? '#EEF2FF' : '#fff', color: completed ? '#4F46E5' : '#6B7280', fontSize: 12, fontWeight: completed ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                                        {completed ? <Check size={12} strokeWidth={3} /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #D1D5DB' }} />}
                                        {h.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
