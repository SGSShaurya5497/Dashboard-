const STATUSES = ['Not Contacted', 'Contacted', 'Demo Done', 'Purchased']
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Added' },
  { value: 'gym_name',   label: 'Gym Name' },
  { value: 'area',       label: 'Area' },
  { value: 'status',     label: 'Status' },
  { value: 'last_contacted_date', label: 'Last Contacted' },
]

export default function Filters({ filters, onChange, onAddLead }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="filters-bar">
      <span className="filter-label">Filter:</span>

      <select
        id="filter-status"
        value={filters.status}
        onChange={e => set('status', e.target.value)}
        style={{ minWidth: 150 }}
      >
        <option value="">All Statuses</option>
        {STATUSES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <input
        id="filter-area"
        type="text"
        placeholder="Filter by area…"
        value={filters.area}
        onChange={e => set('area', e.target.value)}
        style={{ minWidth: 160 }}
      />

      <span className="filter-label" style={{ marginLeft: 8 }}>Sort:</span>

      <select
        id="sort-by"
        value={filters.sort}
        onChange={e => set('sort', e.target.value)}
        style={{ minWidth: 140 }}
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        id="sort-order"
        value={filters.order}
        onChange={e => set('order', e.target.value)}
        style={{ minWidth: 100 }}
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>

      <div className="filters-right">
        <button
          id="add-lead-btn"
          className="btn-primary"
          onClick={onAddLead}
        >
          + Add Lead
        </button>
      </div>
    </div>
  )
}
