'use client'

import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'

type Mode = 'magic' | 'password' | 'reset'

export function LoginButtons() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirectTo') || `/${locale}/dashboard`
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push(redirectTo)
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(`/${locale}/setup-password`)}`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="rounded-sm border border-primary/30 bg-primary/5 px-5 py-6 text-center">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#63AE26" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-foreground">Check your inbox</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === 'reset'
            ? <>We sent a password reset link to <span className="font-medium text-foreground">{email}</span></>
            : <>We sent a login link to <span className="font-medium text-foreground">{email}</span></>
          }
        </p>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex rounded-sm border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => { setMode('magic'); setError(null); setSent(false) }}
          className={`flex-1 py-2 text-xs font-bold tracking-wide transition-colors ${
            mode === 'magic' ? 'bg-[#63AE26] text-white' : 'bg-white text-muted-foreground hover:text-foreground'
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => { setMode('password'); setError(null); setSent(false) }}
          className={`flex-1 py-2 text-xs font-bold tracking-wide transition-colors ${
            mode === 'password' ? 'bg-[#63AE26] text-white' : 'bg-white text-muted-foreground hover:text-foreground'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setMode('reset'); setError(null); setSent(false) }}
          className={`flex-1 py-2 text-xs font-bold tracking-wide transition-colors ${
            mode === 'reset' ? 'bg-[#63AE26] text-white' : 'bg-white text-muted-foreground hover:text-foreground'
          }`}
        >
          Reset
        </button>
      </div>

      <form
        onSubmit={mode === 'magic' ? handleMagicLink : mode === 'password' ? handlePassword : handleReset}
        className="space-y-3"
      >
        <div>
          <label htmlFor="email" className="block text-xs font-bold text-muted-foreground mb-1.5 tracking-wide uppercase">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@brand-university.de"
            className="w-full h-11 px-3 rounded-sm border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-muted-foreground mb-1.5 tracking-wide uppercase">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3 rounded-sm border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {mode === 'reset' && (
          <p className="text-xs text-muted-foreground">
            You'll receive an email with a link to set a new password.
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email || (mode === 'password' && !password)}
          className="w-full h-11 rounded-sm bg-[#63AE26] hover:bg-[#57991f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold text-white tracking-wide"
        >
          {loading ? '…' : mode === 'magic' ? 'Send Login Link' : mode === 'password' ? 'Sign In' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
