const STATUSES = ['Not Contacted', 'Contacted', 'Demo Done', 'Purchased']

const statusClass = {
  'Not Contacted': 'not-contacted',
  'Contacted':     'contacted',
  'Demo Done':     'demo-done',
  'Purchased':     'purchased',
}

const ledClass = {
  'Not Contacted': 'led-nc',
  'Contacted':     'led-ct',
  'Demo Done':     'led-dd',
  'Purchased':     'led-pu',
}

const summaryMod = {
  'Not Contacted': 'nc',
  'Contacted':     'ct',
  'Demo Done':     'dd',
  'Purchased':     'pu',
}

export default function SummaryStrip({ leads }) {
  const total = leads.length
  const counts = Object.fromEntries(STATUSES.map(s => [s, 0]))
  leads.forEach(l => {
    if (counts[l.status] !== undefined) counts[l.status]++
  })

  return (
    <div className="summary-strip" role="region" aria-label="Lead summary">
      <div className="summary-item summary-total">
        <span className="summary-led led-total" />
        <span className="count">{total}</span>
        <span className="summary-label">Total Leads</span>
      </div>

      {STATUSES.map(s => (
        <div key={s} className={`summary-item summary-${summaryMod[s]}`}>
          <span className={`summary-led ${ledClass[s]}`} />
          <span className="count">{counts[s]}</span>
          <span className="summary-label">{s}</span>
        </div>
      ))}
    </div>
  )
}
