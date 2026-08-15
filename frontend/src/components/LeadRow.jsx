import { useState } from 'react'
import { updateLead, deleteLead } from '../api.js'

const STATUSES = ['Not Contacted', 'Contacted', 'Demo Done', 'Purchased']
const MEMBERS  = ['Shaurya', 'Shashwat', 'Tanish', 'Daksh']

const statusClass = {
  'Not Contacted': 'not-contacted',
  'Contacted': 'contacted',
  'Demo Done': 'demo-done',
  'Purchased': 'purchased',
}

export default function LeadRow({ lead, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...lead })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        <div className="actions-cell">
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
