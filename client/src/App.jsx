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
    `flex-1 text-center px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-white shadow-sm text-orange-600'
        : 'text-stone-500 hover:text-stone-900'
    }`

  return (
    <header className="sticky top-0 z-20 glass border-b border-stone-200/50">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍱</span>
          <span className="font-bold text-stone-900 text-lg tracking-tight">Mess Tracker</span>
        </div>
        {profile && (
          <button
            onClick={() => setProfileId(null)}
            title="Switch profile"
            className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white/80 hover:bg-white border border-stone-200 rounded-full shadow-sm hover:shadow"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-stone-800 font-medium text-sm">{profile.name}</span>
          </button>
        )}
      </div>
      <div className="max-w-2xl mx-auto px-3 pb-3">
        <div className="flex gap-1 bg-stone-100/80 rounded-2xl p-1">
          <NavLink to="/" className={linkClass}>Today</NavLink>
          <NavLink to="/people" className={linkClass}>People</NavLink>
          <NavLink to="/billing" className={linkClass}>Billing</NavLink>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const { profileId, checking } = useProfile()

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!profileId) {
    return <SelectProfile />
  }

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
