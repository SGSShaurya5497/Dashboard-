import { useState } from 'react'
import { createLead } from '../api.js'

const STATUSES = ['Not Contacted', 'Contacted', 'Demo Done', 'Purchased']
const MEMBERS  = ['Shaurya', 'Shashwat', 'Tanish', 'Daksh']

const EMPTY_FORM = {
  gym_name: '',
  area: '',
  owner_contact: '',
  status: 'Not Contacted',
  last_contacted_date: '',
  visited_by: '',
  notes: '',
}

export default function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.gym_name.trim()) {
      setError('Gym name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const newLead = await createLead({
        ...form,
        last_contacted_date: form.last_contacted_date || null,
        visited_by: form.visited_by || null,
      })
      onCreated(newLead)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add lead')
    } finally {
      setSaving(false)
    }
  }

  // Close on overlay click
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-lead-title">
        <h2 id="add-lead-title">Add New Lead</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-gym-name">Gym Name *</label>
            <input
              id="new-gym-name"
              type="text"
              value={form.gym_name}
              onChange={e => set('gym_name', e.target.value)}
              placeholder="e.g. Iron Paradise Gym"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-area">Area / Location</label>
            <input
              id="new-area"
              type="text"
              value={form.area}
              onChange={e => set('area', e.target.value)}
              placeholder="e.g. Andheri West"
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-contact">Owner Contact Number</label>
            <input
              id="new-contact"
              type="text"
              value={form.owner_contact}
              onChange={e => set('owner_contact', e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="new-status">Status</label>
              <select
                id="new-status"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="new-visited-by">Visited By</label>
              <select
                id="new-visited-by"
                value={form.visited_by}
                onChange={e => set('visited_by', e.target.value)}
              >
                <option value="">— None —</option>
                {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="new-last-contacted">Last Contacted Date</label>
            <input
              id="new-last-contacted"
              type="date"
              value={form.last_contacted_date}
              onChange={e => set('last_contacted_date', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-notes">Notes</label>
            <textarea
              id="new-notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this lead…"
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button
              id="cancel-add-lead"
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              id="save-add-lead"
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Adding…' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
