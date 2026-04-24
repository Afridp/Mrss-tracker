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
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍱</span>
          <span className="font-bold text-gray-800 text-lg">Mess Tracker</span>
        </div>
        {profile && (
          <button
            onClick={() => setProfileId(null)}
            title="Switch profile"
            className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-xs">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-orange-700 font-medium">{profile.name}</span>
            <span className="text-orange-400 text-xs">⇄</span>
          </button>
        )}
      </div>
      <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-1">
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
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  }

  if (!profileId) {
    return <SelectProfile />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
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
