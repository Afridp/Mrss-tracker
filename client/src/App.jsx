import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import People from './pages/People'
import Billing from './pages/Billing'

function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-orange-500 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍱</span>
          <span className="font-bold text-gray-800 text-lg">Mess Tracker</span>
        </div>
        <nav className="flex gap-1">
          <NavLink to="/" className={linkClass}>Today</NavLink>
          <NavLink to="/people" className={linkClass}>People</NavLink>
          <NavLink to="/billing" className={linkClass}>Billing</NavLink>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
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
