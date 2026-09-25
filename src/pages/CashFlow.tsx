import { useMemo, useState } from 'react'
import { BILL_FEE, landlords, managedProperties } from '../data/seed'
import { formatCOP, formatMillions, monthLong, monthShort } from '../lib/format'
import { useStore } from '../lib/store'
import type { BillType, ManagedProperty, MonthRecord } from '../types'

const BILL_LABEL: Record<BillType, string> = {
  administracion: 'Administración',
  agua: 'Agua (Acueducto)',
  luz: 'Luz (Enel)',
  gas: 'Gas (Vanti)',
  predial: 'Predial (cuota)',
}

const NET = '#0d9488'
const COSTS = '#d97706'

function monthTotals(m: MonthRecord) {
  const bills = m.bills.reduce((s, b) => s + b.amount, 0)
  const fees = m.bills.length * BILL_FEE
  return { rent: m.rentCollected, bills, fees, net: m.rentCollected - bills - fees, count: m.bills.length }
}

function aggregate(props: ManagedProperty[]) {
  const months = props[0]?.history.map((h) => h.month) ?? []
  return months.map((month) => {
    const rows = props.map((p) => monthTotals(p.history.find((h) => h.month === month)!))
    return {
      month,
      rent: rows.reduce((s, r) => s + r.rent, 0),
      bills: rows.reduce((s, r) => s + r.bills, 0),
      fees: rows.reduce((s, r) => s + r.fees, 0),
      net: rows.reduce((s, r) => s + r.net, 0),
      count: rows.reduce((s, r) => s + r.count, 0),
    }
  })
}

export function CashFlow() {
  const s = useStore()
  const landlord = landlords.find((l) => l.id === s.landlordId)!
  const props = managedProperties.filter((p) => p.landlordId === landlord.id)
  const [propId, setPropId] = useState<string>('all')
  const scope = propId === 'all' ? props : props.filter((p) => p.id === propId)
  const series = useMemo(() => aggregate(scope), [scope])
  const last = series[series.length - 1]
  const sixNet = series.reduce((s, m) => s + m.net, 0)
  const sixFees = series.reduce((s, m) => s + m.fees, 0)
  const sixBills = series.reduce((s, m) => s + m.count, 0)
  const lastMonth = last?.month

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-teal-700">Panel del propietario · {landlord.name}</p>
      <h1 className="text-3xl font-extrabold tracking-tight">Flujo de caja</h1>
      <p className="mt-1 max-w-2xl text-stone-600">
        EzRent cobra el arriendo y paga automáticamente agua, luz, gas, administración y predial. Tú recibes el neto cada mes. Tarifa: {formatCOP(BILL_FEE)} por factura pagada.
      </p>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {[{ id: 'all', name: 'Todos los inmuebles' }, ...props].map((p) => (
          <button
            key={p.id}
            onClick={() => setPropId(p.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${propId === p.id ? 'bg-stone-900 text-white ring-stone-900' : 'bg-white text-stone-700 ring-stone-300 hover:bg-stone-50'}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={`Neto ${monthLong(lastMonth)}`} value={formatCOP(last.net)} hero />
        <Kpi label={`Arriendo recaudado ${monthShort(lastMonth)}`} value={formatCOP(last.rent)} />
        <Kpi label="Neto últimos 6 meses" value={formatCOP(sixNet)} />
        <Kpi label="Facturas pagadas (6 meses)" value={`${sixBills}`} sub={`Tarifas EzRent: ${formatCOP(sixFees)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-stone-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">Arriendo recaudado por mes</h2>
            <div className="flex items-center gap-4 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: NET }} /> Ingreso neto
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COSTS }} /> Facturas + tarifas
              </span>
            </div>
          </div>
          <Chart data={series} />
        </section>

        <section className="rounded-2xl border border-stone-200 p-5">
          <h2 className="font-bold">Pagos automáticos · {monthLong(lastMonth)}</h2>
          <ul className="mt-3 max-h-[330px] divide-y divide-stone-100 overflow-y-auto pr-1 text-sm">
            {scope.flatMap((p) =>
              p.history
                .find((h) => h.month === lastMonth)!
                .bills.map((b) => (
                  <li key={p.id + b.type} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="font-semibold">{BILL_LABEL[b.type]}</div>
                      <div className="truncate text-xs text-stone-500">{p.name} · pagado ✓</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCOP(b.amount)}</div>
                      <div className="text-xs text-stone-500">+ {formatCOP(BILL_FEE)} tarifa</div>
                    </div>
                  </li>
                )),
            )}
          </ul>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200">
        <h2 className="p-5 pb-3 font-bold">Neto por inmueble y mes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-2.5">Inmueble</th>
                {series.map((m) => (
                  <th key={m.month} className="px-3 py-2.5 text-right capitalize">
                    {monthShort(m.month)}
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right">Total 6 m</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {scope.map((p) => {
                const rows = p.history.map(monthTotals)
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-stone-500">
                        Arrendatario: {p.tenantName} · canon {formatCOP(p.canon)}
                      </div>
                    </td>
                    {rows.map((r, i) => (
                      <td key={i} className="px-3 py-3 text-right tabular-nums" title={`Recaudado ${formatCOP(r.rent)} − facturas ${formatCOP(r.bills)} − tarifas ${formatCOP(r.fees)}`}>
                        {formatMillions(r.net)}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right font-bold tabular-nums">{formatCOP(rows.reduce((s, r) => s + r.net, 0))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Kpi({ label, value, sub, hero }: { label: string; value: string; sub?: string; hero?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${hero ? 'bg-teal-700 text-white' : 'border border-stone-200'}`}>
      <div className={`text-xs first-letter:uppercase ${hero ? 'text-teal-100' : 'text-stone-500'}`}>{label}</div>
      <div className="mt-1 text-xl font-extrabold tabular-nums sm:text-2xl">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
    </div>
  )
}

function Chart({ data }: { data: ReturnType<typeof aggregate> }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 260
  const pad = { l: 52, r: 8, t: 12, b: 28 }
  const max = Math.max(...data.map((d) => d.rent)) * 1.1
  const step = Math.ceil(max / 4 / 500_000) * 500_000 || 500_000
  const niceMax = step * 4
  const ticks = Array.from({ length: 5 }, (_, i) => step * i)
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const bw = (iw / data.length) * 0.55
  const y = (v: number) => pad.t + ih - (v / niceMax) * ih
  const x = (i: number) => pad.l + (iw / data.length) * (i + 0.5)

  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Arriendo recaudado dividido en ingreso neto y facturas pagadas por mes">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#78716c">
              {t === 0 ? '0' : formatMillions(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const costs = d.bills + d.fees
          const netTop = y(d.net)
          const costTop = y(d.rent)
          return (
            <g key={d.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
              <rect x={x(i) - (iw / data.length) / 2} y={pad.t} width={iw / data.length} height={ih} fill={hover === i ? '#f5f5f4' : 'transparent'} />
              <rect x={x(i) - bw / 2} y={netTop} width={bw} height={y(0) - netTop} fill={NET} rx={0} />
              {/* 2px gap entre segmentos */}
              <path
                d={`M${x(i) - bw / 2},${netTop - 2} V${costTop + 4} Q${x(i) - bw / 2},${costTop} ${x(i) - bw / 2 + 4},${costTop} H${x(i) + bw / 2 - 4} Q${x(i) + bw / 2},${costTop} ${x(i) + bw / 2},${costTop + 4} V${netTop - 2} Z`}
                fill={COSTS}
                opacity={costs > 0 ? 1 : 0}
              />
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="#57534e" className="capitalize">
                {monthShort(d.month)}
              </text>
              {i === data.length - 1 && (
                <text x={x(i)} y={costTop - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1c1917">
                  {formatMillions(d.net)} neto
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-52 rounded-xl bg-stone-900 p-3 text-xs text-white shadow-xl"
          style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 104px), calc(100% - 208px))` }}
        >
          <div className="mb-1 font-bold first-letter:uppercase">{monthLong(data[hover].month)}</div>
          <Row k="Recaudado" v={formatCOP(data[hover].rent)} />
          <Row k="Facturas" v={`− ${formatCOP(data[hover].bills)}`} dot={COSTS} />
          <Row k={`Tarifas (${data[hover].count})`} v={`− ${formatCOP(data[hover].fees)}`} />
          <div className="mt-1 border-t border-white/20 pt-1">
            <Row k="Neto" v={formatCOP(data[hover].net)} dot={NET} bold />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ k, v, dot, bold }: { k: string; v: string; dot?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${bold ? 'font-bold' : ''}`}>
      <span className="inline-flex items-center gap-1.5 text-stone-300">
        {dot && <span className="h-2 w-2 rounded-sm" style={{ background: dot }} />}
        {k}
      </span>
      <span className="tabular-nums">{v}</span>
    </div>
  )
}
