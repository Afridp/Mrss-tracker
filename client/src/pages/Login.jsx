import React, { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useTheme } from '../ThemeContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
    </svg>
  )
}

export default function Login() {
  const { signInWithGoogle } = useAuth()
  const { theme, toggle } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <button
        onClick={toggle}
        className="absolute top-4 right-4 w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="w-12 h-12 rounded-md bg-notion-text text-notion-bg flex items-center justify-center chip mb-5">
        M
      </div>
      <h1 className="text-3xl font-bold text-notion-text tracking-tight mb-1">Mess Tracker</h1>
      <p className="label-mono mb-10">Sign in to continue</p>

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center gap-3 px-6 py-3 bg-notion-text text-notion-bg rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition-transform"
      >
        <GoogleIcon />
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>

      {error && <p className="mt-4 text-sm text-notion-subtle">{error}</p>}

      <p className="mt-10 text-xs text-notion-light text-center max-w-xs">
        Sign in with the Google account your admin registered you with.
      </p>
    </div>
  )
}
