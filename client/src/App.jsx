import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import People from './pages/People'
import Billing from './pages/Billing'
import SelectProfile from './pages/SelectProfile'
import { useProfile } from './ProfileContext'

function Navbar() {
  const { profile, setProfileId } = useProfile()

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-notion-hover text-notion-text'
        : 'text-notion-subtle hover:bg-notion-hover hover:text-notion-text'
    }`

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-notion-border">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍱</span>
          <span className="font-semibold text-notion-text text-[15px]">Mess Tracker</span>
        </div>
        {profile && (
          <button
            onClick={() => setProfileId(null)}
            title="Switch profile"
            className="flex items-center gap-2 px-2 py-1 hover:bg-notion-hover rounded-md"
          >
            <div className="w-6 h-6 rounded-full bg-notion-blueBg text-notion-blue flex items-center justify-center chip">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-notion-text">{profile.name}</span>
          </button>
        )}
      </div>
      <div className="max-w-2xl mx-auto px-3 pb-2 flex gap-1">
        <NavLink to="/" className={linkClass}>Today</NavLink>
        <NavLink to="/people" className={linkClass}>People</NavLink>
        <NavLink to="/billing" className={linkClass}>Billing</NavLink>
      </div>
    </header>
  )
}

export default function App() {
  const { profileId, checking } = useProfile()

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-notion-light text-sm">Loading...</div>
      </div>
    )
  }

  if (!profileId) return <SelectProfile />

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/people" element={<People />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
