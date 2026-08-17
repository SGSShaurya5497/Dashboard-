import { useState } from 'react'

export default function GymsList({ gyms, loading, onRefresh, onCreateGymClick }) {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const filteredGyms = gyms.filter(g => {
    const q = search.toLowerCase()
    const nameMatch = (g.gym_name || '').toLowerCase().includes(q)
    const userMatch = (g.username || '').toLowerCase().includes(q)
    return nameMatch || userMatch
  })

  function handleCopyUsername(id, username) {
    navigator.clipboard.writeText(username).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="gyms-container">
      {/* Top action & search bar */}
      <div className="gyms-header-bar">
        <div className="gyms-title-group">
          <h2>Gym Accounts Directory</h2>
          <span className="gyms-badge">{gyms.length} Registered {gyms.length === 1 ? 'Gym' : 'Gyms'}</span>
        </div>

        <div className="gyms-actions-group">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search gym name or username…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={onRefresh}
            title="Refresh list from PostgreSQL DB"
            disabled={loading}
          >
            🔄 Refresh
          </button>

          <button
            id="open-create-gym-btn"
            className="btn-primary"
            onClick={onCreateGymClick}
          >
            ➕ Create Gym
          </button>
        </div>
      </div>

      {/* Database indicator note */}
      <div className="db-source-notice">
        <span className="db-dot"></span>
        Connected to <strong>PostgreSQL</strong> (users table, bcrypt-12).
      </div>

      {/* Content / Table */}
      {loading ? (
        <div className="loading">Loading gym accounts from database…</div>
      ) : filteredGyms.length === 0 ? (
        <div className="gyms-empty-state">
          <div className="empty-icon">🏢</div>
          <h3>{search ? 'No matching gyms found' : 'No gyms registered yet'}</h3>
          <p>
            {search
              ? `No results for "${search}". Try searching with a different term.`
              : 'Create your first gym account to generate encrypted owner credentials.'}
          </p>
          {!search && (
            <button className="btn-primary" onClick={onCreateGymClick}>
              ➕ Create First Gym
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="leads-table gyms-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Gym Name</th>
                <th>Username</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.map((gym, idx) => (
                <tr key={gym.id || gym.username || idx} className="gym-row">
                  <td className="text-muted">{idx + 1}</td>
                  <td>
                    <div className="gym-name-cell">
                      <span className="gym-avatar">🏋️</span>
                      <strong className="gym-name-text">{gym.gym_name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="username-badge code-font">
                      {gym.username}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-copy-sm"
                      title="Copy Username"
                      onClick={() => handleCopyUsername(gym.id || idx, gym.username)}
                    >
                      {copiedId === (gym.id || idx) ? '✅ Copied' : '📋 Copy'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
