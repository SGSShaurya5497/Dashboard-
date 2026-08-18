import { useState } from 'react'
import { updateGymPassword, suggestUsername, bulkResetPasswords } from '../api.js'

export default function GymsList({ gyms, loading, onRefresh, onCreateGymClick }) {
  const [search, setSearch] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [showAllPasswords, setShowAllPasswords] = useState(false)
  
  // Password Reset Modal State
  const [resetModalGym, setResetModalGym] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [resetError, setResetError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [isBulkResetting, setIsBulkResetting] = useState(false)

  const filteredGyms = gyms.filter(g => {
    const q = search.toLowerCase()
    const nameMatch = (g.gym_name || '').toLowerCase().includes(q)
    const userMatch = (g.username || '').toLowerCase().includes(q)
    const passMatch = (g.password || '').toLowerCase().includes(q)
    return nameMatch || userMatch || passMatch
  })

  function showToast(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  function handleCopy(text, key, label) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      showToast(`Copied ${label} to clipboard!`)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  function handleCopyAll(gym) {
    const pwdText = gym.password ? gym.password : '(Encrypted / Not set)'
    const details = `🏋️ Gym Account Details\nGym Name: ${gym.gym_name}\nUsername: ${gym.username}\nPassword: ${pwdText}`
    handleCopy(details, `all-${gym.id}`, 'all credentials')
  }

  function togglePasswordVisibility(id) {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  function toggleShowAll() {
    const nextState = !showAllPasswords
    setShowAllPasswords(nextState)
    const newVis = {}
    gyms.forEach(g => {
      newVis[g.id] = nextState
    })
    setVisiblePasswords(newVis)
  }

  async function handleBulkReset() {
    if (!window.confirm('This will generate NEW passwords for all gyms that currently have no stored password. Continue?')) return
    setIsBulkResetting(true)
    try {
      const res = await bulkResetPasswords()
      if (res.success && res.updated.length > 0) {
        // Auto-reveal all (use a flag; refresh will repopulate gyms)
        setShowAllPasswords(true)
        // Pre-set visibility for the IDs we just updated
        const newVis = {}
        res.updated.forEach(u => { newVis[u.id] = true })
        setVisiblePasswords(prev => ({ ...prev, ...newVis }))
        // Refresh to pull new passwords from DB
        if (onRefresh) await onRefresh()
        showToast(`✅ Generated passwords for ${res.updated.length} gym(s)! Passwords are now visible.`)
      } else {
        showToast('All gyms already have passwords stored.')
      }
    } catch (err) {
      showToast('❌ Failed to generate passwords. Try again.')
      console.error(err)
    } finally {
      setIsBulkResetting(false)
    }
  }

  async function openResetModal(gym) {
    setResetModalGym(gym)
    setResetError('')
    try {
      const res = await suggestUsername('')
      setNewPassword(res?.password || 'GymPass' + Math.floor(1000 + Math.random() * 9000))
    } catch {
      setNewPassword('GymPass' + Math.floor(1000 + Math.random() * 9000))
    }
  }

  async function handleRegenerateModalPassword() {
    try {
      const res = await suggestUsername('')
      if (res?.password) setNewPassword(res.password)
    } catch {}
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    if (!resetModalGym || !newPassword.trim()) return

    setIsUpdatingPassword(true)
    setResetError('')

    try {
      await updateGymPassword(resetModalGym.id, newPassword.trim())
      showToast(`Password updated for ${resetModalGym.gym_name}!`)
      setResetModalGym(null)
      if (onRefresh) onRefresh()
    } catch (err) {
      setResetError(err.response?.data?.error || 'Failed to update password in database')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="gyms-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="gyms-toast-notification">
          <span>✅ {toastMessage}</span>
        </div>
      )}

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
              placeholder="Search gym, username, password…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {gyms.some(g => !g.password) && (
            <button
              className="btn-generate-all"
              onClick={handleBulkReset}
              disabled={isBulkResetting}
              title="Generate new passwords for all gyms that show Encrypted"
            >
              {isBulkResetting ? '⏳ Generating…' : '🔑 Generate All Passwords'}
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={toggleShowAll}
            title={showAllPasswords ? "Mask all passwords" : "Show all passwords"}
          >
            {showAllPasswords ? '🙈 Hide Passwords' : '👁️ Show Passwords'}
          </button>

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
        Connected to <strong>PostgreSQL</strong> (users table with encrypted auth & credential management).
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
              : 'Create your first gym account to generate owner credentials.'}
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
                <th style={{ width: '50px' }}>#</th>
                <th>Gym Name</th>
                <th>Username</th>
                <th>Password</th>
                <th style={{ width: '190px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGyms.map((gym, idx) => {
                const gymKey = gym.id || gym.username || idx
                const isPassVisible = showAllPasswords || Boolean(visiblePasswords[gym.id])
                const hasPassword = Boolean(gym.password)

                return (
                  <tr key={gymKey} className="gym-row">
                    <td className="text-muted">{idx + 1}</td>
                    
                    {/* Gym Name */}
                    <td>
                      <div className="gym-name-cell">
                        <span className="gym-avatar">🏋️</span>
                        <strong className="gym-name-text">{gym.gym_name}</strong>
                      </div>
                    </td>

                    {/* Username */}
                    <td>
                      <div className="credential-cell-wrap">
                        <span className="username-badge code-font" title={gym.username}>
                          {gym.username}
                        </span>
                        <button
                          className="btn-icon-subtle"
                          title="Copy Username"
                          onClick={() => handleCopy(gym.username, `user-${gymKey}`, 'Username')}
                        >
                          {copiedKey === `user-${gymKey}` ? '✅' : '📋'}
                        </button>
                      </div>
                    </td>

                    {/* Password */}
                    <td>
                      {hasPassword ? (
                        <div className="credential-cell-wrap password-cell">
                          <span className={`password-badge code-font ${isPassVisible ? 'revealed' : 'masked'}`}>
                            {isPassVisible ? gym.password : '••••••••••'}
                          </span>
                          
                          <button
                            className="btn-icon-subtle"
                            title={isPassVisible ? "Hide password" : "Show password"}
                            onClick={() => togglePasswordVisibility(gym.id)}
                          >
                            {isPassVisible ? '🙈' : '👁️'}
                          </button>

                          <button
                            className="btn-icon-subtle"
                            title="Copy Password"
                            onClick={() => handleCopy(gym.password, `pass-${gymKey}`, 'Password')}
                          >
                            {copiedKey === `pass-${gymKey}` ? '✅' : '📋'}
                          </button>
                        </div>
                      ) : (
                        <div className="credential-cell-wrap">
                          <span className="pwd-encrypted-badge" title="Password was hashed prior to storage update">
                            🔒 Encrypted
                          </span>
                          <button
                            className="btn-set-pwd-inline"
                            onClick={() => openResetModal(gym)}
                            title="Set a new password for this gym account"
                          >
                            Set Password
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="gym-actions-cell">
                        <button
                          className="btn-copy-sm"
                          title="Copy Full Credentials"
                          onClick={() => handleCopyAll(gym)}
                        >
                          {copiedKey === `all-${gym.id}` ? '✅ Copied' : '📋 Copy All'}
                        </button>

                        <button
                          className="btn-reset-sm"
                          title="Set or reset account password"
                          onClick={() => openResetModal(gym)}
                        >
                          🔑 Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset / Set Password Modal */}
      {resetModalGym && (
        <div className="modal-overlay" onClick={() => setResetModalGym(null)}>
          <div className="modal-card reset-pwd-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-icon">🔑</span>
                <h2>Update Password</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setResetModalGym(null)}>✕</button>
            </div>

            <form onSubmit={handleSavePassword} className="modal-form">
              <p className="modal-subtitle">
                Set a new login password for <strong>{resetModalGym.gym_name}</strong> (Username: <code className="code-font">{resetModalGym.username}</code>).
              </p>

              {resetError && <div className="form-error-banner">{resetError}</div>}

              <div className="form-group">
                <div className="label-with-hint">
                  <label htmlFor="modal-new-pwd">
                    New Password <span className="req">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={handleRegenerateModalPassword}
                  >
                    🔄 Regenerate
                  </button>
                </div>
                <div className="password-preview-wrap">
                  <input
                    id="modal-new-pwd"
                    type="text"
                    className="form-input code-font"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="password-tag">PostgreSQL bcrypt</span>
                </div>
                <small className="field-help">
                  This immediately updates both the encrypted database hash and the stored dashboard credential.
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setResetModalGym(null)}
                  disabled={isUpdatingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdatingPassword || !newPassword.trim()}
                >
                  {isUpdatingPassword ? 'Saving…' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
