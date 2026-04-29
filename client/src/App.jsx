import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import People from './pages/People'
import Billing from './pages/Billing'
import Login from './pages/Login'
import SetupProfile from './pages/SetupProfile'
import { useProfile } from './ProfileContext'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'

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

  const displayName = isAdmin ? (profile?.name || user?.displayName || 'Admin') : profile?.name
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-20 bg-notion-bg border-b border-notion-border">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍱</span>
          <span className="font-semibold text-notion-text text-[15px]">Mess Tracker</span>
          {isAdmin && (
            <span className="chip px-1.5 py-0.5 bg-notion-text text-notion-bg rounded text-[9px]">Admin</span>
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

          {/* Avatar dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-notion-hover rounded-md"
            >
              <div className="w-6 h-6 rounded-full bg-notion-hover text-notion-text border border-notion-border flex items-center justify-center chip">
                {(displayName || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-notion-text hidden sm:block">
                {displayName || user?.email}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-notion-bg border border-notion-border rounded-md shadow-lg overflow-hidden z-50">
                <div className="px-3 py-2.5 border-b border-notion-border">
                  <div className="text-xs font-medium text-notion-text truncate">{displayName || 'User'}</div>
                  <div className="label-mono truncate mt-0.5">{user?.email}</div>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full text-left px-3 py-2.5 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2"
                >
                  <span className="text-notion-subtle">↪</span> Sign out
                </button>
              </div>
            )}
          </div>
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

  // Signed in but no profile yet — let them set one up
  if (!isAdmin && !profileId) return <SetupProfile />

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
