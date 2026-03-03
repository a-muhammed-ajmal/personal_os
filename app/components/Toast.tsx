'use client'
import { useState, useEffect } from 'react'

interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info' }
let uid = 0
let push: ((m: string, t?: Toast['type']) => void) | null = null
export const toast = (m: string, t: Toast['type'] = 'success') => push?.(m, t)

export function Toaster () {
    const [items, setItems] = useState<Toast[]>([])
    push = (msg, type = 'success') => {
        const id = ++uid
        setItems(p => [...p, { id, msg, type }])
        setTimeout(() => setItems(p => p.filter(i => i.id !== id)), 3000)
    }
    useEffect(() => () => { push = null }, [])

    return (
        <div className="toast-wrap">
            {items.map(i => (
                <div key={i.id} className={`toast-item toast-${ i.type }`}>
                    {i.type === 'success' ? '✓ ' : i.type === 'error' ? '✗ ' : 'ℹ '}{i.msg}
                </div>
            ))}
        </div>
    )
}
