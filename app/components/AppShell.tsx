'use client'
import { useState, useEffect, useRef } from 'react'
import { Home, ListTodo, FolderKanban, Sparkles, BookOpen, Bell, LogOut, ChevronDown } from 'lucide-react'

const TABS = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'habits', label: 'Habits', icon: Sparkles },
    { id: 'notes', label: 'Notes', icon: BookOpen },
]

export default function AppShell ({ children, activeTab, setActiveTab, onLogout, onNotif, userEmail }:
    { children: React.ReactNode; activeTab: string; setActiveTab: (t: string) => void; onLogout: () => void; onNotif: () => void; userEmail: string }) {

    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className="min-h-screen" style={{ paddingBottom: 64 }}>
            {/* Top bar */}
            <header className="top-bar">
                <div className="top-bar-inner">
                    <div className="flex items-center gap-2">
                        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>L</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>LifeSync</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={onNotif} className="btn btn-ghost btn-icon" title="Notifications">
                            <Bell size={17} />
                        </button>
                        <div ref={menuRef} style={{ position: 'relative' }}>
                            <button onClick={() => setMenuOpen(v => !v)}
                                className="flex items-center gap-1.5 btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px' }}>
                                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
                                <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {menuOpen && (
                                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden', zIndex: 200 }}>
                                    {TABS.map(t => (
                                        <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOpen(false) }}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#4F46E5' : '#374151', background: activeTab === t.id ? '#EEF2FF' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                                            <t.icon size={14} /> {t.label}
                                        </button>
                                    ))}
                                    <div style={{ height: 1, background: '#F3F4F6', margin: '4px 0' }} />
                                    <button onClick={() => { onLogout(); setMenuOpen(false) }}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                                        <LogOut size={14} /> Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Page content */}
            <main>{children}</main>

            {/* Bottom nav */}
            <nav className="bottom-nav">
                <div className="bottom-nav-inner">
                    {TABS.map(t => (
                        <button key={t.id} className={`nav-tab ${ activeTab === t.id ? 'active' : '' }`} onClick={() => setActiveTab(t.id)}>
                            <t.icon size={19} strokeWidth={activeTab === t.id ? 2.2 : 1.7} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    )
}
