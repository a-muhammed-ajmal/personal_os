'use client'
import { useState } from 'react'
import { X, Plus, Calendar, FolderKanban, Edit, Trash2, Copy, Bell } from 'lucide-react'
import { Task, Project, Priority } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// ── TaskItem ──────────────────────────────────────────────────────────────────
export function TaskItem ({ task, onToggle, onEdit, onDelete, onDuplicate, projects = [] }: {
    task: Task; onToggle: (id: string) => void; onEdit: (t: Task) => void
    onDelete: (id: string) => void; onDuplicate: (t: Task) => void; projects?: Project[]
}) {
    const [open, setOpen] = useState(false)
    const project = projects.find(p => p.id === task.project_id)
    const isOverdue = task.due_date_time && new Date(task.due_date_time) < new Date() && !task.is_completed
    const reminderSoon = task.reminder && !task.is_completed &&
        new Date(task.reminder) > new Date() &&
        (new Date(task.reminder).getTime() - Date.now()) < 30 * 60 * 1000 // <30 min

    const priorityClass = task.priority === 'High' ? 'badge badge-red' : task.priority === 'Low' ? 'badge badge-green' : ''

    return (
        <div className={`card flex items-start gap-2.5 ${ task.is_completed ? 'opacity-60' : '' }`}>
            <input type="checkbox" checked={task.is_completed}
                onChange={() => onToggle(task.id)} className="mt-0.5 checkbox-animated" />
            <div className="flex-1 min-w-0" onClick={() => setOpen(!open)}>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {reminderSoon && <span className="reminder-dot" title="Reminder soon" />}
                    <p className={`text-sm font-medium leading-snug ${ task.is_completed ? 'line-through text-gray-400' : 'text-gray-900' }`}>
                        {task.title}
                    </p>
                    {task.priority !== 'Medium' && <span className={priorityClass}>{task.priority}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {task.due_date_time && (
                        <span className={`text-xs flex items-center gap-0.5 ${ isOverdue ? 'text-red-600 font-medium' : 'text-gray-500' }`}>
                            <Calendar size={10} /> {new Date(task.due_date_time).toLocaleDateString()}
                            {isOverdue && ' ⚠'}
                        </span>
                    )}
                    {project && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <FolderKanban size={10} /> {project.name}
                        </span>
                    )}
                    {task.tags?.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
                </div>
            </div>
            {open && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded hover:bg-primary-50"><Edit size={13} /></button>
                    <button onClick={() => onDuplicate(task)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Copy size={13} /></button>
                    <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={13} /></button>
                </div>
            )}
        </div>
    )
}

// ── TaskModal ─────────────────────────────────────────────────────────────────
export function TaskModal ({ task, projects, tasks, onSave, onClose }: {
    task?: Task | null; projects: Project[]; tasks: Task[]
    onSave: (d: Partial<Task>) => void; onClose: () => void
}) {
    const [form, setForm] = useState<Partial<Task>>({
        title: task?.title || '', description: task?.description || '',
        due_date_time: task?.due_date_time ? task.due_date_time.slice(0, 16) : '',
        priority: task?.priority || 'Medium', location: task?.location || '',
        project_id: task?.project_id || '', parent_task_id: task?.parent_task_id || '',
        tags: task?.tags || [], reminder: task?.reminder ? task.reminder.slice(0, 16) : '',
        deadline: task?.deadline ? task.deadline.slice(0, 16) : '', is_completed: task?.is_completed || false,
    })
    const [tagInput, setTagInput] = useState('')
    const [uploading, setUploading] = useState(false)

    const addTag = () => {
        const t = tagInput.trim()
        if (t && !form.tags?.includes(t)) { setForm({ ...form, tags: [...(form.tags || []), t] }); setTagInput('') }
    }
    const removeTag = (tag: string) => setForm({ ...form, tags: form.tags?.filter(t => t !== tag) })

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const path = `tasks/${ Date.now() }_${ file.name }`
            const { error } = await supabase.storage.from('attachments').upload(path, file)
            if (!error) {
                const { data } = supabase.storage.from('attachments').getPublicUrl(path)
                setForm(f => ({ ...f, file_url: data.publicUrl }))
            } else { alert('Upload failed: ' + error.message) }
        } finally { setUploading(false) }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content p-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-3">
                    <input type="text" placeholder="Task title *" value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })} className="input" required />
                    <textarea placeholder="Description" value={form.description || ''}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="input min-h-[60px] resize-none" rows={2} />

                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-gray-500">Due Date</label>
                            <input type="datetime-local" value={form.due_date_time || ''}
                                onChange={e => setForm({ ...form, due_date_time: e.target.value })} className="input text-xs" /></div>
                        <div><label className="text-xs text-gray-500">Priority</label>
                            <select value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value as Priority })} className="input text-xs">
                                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                            </select></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-gray-500">Deadline</label>
                            <input type="datetime-local" value={form.deadline || ''}
                                onChange={e => setForm({ ...form, deadline: e.target.value })} className="input text-xs" /></div>
                        <div><label className="text-xs text-gray-500">Reminder</label>
                            <input type="datetime-local" value={form.reminder || ''}
                                onChange={e => setForm({ ...form, reminder: e.target.value })} className="input text-xs" /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-gray-500">Project</label>
                            <select value={form.project_id || ''}
                                onChange={e => setForm({ ...form, project_id: e.target.value || null })} className="input text-xs">
                                <option value="">No Project</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select></div>
                        <div><label className="text-xs text-gray-500">Subtask of</label>
                            <select value={form.parent_task_id || ''}
                                onChange={e => setForm({ ...form, parent_task_id: e.target.value || null })} className="input text-xs">
                                <option value="">None (top-level)</option>
                                {tasks.filter(t => !task || t.id !== task.id).map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 30)}</option>)}
                            </select></div>
                    </div>

                    <div><label className="text-xs text-gray-500">Location</label>
                        <input type="text" placeholder="Location" value={form.location || ''}
                            onChange={e => setForm({ ...form, location: e.target.value })} className="input text-xs" /></div>

                    <div><label className="text-xs text-gray-500 block mb-1">Tags</label>
                        <div className="flex gap-1 mb-1">
                            <input type="text" placeholder="Add tag, press Enter" value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="input text-xs flex-1" />
                            <button type="button" onClick={addTag} className="btn btn-secondary text-xs px-2">+</button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {form.tags?.map(tag => (
                                <span key={tag} className="tag-pill">{tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-500"><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div><label className="text-xs text-gray-500 block mb-1">File Attachment</label>
                        <input type="file" onChange={handleFile} className="text-xs text-gray-500
              file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium
              file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                        {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
                        {form.file_url && <a href={form.file_url} target="_blank" rel="noreferrer"
                            className="text-xs text-primary-600 hover:underline mt-1 block">View uploaded file ↗</a>}
                    </div>

                    <button type="submit" className="btn btn-primary w-full">
                        {task ? 'Update Task' : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    )
}
