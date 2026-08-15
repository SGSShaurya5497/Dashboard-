import { useState, useEffect, useCallback } from 'react'
import { getLeads, logout } from '../api.js'
import SummaryStrip from './SummaryStrip.jsx'
import Filters from './Filters.jsx'
import LeadsTable from './LeadsTable.jsx'
import AddLeadModal from './AddLeadModal.jsx'

const DEFAULT_FILTERS = {
  status: '',
  area: '',
  sort: 'created_at',
  order: 'desc',
}

export default function Dashboard({ user, onLogout }) {
  const [leads, setLeads] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  function handleSortChange(col, ord) {
    setFilters(f => ({ ...f, sort: col, order: ord }))
  }

  function handleUpdated(updated) {
    setLeads(ls => ls.map(l => l.id === updated.id ? updated : l))
  }

  function handleDeleted(id) {
    setLeads(ls => ls.filter(l => l.id !== id))
  }

  function handleCreated(newLead) {
    // Re-fetch so sort/filter is respected
    fetchLeads()
  }

  async function handleLogout() {
    try { await logout() } catch {}
    onLogout()
  }

  return (
    <>
      <header className="app-header">
        <div className="logo">
          🏋️ Gymmer Sales Tracker
        </div>
        <div className="user-info">
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
        <SummaryStrip leads={leads} />

        <Filters
          filters={filters}
          onChange={setFilters}
          onAddLead={() => setShowModal(true)}
        />

        {loading ? (
          <div className="loading">Loading leads…</div>
        ) : (
          <LeadsTable
            leads={leads}
            sort={filters.sort}
            order={filters.order}
            onSortChange={handleSortChange}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        )}
      </main>

      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
