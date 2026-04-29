import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import People from './pages/People'
import Billing from './pages/Billing'
import Login from './pages/Login'
import { useProfile } from './ProfileContext'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'

function NotRegistered() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <button
        onClick={toggle}
        className="absolute top-4 right-4 w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center"
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      <div className="w-12 h-12 rounded-md bg-notion-text text-notion-bg flex items-center justify-center chip mb-5">M</div>
      <h1 className="text-xl font-bold text-notion-text mb-2">Not registered</h1>
      <p className="text-sm text-notion-subtle mb-1">
        <span className="font-medium text-notion-text">{user?.email}</span> is not in the system.
      </p>
      <p className="text-sm text-notion-subtle mb-8">Ask Afrid to add you in the People tab.</p>
      <button
        onClick={logout}
        className="px-4 py-2 border border-notion-border rounded-md text-sm font-medium text-notion-subtle hover:bg-notion-hover"
      >
        Sign out
      </button>
    </div>
  )
}

function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { profile } = useProfile()
  const { theme, toggle } = useTheme()

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-notion-hover text-notion-text'
        : 'text-notion-subtle hover:bg-notion-hover hover:text-notion-text'
    }`

  const displayName = isAdmin ? (profile?.name || 'Afrid') : profile?.name
  const displayLabel = isAdmin ? 'Admin' : null

  return (
    <header className="sticky top-0 z-20 bg-notion-bg border-b border-notion-border">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍱</span>
          <span className="font-semibold text-notion-text text-[15px]">Mess Tracker</span>
          {isAdmin && (
            <span className="chip px-1.5 py-0.5 bg-notion-text text-notion-bg rounded text-[9px]">
              Admin
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="w-8 h-8 rounded-md hover:bg-notion-hover text-notion-subtle flex items-center justify-center text-[15px]"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-2 px-2 py-1 hover:bg-notion-hover rounded-md"
          >
            <div className="w-6 h-6 rounded-full bg-notion-hover text-notion-text border border-notion-border flex items-center justify-center chip">
              {(displayName || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-notion-text hidden sm:block">{displayName || user?.email}</span>
          </button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-3 pb-2 flex gap-1">
        <NavLink to="/" className={linkClass}>Today</NavLink>
        {isAdmin && <NavLink to="/people" className={linkClass}>People</NavLink>}
        <NavLink to="/billing" className={linkClass}>Billing</NavLink>
      </div>
    </header>
  )
}

export default function App() {
  const { user, isAdmin } = useAuth()
  const { profileId, checking } = useProfile()

  // Auth still loading
  if (user === undefined || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-notion-light text-sm">Loading...</div>
      </div>
    )
  }

  // Not signed in
  if (!user) return <Login />

  // Signed in but email not in the system (and not admin)
  if (!isAdmin && !profileId) return <NotRegistered />

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {isAdmin && <Route path="/people" element={<People />} />}
          <Route path="/billing" element={<Billing />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
