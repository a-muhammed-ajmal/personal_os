'use client'
import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import { Project, Habit, HabitLog, NoteResource, AreaOfLife, HabitCategory } from '@/lib/supabase'

// ── ProjectModal ──────────────────────────────────────────────────────────────
export function ProjectModal ({ project, onSave, onClose }: {
    project?: Project | null; onSave: (d: Partial<Project>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<Project>>({
        name: project?.name || '', area_of_life: project?.area_of_life || 'Personal',
        status: project?.status || 'Active',
    })
    const areas: AreaOfLife[] = ['Personal', 'Professional', 'Financial', 'Health & Wealth', 'Relationships', 'Vision & Mission', 'Other']

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
                    <input type="text" placeholder="Project name *" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
                    <div><label className="text-xs text-gray-500">Area of Life</label>
                        <select value={form.area_of_life}
                            onChange={e => setForm({ ...form, area_of_life: e.target.value as AreaOfLife })} className="input text-xs">
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select></div>
                    <div><label className="text-xs text-gray-500">Status</label>
                        <select value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value as any })} className="input text-xs">
                            <option value="Active">Active</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                        </select></div>
                    <button type="submit" className="btn btn-primary w-full">
                        {project ? 'Update Project' : 'Create Project'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ── HabitModal ────────────────────────────────────────────────────────────────
export function HabitModal ({ habit, onSave, onClose }: {
    habit?: Habit | null; onSave: (d: Partial<Habit>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<Habit>>({
        name: habit?.name || '', category: habit?.category || 'Morning',
    })
    const cats: HabitCategory[] = ['Morning', 'Midday', 'Evening']

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">{habit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
                    <input type="text" placeholder="Habit name *" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
                    <div><label className="text-xs text-gray-500">Time of Day</label>
                        <select value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value as HabitCategory })} className="input text-xs">
                            {cats.map(c => <option key={c} value={c}>{c}</option>)}
                        </select></div>
                    <button type="submit" className="btn btn-primary w-full">
                        {habit ? 'Update Habit' : 'Create Habit'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ── NoteModal ─────────────────────────────────────────────────────────────────
export function NoteModal ({ note, projects, onSave, onClose }: {
    note?: NoteResource | null; projects: Project[]
    onSave: (d: Partial<NoteResource>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<NoteResource>>({
        title: note?.title || '', content: note?.content || '',
        type: note?.type || 'Note', project_id: note?.project_id || '', file_url: note?.file_url || '',
    })

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">{note ? 'Edit Note' : 'New Note'}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
                    <input type="text" placeholder="Title *" value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })} className="input" required />
                    <textarea placeholder="Content" value={form.content || ''}
                        onChange={e => setForm({ ...form, content: e.target.value })}
                        className="input min-h-[100px] resize-none" rows={4} />
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-gray-500">Type</label>
                            <select value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value as any })} className="input text-xs">
                                <option value="Note">Note</option><option value="Resource">Resource</option>
                            </select></div>
                        <div><label className="text-xs text-gray-500">Project</label>
                            <select value={form.project_id || ''}
                                onChange={e => setForm({ ...form, project_id: e.target.value || null })} className="input text-xs">
                                <option value="">No Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select></div>
                    </div>
                    <div><label className="text-xs text-gray-500">File / Link URL</label>
                        <input type="url" placeholder="https://..." value={form.file_url || ''}
                            onChange={e => setForm({ ...form, file_url: e.target.value })} className="input text-xs" /></div>
                    <button type="submit" className="btn btn-primary w-full">
                        {note ? 'Update Note' : 'Create Note'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ── HabitTracker (dashboard widget) ──────────────────────────────────────────
export function HabitTracker ({ habits, habitLogs, onToggle }: {
    habits: Habit[]; habitLogs: HabitLog[]; onToggle: (id: string) => void
}) {
    const today = new Date().toISOString().split('T')[0]
    const cats: HabitCategory[] = ['Morning', 'Midday', 'Evening']

    return (
        <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Today's Habits</h2>
            {habits.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No habits yet. Add one!</p>}
            {cats.map(cat => {
                const catHabits = habits.filter(h => h.category === cat)
                if (catHabits.length === 0) return null
                const done = catHabits.filter(h => habitLogs.find(l => l.habit_id === h.id && l.log_date === today && l.is_completed)).length
                return (
                    <div key={cat} className="mb-3 last:mb-0">
                        <div className="flex justify-between mb-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                ${ cat === 'Morning' ? 'habit-morning' : cat === 'Midday' ? 'habit-midday' : 'habit-evening' }`}>{cat}</span>
                            <span className="text-xs text-gray-400">{done}/{catHabits.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {catHabits.map(h => {
                                const completed = habitLogs.find(l => l.habit_id === h.id && l.log_date === today && l.is_completed)
                                return (
                                    <button key={h.id} onClick={() => onToggle(h.id)}
                                        className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all
                      ${ completed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300' }`}>
                                        {completed && <Check size={11} />}
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
