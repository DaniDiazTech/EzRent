import { lazy, Suspense } from 'react'
import { Badge3D, Button, Check, Photo, Spec, StatusPill } from '../components/ui'
import { applicants, landlords, listings } from '../data/seed'
import { describeRequirements, evaluate } from '../lib/evaluate'
import { formatCOP, formatDate } from '../lib/format'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'

const Tour = lazy(() => import('../tour/Tour'))

export function ListingDetail({ id }: { id: string }) {
  const s = useStore()
  const listing = listings.find((l) => l.id === id)
  if (!listing)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-stone-600">No encontramos este inmueble.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Ver inmuebles
        </Button>
      </div>
    )

  const landlord = landlords.find((l) => l.id === listing.landlordId)!
  const me = applicants.find((a) => a.id === s.applicantId)!
  const verified = s.verified.includes(me.id)
  const ev = evaluate(me, listing)
  const existing = s.applications.find((a) => a.listingId === listing.id && a.applicantId === me.id)
  const reqs = describeRequirements(listing.requirements, listing.canon)
  const total = listing.canon + listing.administracion

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
      <a href="#/" className="text-sm font-semibold text-stone-600 hover:text-stone-900">
        ← Volver a inmuebles
      </a>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{listing.title}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {listing.barrio} · Localidad de {listing.localidad} · Bogotá D.C. · Estrato {listing.estrato}
      </p>

      {/* Galería estilo mosaico */}
      <div className="mt-4 grid h-56 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-80">
        <Photo src={listing.photos[0]} alt={listing.title} className="col-span-4 row-span-2 h-full w-full sm:col-span-2" />
        {listing.photos.slice(1, 4).map((p, i) => (
          <Photo key={i} src={p} alt={`${listing.title} foto ${i + 2}`} className={`hidden h-full w-full sm:block ${i === 2 ? 'col-span-2' : ''}`} />
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Recorrido 3D */}
          <section id="recorrido">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Recorre el apartamento en 3D</h2>
              <Badge3D className="ring-1 ring-stone-200" />
            </div>
            <p className="mt-1 text-sm text-stone-600">
              Modelo escaneado del inmueble. Salta entre ambientes o gira libremente para decidir si vale la pena la visita presencial.
            </p>
            <div className="mt-4 h-[380px] overflow-hidden rounded-2xl ring-1 ring-stone-200 sm:h-[480px]">
              <Suspense fallback={<div className="flex h-full items-center justify-center bg-stone-100 text-sm text-stone-500">Cargando recorrido 3D…</div>}>
                <Tour />
              </Suspense>
            </div>
            <p className="mt-2 text-xs text-stone-500">Prototipo: modelo 3D de referencia. En producción, cada inmueble se escanea con robot y el registro verificado sirve de inventario.</p>
          </section>

          {/* Ficha */}
          <section className="mt-10">
            <h2 className="text-xl font-bold">Ficha del inmueble</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Spec label="Canon mensual" value={formatCOP(listing.canon)} />
              <Spec label="Administración" value={formatCOP(listing.administracion)} />
              <Spec label="Área" value={`${listing.areaM2} m²`} />
              <Spec label="Estrato" value={listing.estrato} />
              <Spec label="Habitaciones" value={listing.habitaciones} />
              <Spec label="Baños" value={listing.banos} />
              <Spec label="Parqueadero" value={listing.parqueaderos ? listing.parqueaderos : 'No'} />
              <Spec label="Piso" value={listing.piso} />
              <Spec label="Barrio" value={listing.barrio} />
              <Spec label="Antigüedad" value={`${listing.antiguedadAnos} años`} />
              <Spec label="Disponible" value={formatDate(listing.disponibleDesde)} />
              <Spec label="Valor m²" value={formatCOP(Math.round(listing.canon / listing.areaM2))} />
            </div>
            <p className="mt-5 leading-relaxed text-stone-700">{listing.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.amenities.map((a) => (
                <span key={a} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
                  {a}
                </span>
              ))}
            </div>
          </section>

          {/* Requisitos */}
          <section className="mt-10">
            <h2 className="text-xl font-bold">Requisitos del propietario</h2>
            <p className="mt-1 text-sm text-stone-600">
              {verified ? `Comparados con los documentos verificados de ${me.name.split(' ')[0]}.` : 'Sube tus documentos y la IA te dirá al instante si cumples cada uno.'}
            </p>
            <ul className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200">
              {reqs.map((r, i) => (
                <li key={r.key} className="flex gap-3 p-4">
                  {verified ? (
                    <Check ok={ev.results[i].passed} />
                  ) : (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-bold text-stone-500">{i + 1}</span>
                  )}
                  <div>
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-sm text-stone-600">{verified ? ev.results[i].explanation : r.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-stone-50 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-800 font-bold text-white">{landlord.initials}</span>
              <div className="text-sm">
                <div className="font-bold">Publicado por {landlord.name}</div>
                <div className="text-stone-600">Propietario verificado en EzRent desde {landlord.since} · Cobro y pagos gestionados por la plataforma</div>
              </div>
            </div>
          </section>
        </div>

        {/* Panel lateral sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-stone-200 p-6 shadow-xl shadow-stone-200/60">
            <SidePanel />
          </div>
        </aside>
      </div>

      {/* Barra inferior móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white p-3 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <div className="font-bold">
              {formatCOP(listing.canon)} <span className="text-sm font-normal text-stone-500">/ mes</span>
            </div>
            <div className="text-xs text-stone-500">+ adm. {formatCOP(listing.administracion)}</div>
          </div>
          <CTA />
        </div>
      </div>
    </div>
  )

  function CTA({ full }: { full?: boolean }) {
    if (existing)
      return (
        <Button variant="secondary" className={full ? 'w-full' : ''} onClick={() => navigate('/aplicaciones')}>
          Ver mi aplicación
        </Button>
      )
    if (verified && !ev.qualified)
      return (
        <Button variant="secondary" className={full ? 'w-full' : ''} onClick={() => navigate(`/aplicar/${listing!.id}`)}>
          Ver qué me falta
        </Button>
      )
    return (
      <Button className={full ? 'w-full py-3 text-base' : ''} onClick={() => navigate(`/aplicar/${listing!.id}`)}>
        {verified ? 'Aplicar ahora' : 'Verificar si califico'}
      </Button>
    )
  }

  function SidePanel() {
    return (
      <div>
        <div className="text-2xl font-extrabold">
          {formatCOP(listing!.canon)} <span className="text-base font-normal text-stone-500">/ mes</span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-600">Canon</dt>
            <dd>{formatCOP(listing!.canon)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-600">Administración</dt>
            <dd>{formatCOP(listing!.administracion)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 font-bold">
            <dt>Total mensual</dt>
            <dd>{formatCOP(total)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm">
          {existing ? (
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">Tu aplicación</span>
              <StatusPill status={existing.status} />
            </div>
          ) : verified ? (
            ev.qualified ? (
              <p>
                <span className="font-bold text-emerald-700">✓ Calificas.</span> Cumples los {ev.results.length} requisitos de este propietario. Aplica y agenda la visita solo si te convence.
              </p>
            ) : (
              <p>
                <span className="font-bold text-rose-700">Aún no calificas.</span> Cumples {ev.passedCount} de {ev.results.length} requisitos.
              </p>
            )
          ) : (
            <p>
              <span className="font-bold">Aplica antes de visitar.</span> Sube tus documentos una vez y sabe en segundos si calificas, sin perder tiempo en visitas.
            </p>
          )}
        </div>

        <div className="mt-4">
          <CTA full />
        </div>
        <a href="#recorrido" className="mt-3 block text-center text-sm font-semibold text-teal-700 underline">
          Ver recorrido 3D
        </a>
        <p className="mt-4 text-center text-xs text-stone-500">No se te cobrará nada por aplicar. Tus datos están protegidos bajo la Ley 1581 de 2012.</p>
      </div>
    )
  }
}
