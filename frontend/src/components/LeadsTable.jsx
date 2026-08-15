import LeadRow from './LeadRow.jsx'

const COLUMNS = [
  { key: 'gym_name',            label: 'Gym Name',        sortable: true },
  { key: 'area',                label: 'Area / Location', sortable: true },
  { key: 'owner_contact',       label: 'Owner Contact',   sortable: false },
  { key: 'status',              label: 'Status',          sortable: true },
  { key: 'last_contacted_date', label: 'Last Contacted',  sortable: true },
  { key: 'visited_by',          label: 'Visited By',      sortable: false },
  { key: 'notes',               label: 'Notes',           sortable: false },
  { key: '_actions',            label: '',                sortable: false },
]

export default function LeadsTable({ leads, sort, order, onSortChange, onUpdated, onDeleted }) {
  function handleSortClick(col) {
    if (!col.sortable) return
    if (sort === col.key) {
      onSortChange(col.key, order === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(col.key, 'asc')
    }
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={[
                  col.sortable ? 'sortable' : '',
                  sort === col.key ? 'active-sort' : '',
                ].join(' ')}
                onClick={() => handleSortClick(col)}
              >
                {col.label}
                {col.sortable && (
                  <span className="sort-icon">
                    {sort === col.key ? (order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length}>
                <div className="empty-state">
                  <div style={{ fontSize: 32 }}>📋</div>
                  <p>No leads found. Add one to get started.</p>
                </div>
              </td>
            </tr>
          ) : (
            leads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onUpdated={onUpdated}
                onDeleted={onDeleted}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
