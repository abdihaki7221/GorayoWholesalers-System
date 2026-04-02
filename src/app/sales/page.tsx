'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fmt, fmtDate, fmtTime } from '@/lib/utils'
import { useAuth } from '@/components/AuthContext'
import ReceiptModal from '@/components/ReceiptModal'

const PAY_BADGE: Record<string,string> = { cash:'badge-green', mpesa:'badge-blue', kcb:'badge-yellow', credit:'badge-red' }

export default function SalesPage() {
  const { isSuperAdmin } = useAuth()
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [receipt, setReceipt] = useState<any>(null)

  function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (dateFilter) p.set('date', dateFilter)
    if (search) p.set('search', search)
    if (statusFilter) p.set('status', statusFilter)
    fetch(`/api/sales?${p}`).then(r => r.json()).then(d => { setSales(d.data || []); setLoading(false) })
  }

  useEffect(() => { load() }, [dateFilter, search, statusFilter])

  async function markPaid(id: number, method = 'cash') {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', payment_method: method })
    })
    if (res.ok) { toast.success(`Marked as paid (${method})`); load() }
  }

  const totalSales  = sales.reduce((a, s) => a + Number(s.total), 0)
  const totalProfit = sales.reduce((a, s) => a + Number(s.profit), 0)

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="page-title">Sales History</h1>
        <p className="page-sub">
          {sales.length} records · Sales: <strong className="text-accent">{fmt(totalSales)}</strong>
          {isSuperAdmin && <> · Profit: <strong className="text-green">{fmt(totalProfit)}</strong></>}
        </p>
      </div>

      <div className="duka-card mb-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-36"><label className="duka-label">Date</label>
          <input type="date" className="duka-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} /></div>
        <div className="flex-1 min-w-36"><label className="duka-label">Status</label>
          <select className="duka-input duka-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option><option value="paid">Paid</option><option value="pending">Pending</option>
          </select></div>
        <div className="flex-1 min-w-36"><label className="duka-label">Search</label>
          <input className="duka-input" placeholder="Customer or receipt #" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="flex items-end">
          <button className="btn btn-outline" onClick={() => { setDateFilter(''); setSearch(''); setStatusFilter('') }}>Clear</button>
        </div>
      </div>

      <div className="duka-card">
        {loading ? <div className="empty-state">Loading...</div> : sales.length === 0 ? <div className="empty-state">No sales found</div> : (
          <div className="overflow-x-auto">
            <table className="duka-table">
              <thead><tr>
                <th>Receipt</th><th>Date/Time</th><th>Customer</th><th>Items</th>
                <th>Total</th>{isSuperAdmin && <th>Profit</th>}<th>Payment</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {sales.map(s => {
                  const payments: any[] = (s.payments||[]).filter(Boolean)
                  const items: any[] = (s.items||[]).filter(Boolean)
                  return (
                    <tr key={s.id}>
                      <td className="mono text-white text-xs">{s.receipt_no}</td>
                      <td><div>{fmtDate(s.sale_date)}</div><div className="text-xs text-muted">{fmtTime(s.created_at)}</div></td>
                      <td>{s.customer_name}</td>
                      <td className="text-xs text-muted" style={{maxWidth:180}}>
                        {items.slice(0,2).map((it,i) => <div key={i}>{it.product_name}{it.denomination_label?` (${it.denomination_label})`:''} ×{Number(it.qty).toFixed(Number(it.qty)%1?2:0)}</div>)}
                        {items.length>2 && <div className="text-muted">+{items.length-2} more</div>}
                      </td>
                      <td className="mono text-green font-semibold">
                        {fmt(s.total)}
                        {Number(s.discount||0)>0 && <div className="text-xs text-red">-{fmt(s.discount)} disc</div>}
                      </td>
                      {isSuperAdmin && <td className="mono text-yellow">{fmt(s.profit)}</td>}
                      <td>
                        {payments.length > 1 ? (
                          <div className="space-y-0.5">{payments.map((p,i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className={`badge ${PAY_BADGE[p.method]||'badge-gray'} text-xs`}>{p.method.toUpperCase()}</span>
                              <span className="mono text-xs text-muted">{fmt(p.amount)}</span>
                            </div>
                          ))}</div>
                        ) : <span className={`badge ${PAY_BADGE[payments[0]?.method]||'badge-gray'}`}>{payments[0]?.method?.toUpperCase()}</span>}
                      </td>
                      <td><span className={`badge ${s.status==='paid'?'badge-green':'badge-red'}`}>{s.status}</span></td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <button className="btn btn-outline btn-sm" onClick={() => setReceipt(s)}>🧾</button>
                          {s.status==='pending' && <>
                            <button className="btn btn-success btn-sm" onClick={() => markPaid(s.id,'cash')}>💵</button>
                            <button className="btn btn-outline btn-sm" onClick={() => markPaid(s.id,'mpesa')}>📱</button>
                            <button className="btn btn-outline btn-sm" onClick={() => markPaid(s.id,'kcb')}>🏦</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}
