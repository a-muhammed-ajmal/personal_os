'use client'
import { useState } from 'react'
import { Home, ListTodo, FolderKanban, BookOpen, Check, X, ChevronDown, Settings, Bell } from 'lucide-react'

const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'habits', label: 'Habits', icon: Check },
    { id: 'notes', label: 'Notes', icon: BookOpen },
]

export default function Navigation ({
    activeTab, setActiveTab, onLogout, onRequestNotifications
}: {
    activeTab: string
    setActiveTab: (tab: string) => void
    onLogout: () => void
    onRequestNotifications: () => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const active = tabs.find(t => t.id === activeTab)

    return (
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="container flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-900">LifeSync</span>
                        {active && (
                            <span className="text-xs text-gray-400 ml-2">{active.label}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={onRequestNotifications} className="p-2 rounded-md hover:bg-gray-100 text-gray-500" title="Enable notifications">
                        <Bell size={18} />
                    </button>
                    <div className="relative">
                        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm text-gray-700">
                            Menu <ChevronDown size={14} className={`transition-transform ${ isOpen ? 'rotate-180' : '' }`} />
                        </button>
                        {isOpen && (
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                {tabs.map(tab => (
                                    <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsOpen(false) }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors
                      ${ activeTab === tab.id ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50 text-gray-700' }`}>
                                        <tab.icon size={15} />
                                        {tab.label}
                                    </button>
                                ))}
                                <hr className="border-gray-100" />
                                <button onClick={() => { onLogout(); setIsOpen(false) }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50">
                                    <Settings size={15} /> Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
