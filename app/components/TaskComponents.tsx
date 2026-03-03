'use client'
import { useState } from 'react'
import { X, Check, Plus, Calendar, Tag, Folder, AlignLeft, MapPin, Bell, Link as LinkIcon, Clock } from 'lucide-react'
import { Task, Project, Priority } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { toast } from './Toast'

function Field ({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label className="label">{label}</label>{children}</div>
}

// ── TaskCard ──────────────────────────────────────────────────────────────────
export function TaskCard ({ task, onToggle, onEdit, onDelete, onDuplicate, projects = [] }: {
    task: Task; onToggle: (id: string) => void; onEdit: (t: Task) => void
    onDelete: (id: string) => void; onDuplicate: (t: Task) => void; projects?: Project[]
}) {
    const [open, setOpen] = useState(false)
    const project = projects.find(p => p.id === task.project_id)
    const now = new Date()
    const isOverdue = task.due_date_time && new Date(task.due_date_time) < now && !task.is_completed
    const reminderSoon = task.reminder && !task.is_completed &&
        new Date(task.reminder) > now && (new Date(task.reminder).getTime() - now.getTime()) < 1800000

    const priColor = task.priority === 'High' ? '#EF4444' : task.priority === 'Low' ? '#10B981' : '#F59E0B'

    return (
        <div className={`card-flat ${ isOverdue ? 'overdue-ring' : '' }`} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Checkbox */}
                <button className={`check-btn ${ task.is_completed ? 'done' : '' }`} style={{ marginTop: 1 }} onClick={() => onToggle(task.id)}>
                    <Check size={13} strokeWidth={3} />
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {reminderSoon && <span className="dot-amber" title="Reminder soon" />}
                        <span style={{ fontSize: 13, fontWeight: 500, color: task.is_completed ? '#9CA3AF' : '#111827', textDecoration: task.is_completed ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                            {task.title}
                        </span>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: priColor, flexShrink: 0 }} title={task.priority} />
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 4 }}>
                        {task.due_date_time && (
                            <span style={{ fontSize: 11, color: isOverdue ? '#EF4444' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Calendar size={10} />{new Date(task.due_date_time).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                {isOverdue && ' ⚠'}
                            </span>
                        )}
                        {project && (
                            <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Folder size={10} />{project.name}
                            </span>
                        )}
                        {task.tags?.map(tag => <span key={tag} className="tag">{tag}</span>)}
                    </div>
                </div>

                {/* Actions — shown when tapped */}
                {open && (
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { onEdit(task); setOpen(false) }} title="Edit">✏️</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { onDuplicate(task); setOpen(false) }} title="Duplicate">⧉</button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { onDelete(task.id); setOpen(false) }} title="Delete" style={{ color: '#EF4444' }}>🗑</button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
export function TaskModal ({ task, projects, allTasks, onSave, onClose }: {
    task?: Task | null; projects: Project[]; allTasks: Task[]
    onSave: (d: Partial<Task>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<Task>>({
        title: task?.title ?? '', description: task?.description ?? '',
        due_date_time: task?.due_date_time?.slice(0, 16) ?? '',
        deadline: task?.deadline?.slice(0, 16) ?? '',
        reminder: task?.reminder?.slice(0, 16) ?? '',
        priority: task?.priority ?? 'Medium',
        location: task?.location ?? '',
        project_id: task?.project_id ?? '',
        parent_task_id: task?.parent_task_id ?? '',
        tags: task?.tags ?? [],
        file_url: task?.file_url ?? '',
    })
    const [tagInput, setTagInput] = useState('')
    const [uploading, setUploading] = useState(false)
    const set = (k: keyof Task, v: any) => setForm(f => ({ ...f, [k]: v }))

    const addTag = () => {
        const t = tagInput.trim()
        if (t && !form.tags?.includes(t)) { set('tags', [...(form.tags ?? []), t]); setTagInput('') }
    }

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setUploading(true)
        const { error, data: up } = await supabase.storage.from('attachments').upload(`tasks/${ Date.now() }_${ file.name }`, file)
        if (error) { toast('Upload failed: ' + error.message, 'error'); setUploading(false); return }
        const { data } = supabase.storage.from('attachments').getPublicUrl(up.path)
        set('file_url', data.publicUrl); setUploading(false); toast('File uploaded')
    }

    const parentOptions = allTasks.filter(t => !task || t.id !== task.id)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ padding: '16px 20px 24px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{task ? 'Edit Task' : 'New Task'}</h2>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                    </div>

                    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Field label="Title *">
                            <input className="input" placeholder="What needs to be done?" value={form.title}
                                onChange={e => set('title', e.target.value)} required autoFocus />
                        </Field>

                        <Field label="Description">
                            <textarea className="input" placeholder="Add details…" value={form.description ?? ''}
                                onChange={e => set('description', e.target.value)} rows={2} style={{ resize: 'none', minHeight: 60 }} />
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <Field label="Due Date & Time">
                                <input type="datetime-local" className="input" value={form.due_date_time ?? ''}
                                    onChange={e => set('due_date_time', e.target.value)} />
                            </Field>
                            <Field label="Priority">
                                <select className="input" value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
                                    <option value="High">🔴 High</option>
                                    <option value="Medium">🟡 Medium</option>
                                    <option value="Low">🟢 Low</option>
                                </select>
                            </Field>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <Field label="Deadline">
                                <input type="datetime-local" className="input" value={form.deadline ?? ''}
                                    onChange={e => set('deadline', e.target.value)} />
                            </Field>
                            <Field label="Reminder">
                                <input type="datetime-local" className="input" value={form.reminder ?? ''}
                                    onChange={e => set('reminder', e.target.value)} />
                            </Field>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <Field label="Project">
                                <select className="input" value={form.project_id ?? ''} onChange={e => set('project_id', e.target.value || null)}>
                                    <option value="">None</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Subtask of">
                                <select className="input" value={form.parent_task_id ?? ''} onChange={e => set('parent_task_id', e.target.value || null)}>
                                    <option value="">Top-level</option>
                                    {parentOptions.map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 28)}</option>)}
                                </select>
                            </Field>
                        </div>

                        <Field label="Location">
                            <input className="input" placeholder="Add location" value={form.location ?? ''}
                                onChange={e => set('location', e.target.value)} />
                        </Field>

                        <Field label="Tags">
                            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                <input className="input" placeholder="Add a tag, press Enter" value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} style={{ flex: 1 }} />
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}><Plus size={13} /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {form.tags?.map(tag => (
                                    <span key={tag} className="tag">
                                        {tag}
                                        <button type="button" onClick={() => set('tags', form.tags?.filter(t => t !== tag))}
                                            style={{ marginLeft: 3, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                                    </span>
                                ))}
                            </div>
                        </Field>

                        <Field label="File Attachment">
                            <input type="file" className="file-input" onChange={handleFile} />
                            {uploading && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Uploading…</p>}
                            {form.file_url && !uploading && (
                                <a href={form.file_url} target="_blank" rel="noreferrer"
                                    style={{ fontSize: 11, color: '#4F46E5', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <LinkIcon size={11} /> View attached file ↗
                                </a>
                            )}
                        </Field>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 14, marginTop: 4 }}>
                            {task ? 'Save Changes' : 'Create Task'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
