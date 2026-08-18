import { useState, useEffect } from 'react'
import { createGym, suggestUsername } from '../api.js'

function slugify(text) {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export default function CreateGymModal({ onClose, onCreated }) {
  const [gymName, setGymName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isCustomUsername, setIsCustomUsername] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdResult, setCreatedResult] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  // Generate initial random password on mount
  useEffect(() => {
    suggestUsername('')
      .then(res => {
        if (res?.password) setPassword(res.password)
      })
      .catch(() => {})
  }, [])

  // Auto-slugify gym name unless user manually modified username
  function handleGymNameChange(e) {
    const val = e.target.value
    setGymName(val)
    if (!isCustomUsername) {
      setUsername(slugify(val))
    }
  }

  function handleUsernameChange(e) {
    setUsername(e.target.value)
    setIsCustomUsername(true)
  }

  async function handleRegeneratePassword() {
    try {
      const res = await suggestUsername(gymName)
      if (res?.password) setPassword(res.password)
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!gymName.trim()) {
      setError('Please enter a gym name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await createGym({
        gym_name: gymName.trim(),
        username: username.trim() || undefined,
        password: password.trim() || undefined,
      })

      if (res.success && res.gym) {
        setCreatedResult(res.gym)
        if (onCreated) {
          onCreated(res.gym)
        }
      } else {
        setError('Failed to create gym account')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while creating the gym account.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2500)
    })
  }

  function handleCopyAll() {
    if (!createdResult) return
    const text = `🏋️ Gymmer Account Details\nGym Name: ${createdResult.gym_name}\nUsername: ${createdResult.username}\nPassword: ${createdResult.password}`
    handleCopy(text, 'all')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card create-gym-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🏢</span>
            <h2>{createdResult ? 'Gym Account Created' : 'Create New Gym'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* View 1: Creation Form */}
        {!createdResult && (
          <form onSubmit={handleSubmit} className="modal-form">
            <p className="modal-subtitle">
              Create an owner account in the Gymmer PostgreSQL database with 12-round bcrypt password encryption.
            </p>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="gym-name-input">
                Gym Name <span className="req">*</span>
              </label>
              <input
                id="gym-name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Iron Edge Fitness"
                value={gymName}
                onChange={handleGymNameChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="label-with-hint">
                <label htmlFor="gym-username-input">
                  Generated Username / Identifier <span className="req">*</span>
                </label>
                <span className="label-hint">Editable before saving</span>
              </div>
              <div className="input-with-prefix">
                <input
                  id="gym-username-input"
                  type="text"
                  className="form-input code-font"
                  placeholder="e.g. iron-edge-fitness"
                  value={username}
                  onChange={handleUsernameChange}
                  required
                />
              </div>
              <small className="field-help">
                Lowercased slug. If taken, a random 3-digit number is automatically appended upon save.
              </small>
            </div>

            <div className="form-group">
              <div className="label-with-hint">
                <label htmlFor="gym-password-input">
                  Initial Password <span className="req">*</span>
                </label>
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleRegeneratePassword}
                >
                  🔄 Regenerate
                </button>
              </div>
              <div className="password-preview-wrap">
                <input
                  id="gym-password-input"
                  type="text"
                  className="form-input code-font"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="password-tag">10-char Crypto Secure</span>
              </div>
              <small className="field-help">
                Generated avoiding ambiguous characters (0, O, l, 1). Hashed with 12 bcrypt salt rounds.
              </small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                id="create-gym-submit-btn"
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Account…' : 'Create Gym Account'}
              </button>
            </div>
          </form>
        )}

        {/* View 2: One-Time Plaintext Credentials Display */}
        {createdResult && (
          <div className="credentials-view">
            <div className="credentials-alert">
              <span className="alert-icon">✨</span>
              <div>
                <strong>Gym Account Created Successfully</strong>
                <p>
                  Copy these login credentials for the gym owner. You can also view, copy, or reset this password anytime from the <strong>Gym Accounts</strong> directory.
                </p>
              </div>
            </div>

            <div className="credentials-card">
              <div className="cred-row">
                <span className="cred-label">Gym Name</span>
                <span className="cred-val bold">{createdResult.gym_name}</span>
              </div>

              <div className="cred-row">
                <span className="cred-label">Username / Email</span>
                <div className="cred-val-wrap">
                  <span className="cred-val code-font">{createdResult.username}</span>
                  <button
                    className="btn-icon"
                    title="Copy Username"
                    onClick={() => handleCopy(createdResult.username, 'username')}
                  >
                    {copiedField === 'username' ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              <div className="cred-row">
                <span className="cred-label">Initial Password</span>
                <div className="cred-val-wrap">
                  <span className="cred-val code-font password-highlight">{createdResult.password}</span>
                  <button
                    className="btn-icon"
                    title="Copy Password"
                    onClick={() => handleCopy(createdResult.password, 'password')}
                  >
                    {copiedField === 'password' ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="credentials-actions">
              <button
                className="btn-secondary"
                onClick={handleCopyAll}
              >
                {copiedField === 'all' ? '✅ All Copied to Clipboard!' : '📋 Copy All Details'}
              </button>
              <button
                id="credentials-done-btn"
                className="btn-primary"
                onClick={onClose}
              >
                Done & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
