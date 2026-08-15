import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Dashboard from './components/Dashboard.jsx'
import { getMe } from './api.js'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if already logged in (existing session cookie)
  useEffect(() => {
    getMe()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading…</div>

  if (!user) return <Login onLogin={setUser} />

  return <Dashboard user={user} onLogout={() => setUser(null)} />
}
