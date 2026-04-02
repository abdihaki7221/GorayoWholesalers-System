'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fmt, today } from '@/lib/utils'
import { useAuth } from '@/components/AuthContext'

export default function CashPage() {
  const { isSuperAdmin } = useAuth()
  const [date, setDate] = useState(today())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'owner_withdrawal', amount: '', description: '' })
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    fetch(`/api/cash-ledger?date=${date}`)
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
  }

  useEffect(() => { load() }, [date])

  async function save() {
    if (!form.amount) return toast.error('Amount is required')
    setSaving(true)
    try {
      const res = await fetch('/api/cash-ledger', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount), ledger_date: date })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Entry recorded!')
      setShowForm(false); setForm({ type: 'owner_withdrawal', amount: '', description: '' })
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const s = data?.summary || {}
  const entries: any[] = data?.entries || []

  return (
    <div className="animate-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Cash / Safe Management</h1>
          <p className="page-sub">Track cash in safe, owner withdrawals, and deposits</p>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" className="duka-input" style={{width:'auto'}} value={date}
            onChange={e => setDate(e.target.value)} />
          <button className="btn btn-outline btn-sm" onClick={() => setDate(today())}>Today</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ New Entry</button>
        </div>
      </div>

      {/* Safe Summary */}
      {!loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card green">
              <div className="stat-label">Safe Balance</div>
              <div className={`stat-value ${Number(s.safe_balance||0) >= 0 ? 'text-green' : 'text-red'}`}>
                {Number(s.safe_balance||0).toLocaleString('en-KE',{maximumFractionDigits:0})}
              </div>
              <div className="stat-sub">End of day cash</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Opening Balance</div>
              <div className="stat-value">{Number(s.opening_balance||0).toLocaleString('en-KE',{maximumFractionDigits:0})}</div>
              <div className="stat-sub">Start of day</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-label">Cash In Today</div>
              <div className="stat-value">{Number((s.cash_sales||0)+(s.credit_cash_received||0)+(s.deposits||0)).toLocaleString('en-KE',{maximumFractionDigits:0})}</div>
              <div className="stat-sub">Sales + debt + deposits</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Owner Withdrawals</div>
              <div className="stat-value">{Number(s.owner_withdrawals||0).toLocaleString('en-KE',{maximumFractionDigits:0})}</div>
              <div className="stat-sub">Given to owner</div>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="duka-card">
              <div className="duka-card-title">🔐 Safe Calculation</div>
              <div className="space-y-1">
                {[
                  { label: 'Previous Day Safe', val: s.prev_safe_balance, cls: '' },
                  { label: 'Opening Balance (override)', val: s.opening_balance, cls: '' },
                  { label: '+ Cash Sales', val: s.cash_sales, cls: 'text-green' },
                  { label: '+ Debt Cash Received', val: s.credit_cash_received, cls: 'text-green' },
                  { label: '+ Deposits', val: s.deposits, cls: 'text-green' },
                  { label: '- Owner Withdrawals', val: s.owner_withdrawals, cls: 'text-red' },
                  { label: '- Cash Expenses', val: s.cash_expenses, cls: 'text-red' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sub text-sm">{r.label}</span>
                    <span className={`mono font-semibold ${r.cls}`}>{fmt(r.val || 0)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-bold text-base">
                  <span>Safe Balance</span>
                  <span className={`mono ${Number(s.safe_balance||0)>=0?'text-green':'text-red'}`}>{fmt(s.safe_balance||0)}</span>
                </div>
              </div>
            </div>

            {/* Ledger entries */}
            <div className="duka-card">
              <div className="duka-card-title">📋 Ledger Entries</div>
              {entries.length === 0 ? (
                <div className="empty-state py-4">No entries for this date</div>
              ) : (
                <div className="space-y-2">
                  {entries.map((e: any) => (
                    <div key={e.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm text-white capitalize">{e.type.replace(/_/g, ' ')}</div>
                        {e.description && <div className="text-xs text-muted">{e.description}</div>}
                      </div>
                      <span className={`mono font-semibold ${e.type === 'owner_withdrawal' ? 'text-red' : 'text-green'}`}>
                        {e.type === 'owner_withdrawal' ? '-' : '+'}{fmt(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && <div className="empty-state">Loading...</div>}

      {/* New entry modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <h2 className="modal-title">New Cash Ledger Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="duka-label">Type</label>
                <select className="duka-input duka-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="owner_withdrawal">💼 Owner Withdrawal (give to owner)</option>
                  <option value="opening_balance">📂 Set Opening Balance</option>
                  <option value="cash_deposit">💰 Cash Deposit (add to safe)</option>
                  <option value="adjustment">🔧 Adjustment</option>
                </select>
              </div>
              <div>
                <label className="duka-label">Amount (KES)</label>
                <input type="number" step="0.01" className="duka-input" placeholder="0.00"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="duka-label">Description / Note</label>
                <input className="duka-input" placeholder="e.g. Cash given to boss for bank deposit"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? '⏳ Saving...' : '💾 Record Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
