import { Component, lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { ListingGallery } from '../components/ListingGallery'
import { RentalMap } from '../components/RentalMap'
import { Badge3D, Button, Check, Spec, StatusPill } from '../components/ui'
import { applicants, landlords, listings } from '../data/seed'
import { describeRequirements, evaluate } from '../lib/evaluate'
import { formatCOP, formatDate } from '../lib/format'
import { tr } from '../lib/i18n'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import type { Listing } from '../types'

const Tour = lazy(() => import('../tour/Tour'))

class TourBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed
      ? <p role="status" className="grid h-full place-items-center bg-stone-100 p-6 text-center text-sm text-stone-700">
        {tr('The 3D tour could not load on this device. The photo gallery is available above.', 'El recorrido 3D no pudo cargarse en este dispositivo. Puedes ver la galería de fotos arriba.')}
      </p>
      : this.props.children
  }
}

export function ListingDetail({ id, showTour }: { id: string; showTour: boolean }) {
  const s = useStore()
  const locationSection = useRef<HTMLElement>(null)
  const tourSection = useRef<HTMLElement>(null)
  const listing = listings.find((l) => l.id === id)

  function openTour() {
    tourSection.current?.scrollIntoView()
    tourSection.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (showTour) openTour()
  }, [showTour])

  if (!listing)
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-stone-600">{tr('We couldn’t find this place.', 'No encontramos este inmueble.')}</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          {tr('See places', 'Ver inmuebles')}
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
        {tr('← Back to places', '← Volver a inmuebles')}
      </a>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{tr(listing.titleEn, listing.title)}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {tr(
          `${listing.barrio} · ${listing.localidad} district · Bogotá D.C. · Estrato ${listing.estrato}`,
          `${listing.barrio} · Localidad de ${listing.localidad} · Bogotá D.C. · Estrato ${listing.estrato}`,
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        <button type="button" onClick={openTour} className="text-sm font-bold text-teal-800 underline underline-offset-4">
          {tr('See 3D tour', 'Ver recorrido 3D')}
        </button>
        <button type="button" className="text-sm font-bold text-teal-800 underline underline-offset-4" onClick={() => {
          locationSection.current?.scrollIntoView()
          locationSection.current?.focus({ preventScroll: true })
        }}>
          {tr('See location on map', 'Ver ubicación en el mapa')}
        </button>
      </div>

      <ListingGallery photos={listing.photos} title={tr(listing.titleEn, listing.title)} />
      {listing.buildingName && <p className="mt-2 text-xs text-stone-500">{tr('Reference photos', 'Fotos de referencia')}</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Recorrido 3D */}
          <section ref={tourSection} id="recorrido" tabIndex={-1} className="scroll-mt-32 outline-none" aria-labelledby="tour-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="tour-title" className="text-xl font-bold">{tr('Tour the apartment in 3D', 'Recorre el apartamento en 3D')}</h2>
              <Badge3D className="ring-1 ring-stone-200" />
            </div>
            <p className="mt-1 text-sm text-stone-600">
              {tr(
                'Explore the reference apartment. Jump between rooms or drag to rotate the model.',
                'Explora el apartamento de referencia. Pasa de un espacio a otro o arrastra para girar el modelo.',
              )}
            </p>
            <div className="mt-4 h-[380px] overflow-hidden rounded-2xl ring-1 ring-stone-200 sm:h-[480px]">
              <TourBoundary>
                <Suspense fallback={<div className="flex h-full items-center justify-center bg-stone-100 text-sm text-stone-500">{tr('Loading 3D tour…', 'Cargando recorrido 3D…')}</div>}>
                  <Tour />
                </Suspense>
              </TourBoundary>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              {tr(
                'Prototype: reference 3D model. In production, every property is scanned by a robot and the verified record doubles as the move-in inventory.',
                'Prototipo: modelo 3D de referencia. En producción, cada inmueble se escanea con robot y el registro verificado sirve de inventario.',
              )}
            </p>
          </section>

          {/* Ficha */}
          <section className="mt-10">
            <h2 className="text-xl font-bold">{tr('Property details', 'Ficha del inmueble')}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Spec label={tr('Monthly rent (canon)', 'Canon mensual')} value={formatCOP(listing.canon)} />
              <Spec label={tr('HOA fee (administración)', 'Administración')} value={formatCOP(listing.administracion)} />
              <Spec label={tr('Area', 'Área')} value={`${listing.areaM2} m²`} />
              <Spec label={tr('Estrato (tier 1–6)', 'Estrato')} value={listing.estrato} />
              <Spec label={tr('Bedrooms', 'Habitaciones')} value={listing.habitaciones} />
              <Spec label={tr('Bathrooms', 'Baños')} value={listing.banos} />
              <Spec label={tr('Parking', 'Parqueadero')} value={listing.parqueaderos ? listing.parqueaderos : 'No'} />
              <Spec label={tr('Floor', 'Piso')} value={listing.piso} />
              <Spec label={tr('Neighborhood', 'Barrio')} value={listing.barrio} />
              <Spec label={tr('Building age', 'Antigüedad')} value={tr(`${listing.antiguedadAnos} years`, `${listing.antiguedadAnos} años`)} />
              <Spec label={tr('Available', 'Disponible')} value={formatDate(listing.disponibleDesde)} />
              {listing.availableUnits && <Spec label={tr('Apartments available', 'Apartamentos disponibles')} value={listing.availableUnits} />}
              <Spec label={tr('Rent per m²', 'Valor m²')} value={formatCOP(Math.round(listing.canon / listing.areaM2))} />
            </div>
            <p className="mt-5 leading-relaxed text-stone-700">{tr(listing.descriptionEn, listing.description)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tr(listing.amenitiesEn, listing.amenities).map((a) => (
                <span key={a} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
                  {a}
                </span>
              ))}
            </div>
          </section>

          <section ref={locationSection} tabIndex={-1} className="mt-10 scroll-mt-32 outline-none" aria-labelledby="listing-location-title">
            <ListingLocation listing={listing} />
          </section>

          {/* Requisitos */}
          <section className="mt-10">
            <h2 className="text-xl font-bold">{tr('Landlord requirements', 'Requisitos del propietario')}</h2>
            <p className="mt-1 text-sm text-stone-600">
              {verified
                ? tr(`Compared with ${me.name.split(' ')[0]}’s verified documents.`, `Comparados con los documentos verificados de ${me.name.split(' ')[0]}.`)
                : tr(
                    'Upload your documents and our agent will reply right away with whether you meet each requirement.',
                    'Sube tus documentos y nuestro agente te responderá de manera inmediata si cumples con cada requisito.',
                  )}
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
                <a href={`#/arrendador/${landlord.id}`} className="font-bold text-teal-800 underline underline-offset-4">
                  {tr(`Listed by ${landlord.operatorName ?? landlord.name}`, `Publicado por ${landlord.operatorName ?? landlord.name}`)}
                </a>
                <div className="text-stone-600">
                  {tr(
                    `Verified EzRent landlord since ${landlord.since} · Rent collection and payments handled by the platform`,
                    `Propietario verificado en EzRent desde ${landlord.since} · Cobro y pagos gestionados por la plataforma`,
                  )}
                </div>
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
              {formatCOP(listing.canon)} <span className="text-sm font-normal text-stone-500">{tr('/ month', '/ mes')}</span>
            </div>
            <div className="text-xs text-stone-500">{tr(`+ HOA fee ${formatCOP(listing.administracion)}`, `+ adm. ${formatCOP(listing.administracion)}`)}</div>
          </div>
          <CTA />
        </div>
      </div>
    </div>
  )

  function CTA({ full }: { full?: boolean }) {
    if (existing?.status === 'aceptado' || existing?.status === 'firmado')
      return (
        <Button className={full ? 'w-full' : ''} onClick={() => navigate(`/contrato/${existing.id}`)}>
          {existing.status === 'firmado' ? tr('View signed lease', 'Ver contrato firmado') : tr('Review lease', 'Revisar contrato')}
        </Button>
      )
    if (existing)
      return (
        <Button variant="secondary" className={full ? 'w-full' : ''} onClick={() => navigate('/aplicaciones')}>
          {tr('View my application', 'Ver mi aplicación')}
        </Button>
      )
    if (verified && !ev.qualified)
      return (
        <Button variant="secondary" className={full ? 'w-full' : ''} onClick={() => navigate(`/aplicar/${listing!.id}`)}>
          {tr('See what I’m missing', 'Ver qué me falta')}
        </Button>
      )
    return (
      <Button className={full ? 'w-full py-3 text-base' : ''} onClick={() => navigate(`/aplicar/${listing!.id}`)}>
        {verified ? tr('Apply now', 'Aplicar ahora') : tr('Check if I qualify', 'Verificar si califico')}
      </Button>
    )
  }

  function SidePanel() {
    return (
      <div>
        <div className="text-2xl font-extrabold">
          {formatCOP(listing!.canon)} <span className="text-base font-normal text-stone-500">{tr('/ month', '/ mes')}</span>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-600">{tr('Rent (canon)', 'Canon')}</dt>
            <dd>{formatCOP(listing!.canon)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-600">{tr('HOA fee (administración)', 'Administración')}</dt>
            <dd>{formatCOP(listing!.administracion)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 font-bold">
            <dt>{tr('Monthly total', 'Total mensual')}</dt>
            <dd>{formatCOP(total)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl bg-stone-50 p-4 text-sm">
          {existing ? (
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{tr('Your application', 'Tu aplicación')}</span>
              <StatusPill status={existing.status} />
            </div>
          ) : verified ? (
            ev.qualified ? (
              <p>
                <span className="font-bold text-emerald-700">{tr('✓ You qualify.', '✓ Calificas.')}</span>{' '}
                {tr(
                  `You meet all ${ev.results.length} of this landlord’s requirements. Apply, and book the visit only if you like the place.`,
                  `Cumples los ${ev.results.length} requisitos de este propietario. Aplica y agenda la visita solo si te convence.`,
                )}
              </p>
            ) : (
              <p>
                <span className="font-bold text-rose-700">{tr('You don’t qualify yet.', 'Aún no calificas.')}</span>{' '}
                {tr(`You meet ${ev.passedCount} of ${ev.results.length} requirements.`, `Cumples ${ev.passedCount} de ${ev.results.length} requisitos.`)}
              </p>
            )
          ) : (
            <p>
              <span className="font-bold">{tr('Apply before you visit.', 'Aplica antes de visitar.')}</span>{' '}
              {tr(
                'Upload your documents once and know in seconds whether you qualify, without wasting time on visits.',
                'Sube tus documentos una vez y sabe en segundos si calificas, sin perder tiempo en visitas.',
              )}
            </p>
          )}
        </div>

        <div className="mt-4">
          <CTA full />
        </div>
        <button type="button" onClick={openTour} className="mt-3 block w-full text-center text-sm font-semibold text-teal-700 underline">
          {tr('See 3D tour', 'Ver recorrido 3D')}
        </button>
        <p className="mt-4 text-center text-xs text-stone-500">
          {tr(
            'Applying is free. Your data is protected under Colombia’s Law 1581 of 2012 (habeas data).',
            'No se te cobrará nada por aplicar. Tus datos están protegidos bajo la Ley 1581 de 2012.',
          )}
        </p>
      </div>
    )
  }
}

function ListingLocation({ listing }: { listing: Listing }) {
  const focus = useMemo(() => [listing.mapLocation], [listing])
  const pins = useMemo(() => [{
    id: listing.id, position: listing.mapLocation, price: listing.barrio,
    title: listing.barrio, active: true, highlighted: false,
  }], [listing])
  const { lat, lng } = listing.mapLocation
  const googleLink = `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`

  return (
    <>
      <h2 id="listing-location-title" className="text-xl font-bold">{tr('Explore the neighborhood', 'Explora el barrio')}</h2>
      <p className="mt-1 text-sm text-stone-600">
        {tr(`Approximate location in ${listing.barrio}, Bogotá.`, `Ubicación aproximada en ${listing.barrio}, Bogotá.`)}
      </p>
      <div className="rental-map-frame mt-4 h-72">
        <RentalMap focus={focus} pins={pins} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-bold text-teal-800">
        <a className="underline underline-offset-4" href={`#/?cerca=${listing.id}`} onClick={() => window.scrollTo(0, 0)}>
          {tr('Search rentals nearby', 'Buscar arriendos cerca')}
        </a>
        <a className="underline underline-offset-4" href={googleLink} target="_blank" rel="noreferrer">
          {tr('Open in Google Maps', 'Abrir en Google Maps')} ↗
        </a>
      </div>
    </>
  )
}
