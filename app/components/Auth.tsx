'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth ({ onLogin }: { onLogin: (userId: string, email: string) => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handle = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('')
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                setError('Check your email to confirm your account, then sign in.')
                setMode('signin')
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                if (data.user) onLogin(data.user.id, data.user.email ?? '')
            }
        } catch (err: any) { setError(err.message) }
        finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC', padding: '0 20px' }}>
            <div style={{ width: '100%', maxWidth: 360 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>L</span>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>LifeSync</h1>
                    <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Personal Productivity OS</p>
                </div>

                {/* Toggle */}
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                    {(['signin', 'signup'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)}
                            style={{ flex: 1, padding: '8px', fontSize: 13, fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#111827' : '#9CA3AF', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                            {m === 'signin' ? 'Sign In' : 'Create Account'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label className="label">Email</label>
                        <input type="email" className="input" placeholder="you@example.com" value={email}
                            onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div>
                        <label className="label">Password</label>
                        <input type="password" className="input" placeholder="••••••••" value={password}
                            onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                    </div>

                    {error && (
                        <div style={{ background: mode === 'signup' && error.includes('Check') ? '#F0FDF4' : '#FFF5F5', border: `1px solid ${ mode === 'signup' && error.includes('Check') ? '#86EFAC' : '#FECACA' }`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: mode === 'signup' && error.includes('Check') ? '#166534' : '#991B1B' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}
                        style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    )
}
