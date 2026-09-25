import { useEffect, useState } from 'react'
import { Avatar, Button, Check, Photo, StatusPill } from '../components/ui'
import { applicants, landlords, listings } from '../data/seed'
import { aiSummary, cargoOf, contractLabel, employerOf, evaluate, polizaOf } from '../lib/evaluate'
import { formatCOP, formatRatio, formatRelative, tenureLabel } from '../lib/format'
import { tr } from '../lib/i18n'
import { useStore } from '../lib/store'

export function Pipeline({ initialListing }: { initialListing?: string }) {
  const s = useStore()
  const landlord = landlords.find((l) => l.id === s.landlordId)!
  const props = listings.filter((l) => l.landlordId === landlord.id)
  const [selected, setSelected] = useState<string>(initialListing && props.some((p) => p.id === initialListing) ? initialListing : props[0].id)

  useEffect(() => {
    if (!props.some((p) => p.id === selected)) setSelected(initialListing && props.some((p) => p.id === initialListing) ? initialListing : props[0].id)
  }, [landlord.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialListing && props.some((p) => p.id === initialListing)) setSelected(initialListing)
  }, [initialListing]) // eslint-disable-line react-hooks/exhaustive-deps

  const listing = props.find((p) => p.id === selected) ?? props[0]

  const byListing = (id: string) => {
    const l = listings.find((x) => x.id === id)!
    const apps = s.applications.filter((a) => a.listingId === id)
    const withEval = apps.map((a) => {
      const applicant = applicants.find((p) => p.id === a.applicantId)!
      return { app: a, applicant, ev: evaluate(applicant, l) }
    })
    const qualified = withEval
      .filter((x) => x.ev.qualified && x.app.status !== 'en_revision')
      .sort((a, b) => b.app.createdAt.localeCompare(a.app.createdAt))
    const filtered = withEval.filter((x) => !x.ev.qualified).length
    const verifying = withEval.filter((x) => x.ev.qualified && x.app.status === 'en_revision').length
    return { qualified, filtered, verifying }
  }

  const current = byListing(listing.id)
  const newestId = current.qualified[0]?.app.id

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal-700">{tr(`Landlord dashboard · ${landlord.name}`, `Panel del propietario · ${landlord.name}`)}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{tr('Pre-approved applicants', 'Aplicantes preaprobados')}</h1>
          <p className="mt-1 text-stone-600">
            {tr(
              'You only see people who already meet your requirements. Our agent filters out the rest for you, before you waste a visit.',
              'Solo ves personas que ya cumplen tus requisitos. Nuestro agente filtra el resto por ti antes de que pierdas una visita.',
            )}
          </p>
        </div>
      </div>

      {/* Selector de inmueble */}
      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-2">
        {props.map((p) => {
          const c = byListing(p.id)
          const active = p.id === listing.id
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`flex w-64 shrink-0 items-center gap-3 rounded-2xl border p-2.5 text-left transition ${active ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-100' : 'border-stone-200 hover:border-stone-300'}`}
            >
              <Photo src={p.photos[0]} alt={tr(p.titleEn, p.title)} className="h-14 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <div className="truncate font-bold">{p.barrio}</div>
                <div className="text-xs text-stone-500">
                  {tr(`${p.habitaciones} bd`, `${p.habitaciones} hab`)} · {formatCOP(p.canon)}
                </div>
                <div className="mt-0.5 text-xs font-bold text-teal-700">{c.qualified.length} {c.qualified.length === 1 ? tr('pre-approved', 'preaprobado') : tr('pre-approved', 'preaprobados')}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-teal-700 px-3 py-1 font-bold text-white">{current.qualified.length} {current.qualified.length === 1 ? tr('pre-approved', 'preaprobado') : tr('pre-approved', 'preaprobados')}</span>
            {current.filtered > 0 && (
              <span className="rounded-full bg-stone-100 px-3 py-1 font-semibold text-stone-600">{tr(
                  `${current.filtered} automatically screened out for not meeting requirements`,
                  `${current.filtered} ${current.filtered === 1 ? 'descartado' : 'descartados'} automáticamente por no cumplir requisitos`,
                )}
              </span>
            )}
            {current.verifying > 0 && <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800">{tr(`${current.verifying} being verified`, `${current.verifying} en verificación`)}</span>}
          </div>

          {current.qualified.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">
              {tr(
                'No pre-approved applicants for this place yet. We’ll message you on WhatsApp when the first one arrives.',
                'Aún no hay aplicantes preaprobados para este inmueble. Te avisaremos por WhatsApp cuando llegue el primero.',
              )}
            </div>
          ) : (
            <ul className="mt-5 space-y-4">
              {current.qualified.map(({ app, applicant, ev }) => (
                <li key={app.id} className={`animate-fade-up rounded-2xl border bg-white p-5 ${app.id === newestId && app.status === 'preaprobado' ? 'border-teal-500 shadow-lg shadow-teal-900/5' : 'border-stone-200'}`}>
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar initials={applicant.initials} color={applicant.color} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold">{applicant.name}</span>
                        {app.id === newestId && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-extrabold text-stone-900">{tr('NEW', 'NUEVO')}</span>}
                        <StatusPill status={app.status} />
                      </div>
                      <div className="text-sm text-stone-500">
                        {cargoOf(applicant)} · {employerOf(applicant)} · {tr(`applied ${formatRelative(app.createdAt)}`, `aplicó ${formatRelative(app.createdAt)}`)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-center">
                      <div className="text-lg font-extrabold text-emerald-700">
                        {ev.passedCount}/{ev.results.length}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">{tr('requirements', 'requisitos')}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-stone-50 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                        <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9zM19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" />
                      </svg>
                      {tr('Profile summary', 'Resumen del perfil')}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{aiSummary(applicant, listing)}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Mini label={tr('Income', 'Ingresos')} value={formatCOP(applicant.monthlyIncome)} sub={tr(`${formatRatio(ev.incomeRatio)}× rent`, `${formatRatio(ev.incomeRatio)}× canon`)} />
                    <Mini label={tr('Contract', 'Contrato')} value={contractLabel(applicant.contract)} sub={tenureLabel(applicant.tenureMonths)} />
                    <Mini
                      label={tr('Guarantee', 'Garantía')}
                      value={applicant.poliza ? tr('Lease insurance', 'Póliza') : tr('Co-signer', 'Codeudor')}
                      sub={applicant.poliza ? polizaOf(applicant)!.split(' · ')[1] : tr('Owns property', 'Con finca raíz')}
                    />
                    <Mini label={tr('Credit score', 'Puntaje')} value={String(applicant.creditScore)} sub={tr('No negative reports', 'Sin reportes')} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {ev.results.map((r) => (
                      <span key={r.key} className="inline-flex items-center gap-1 text-xs text-stone-600">
                        <Check ok={r.passed} className="h-4 w-4" /> {r.label}
                      </span>
                    ))}
                  </div>

                  {app.status === 'preaprobado' ? (
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => s.setStatus(app.id, 'aceptado')} className="flex-1 sm:flex-none">
                        {tr('Accept and book visit', 'Aceptar y agendar visita')}
                      </Button>
                      <Button variant="danger" onClick={() => s.setStatus(app.id, 'rechazado')} className="flex-1 sm:flex-none">
                        {tr('Decline', 'Declinar')}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <span className="text-stone-600">{app.status === 'aceptado'
                          ? tr('Accepted. We sent a visit invitation and the digital lease.', 'Aceptado. Enviamos invitación a visita y contrato digital.')
                          : tr('Declined. We notified the applicant.', 'Declinado. Notificamos al aplicante.')}</span>
                      <button onClick={() => s.setStatus(app.id, 'preaprobado')} className="font-semibold text-teal-700 underline">
                        {tr('Undo', 'Deshacer')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 p-5">
            <div className="text-sm font-semibold text-stone-500">{tr(`Your requirements for ${listing.barrio}`, `Tus requisitos para ${listing.barrio}`)}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                •{' '}
                {tr(
                  `Income ≥ ${formatRatio(listing.requirements.incomeMultiple)}× rent (${formatCOP(listing.canon * listing.requirements.incomeMultiple)})`,
                  `Ingresos ≥ ${formatRatio(listing.requirements.incomeMultiple)}× canon (${formatCOP(listing.canon * listing.requirements.incomeMultiple)})`,
                )}
              </li>
              <li>
                • {tr('Contract:', 'Contrato:')}{' '}
                {listing.requirements.contract === 'indefinido'
                  ? tr('permanent', 'término indefinido')
                  : listing.requirements.contract === 'indefinido_o_fijo'
                    ? tr('permanent or fixed-term', 'indefinido o fijo')
                    : tr('any', 'cualquiera')}
              </li>
              <li>
                • {tr('Time in job', 'Antigüedad')} ≥ {tenureLabel(listing.requirements.minTenureMonths)}
              </li>
              <li>
                • {tr('Guarantee:', 'Garantía:')}{' '}
                {listing.requirements.guarantee === 'poliza' ? tr('lease insurance', 'póliza') : tr('co-signer or lease insurance', 'codeudor o póliza')}
              </li>
              <li>
                • {tr('Credit score', 'Puntaje')} ≥ {listing.requirements.minCreditScore}
              </li>
            </ul>
          </div>
          <a href="#/propietario/flujo" className="block rounded-2xl bg-stone-900 p-5 text-white hover:bg-stone-800">
            <div className="text-sm text-stone-300">{tr('Once you sign the lease', 'Cuando firmes el contrato')}</div>
            <div className="mt-1 font-bold">{tr('EzRent collects the rent and pays your bills automatically →', 'EzRent cobra el arriendo y paga tus facturas automáticamente →')}</div>
            <div className="mt-2 text-sm text-amber-300">{tr('See cash flow', 'Ver flujo de caja')}</div>
          </a>
        </aside>
      </div>
    </div>
  )
}

function Mini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-stone-200 px-3 py-2">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="truncate font-bold">{value}</div>
      <div className="truncate text-xs text-stone-500">{sub}</div>
    </div>
  )
}
