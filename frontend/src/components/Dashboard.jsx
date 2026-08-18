import { useState, useEffect, useCallback } from 'react'
import { getLeads, getGyms, logout } from '../api.js'
import SummaryStrip from './SummaryStrip.jsx'
import Filters from './Filters.jsx'
import LeadsTable from './LeadsTable.jsx'
import AddLeadModal from './AddLeadModal.jsx'
import GymsList from './GymsList.jsx'
import CreateGymModal from './CreateGymModal.jsx'

const DEFAULT_FILTERS = {
  status: '',
  area: '',
  sort: 'created_at',
  order: 'desc',
}

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('leads') // 'leads' | 'gyms'
  
  // Leads State (SQLite DB)
  const [leads, setLeads] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [showLeadModal, setShowLeadModal] = useState(false)

  // Gyms State (PostgreSQL DB)
  const [gyms, setGyms] = useState([])
  const [loadingGyms, setLoadingGyms] = useState(false)
  const [showGymModal, setShowGymModal] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true)
    try {
      const data = await getLeads({
        status: filters.status || undefined,
        area:   filters.area   || undefined,
        sort:   filters.sort,
        order:  filters.order,
      })
      setLeads(data)
    } catch {
      // If 401, session expired
    } finally {
      setLoadingLeads(false)
    }
  }, [filters])

  const fetchGyms = useCallback(async () => {
    setLoadingGyms(true)
    try {
      const data = await getGyms()
      setGyms(data)
    } catch (err) {
      console.error('Failed to fetch gyms:', err)
    } finally {
      setLoadingGyms(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    if (activeTab === 'gyms') {
      fetchGyms()
    }
  }, [activeTab, fetchGyms])

  function handleSortChange(col, ord) {
    setFilters(f => ({ ...f, sort: col, order: ord }))
  }

  function handleLeadUpdated(updated) {
    setLeads(ls => ls.map(l => l.id === updated.id ? updated : l))
  }

  function handleLeadDeleted(id) {
    setLeads(ls => ls.filter(l => l.id !== id))
  }

  function handleLeadCreated() {
    fetchLeads()
  }

  function handleGymCreated(newGym) {
    // Add to running list or re-fetch
    setGyms(prev => [
      {
        id: newGym.id,
        gym_name: newGym.gym_name,
        username: newGym.username,
        password: newGym.password,
        gym_id: null,
      },
      ...prev.filter(g => g.username !== newGym.username)
    ])
  }

  async function handleLogout() {
    try { await logout() } catch {}
    onLogout()
  }

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            🏋️ Gymmer Dashboard
          </div>
          <nav className="nav-tabs">
            <button
              id="tab-leads-btn"
              className={`nav-tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              📋 Leads Tracker
            </button>
            <button
              id="tab-gyms-btn"
              className={`nav-tab-btn ${activeTab === 'gyms' ? 'active' : ''}`}
              onClick={() => setActiveTab('gyms')}
            >
              🏢 Gym Accounts
            </button>
          </nav>
        </div>

        <div className="user-info">
          <button
            id="quick-create-gym-btn"
            className="btn-create-gym-header"
            onClick={() => setShowGymModal(true)}
            title="Create a new gym owner account in Postgres"
          >
            ⚡ Create Gym
          </button>
          <span>Logged in as <strong>{user.displayName}</strong></span>
          <button
            id="logout-btn"
            className="btn-secondary"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'leads' ? (
          <>
            <SummaryStrip leads={leads} />

            <Filters
              filters={filters}
              onChange={setFilters}
              onAddLead={() => setShowLeadModal(true)}
            />

            {loadingLeads ? (
              <div className="loading">Loading leads…</div>
            ) : (
              <LeadsTable
                leads={leads}
                sort={filters.sort}
                order={filters.order}
                onSortChange={handleSortChange}
                onUpdated={handleLeadUpdated}
                onDeleted={handleLeadDeleted}
              />
            )}
          </>
        ) : (
          <GymsList
            gyms={gyms}
            loading={loadingGyms}
            onRefresh={fetchGyms}
            onCreateGymClick={() => setShowGymModal(true)}
          />
        )}
      </main>

      {/* Leads Modal (SQLite) */}
      {showLeadModal && (
        <AddLeadModal
          onClose={() => setShowLeadModal(false)}
          onCreated={handleLeadCreated}
        />
      )}

      {/* Create Gym Modal (PostgreSQL) */}
      {showGymModal && (
        <CreateGymModal
          onClose={() => setShowGymModal(false)}
          onCreated={handleGymCreated}
        />
      )}
    </>
  )
}
