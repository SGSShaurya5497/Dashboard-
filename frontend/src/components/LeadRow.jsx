import { useState } from 'react'
import { updateLead, deleteLead } from '../api.js'

const STATUSES = ['Not Contacted', 'Contacted', 'Demo Done', 'Purchased']
const MEMBERS  = ['Shaurya', 'Tanish', 'Daksh']

const statusClass = {
  'Not Contacted': 'not-contacted',
  'Contacted': 'contacted',
  'Demo Done': 'demo-done',
  'Purchased': 'purchased',
}

// Returns days elapsed since a given datetime string (handles SQLite format and ISO)
function daysSince(dateStr) {
  if (!dateStr) return null
  const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + (dateStr.endsWith('Z') ? '' : 'Z')
  const created = new Date(isoStr)
  const validCreated = isNaN(created.getTime()) ? new Date(dateStr) : created
  if (isNaN(validCreated.getTime())) return null
  const now = new Date()
  const diff = Math.floor((now - validCreated) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

// Color urgency: green < 3 days, yellow 3–7, orange 7–14, red > 14
function urgencyClass(days) {
  if (days === null) return ''
  if (days < 3)  return 'days-fresh'
  if (days < 7)  return 'days-warm'
  if (days < 14) return 'days-hot'
  return 'days-urgent'
}

function urgencyLabel(days) {
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 7)  return `${days}d ago`
  if (days < 14) return `${days}d • Follow up`
  return `${days}d • Urgent Push!`
}

export default function LeadRow({ lead, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...lead })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pushing, setPushing] = useState(false)

  function startEdit() {
    setForm({ ...lead })
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const updated = await updateLead(lead.id, {
        gym_name: form.gym_name,
        area: form.area,
        owner_contact: form.owner_contact,
        status: form.status,
        last_contacted_date: form.last_contacted_date,
        visited_by: form.visited_by,
        notes: form.notes,
      })
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickPush() {
    setPushing(true)
    const today = new Date().toISOString().slice(0, 10)
    const nextStatus = lead.status === 'Not Contacted' ? 'Contacted' : lead.status
    try {
      const updated = await updateLead(lead.id, {
        gym_name: lead.gym_name,
        area: lead.area,
        owner_contact: lead.owner_contact,
        status: nextStatus,
        last_contacted_date: today,
        visited_by: lead.visited_by,
        notes: lead.notes,
      })
      onUpdated(updated)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to push lead')
    } finally {
      setPushing(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${lead.gym_name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteLead(lead.id)
      onDeleted(lead.id)
    } catch {
      alert('Failed to delete lead')
      setDeleting(false)
    }
  }

  function field(key) {
    return (
      <input
        value={form[key] || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    )
  }

  if (editing) {
    return (
      <tr className="row-editing">
        {/* Gym Name */}
        <td className="cell-edit">{field('gym_name')}</td>
        {/* Area */}
        <td className="cell-edit">{field('area')}</td>
        {/* Owner Contact */}
        <td className="cell-edit">{field('owner_contact')}</td>
        {/* Status */}
        <td className="cell-edit">
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        {/* Last Contacted */}
        <td className="cell-edit">
          <input
            type="date"
            value={form.last_contacted_date || ''}
            onChange={e => setForm(f => ({ ...f, last_contacted_date: e.target.value }))}
          />
        </td>
        {/* Visited By */}
        <td className="cell-edit">
          <select
            value={form.visited_by || ''}
            onChange={e => setForm(f => ({ ...f, visited_by: e.target.value }))}
          >
            <option value="">—</option>
            {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </td>
        {/* Notes */}
        <td className="cell-edit">
          <textarea
            value={form.notes || ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </td>
        {/* Days Since Lead (read-only in edit mode) */}
        <td>
          {(() => {
            const days = daysSince(lead.created_at)
            if (days === null) return <span className="cell-muted">—</span>
            return (
              <span className={`days-badge ${urgencyClass(days)}`}>
                <span className="days-icon">⏱</span>
                {urgencyLabel(days)}
              </span>
            )
          })()}
        </td>
        {/* Actions */}
        <td>
          <div className="actions-cell">
            <button
              className="btn-primary"
              onClick={saveEdit}
              disabled={saving}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              className="btn-secondary"
              onClick={cancelEdit}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const days = daysSince(lead.created_at)

  return (
    <tr>
      <td className="cell-text" style={{ fontWeight: 500 }}>{lead.gym_name}</td>
      <td className="cell-muted">{lead.area || '—'}</td>
      <td className="cell-muted">{lead.owner_contact || '—'}</td>
      <td>
        <span className={`status-badge ${statusClass[lead.status] || 'not-contacted'}`}>
          <span className="badge-led" />
          {lead.status}
        </span>
      </td>
      <td className="cell-muted">{lead.last_contacted_date || '—'}</td>
      <td className="cell-muted">{lead.visited_by || '—'}</td>
      <td className="cell-muted" style={{ maxWidth: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {lead.notes || '—'}
      </td>
      <td>
        {days === null ? (
          <span className="cell-muted">—</span>
        ) : (
          <span
            className={`days-badge ${urgencyClass(days)}`}
            title={`Lead added ${days} day(s) ago (${lead.created_at})`}
          >
            <span className="days-icon">⏱</span>
            {urgencyLabel(days)}
          </span>
        )}
      </td>
      <td>
        <div className="actions-cell">
          <button
            className="btn-push"
            onClick={handleQuickPush}
            disabled={pushing}
            title="⚡ Push Lead: Set contacted date to Today and update status"
          >
            {pushing ? '…' : '⚡ Push'}
          </button>
          <button className="btn-icon" onClick={startEdit} title="Edit lead">✏️</button>
          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete lead"
          >
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </td>
    </tr>
  )
}
