import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sale = await queryOne(`
      SELECT s.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', si.id, 'product_name', si.product_name, 'sale_type', si.sale_type,
          'qty', si.qty, 'unit_price', si.unit_price, 'subtotal', si.subtotal,
          'profit', si.profit, 'denomination_label', si.denomination_label
        )) FILTER (WHERE si.id IS NOT NULL) AS items,
        json_agg(DISTINCT jsonb_build_object(
          'method', sp.method, 'amount', sp.amount, 'reference', sp.reference
        )) FILTER (WHERE sp.id IS NOT NULL) AS payments
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN sale_payments sp ON sp.sale_id = s.id
      WHERE s.id=$1 GROUP BY s.id
    `, [params.id])
    if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: sale })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { status, payment_method, payment_ref } = body
    const sale = await queryOne(`
      UPDATE sales SET
        status = COALESCE($1, status),
        payment_method = COALESCE($2, payment_method),
        payment_ref = COALESCE($3, payment_ref)
      WHERE id=$4 RETURNING *
    `, [status, payment_method, payment_ref, params.id])

    // Also update sale_payments if marking paid
    if (status === 'paid') {
      await query(
        `UPDATE sale_payments SET method = COALESCE($1, method) WHERE sale_id=$2 AND method='credit'`,
        [payment_method || 'cash', params.id]
      )
    }
    return NextResponse.json({ data: sale })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
