'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth ({ onLogin }: { onLogin: () => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                alert('Check your email for confirmation!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                onLogin()
            }
        } catch (err: any) { setError(err.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">L</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">LifeSync</h1>
                    <p className="text-sm text-gray-500 mt-1">Personal Productivity OS</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-3">
                    <input type="email" placeholder="Email" value={email}
                        onChange={e => setEmail(e.target.value)} className="input" required />
                    <input type="password" placeholder="Password" value={password}
                        onChange={e => setPassword(e.target.value)} className="input" required />
                    {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                        {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>
                <p className="text-center text-xs text-gray-500 mt-4">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary-600 font-medium">
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    )
}
