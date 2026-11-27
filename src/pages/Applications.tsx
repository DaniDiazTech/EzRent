import { Avatar, Button, Photo, StatusPill } from '../components/ui'
import { applicants, landlords } from '../data/seed'
import { formatCOP, formatRelative } from '../lib/format'
import { tr } from '../lib/i18n'
import { matchPriority, rentalMatches } from '../lib/matches'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'

const statusCopy = {
  en_revision: ['Your application is being reviewed.', 'Tu aplicación está en revisión.'],
  preaprobado: ['The landlord can review your pre-approved profile. You’ll be able to sign when they accept.', 'El arrendador puede revisar tu perfil preaprobado. Podrás firmar cuando te acepte.'],
  aceptado: ['The landlord accepted your application. Review the lease and sign when you’re ready.', 'El arrendador aceptó tu aplicación. Revisa el contrato y firma cuando estés listo.'],
  firmado: ['Your rental agreement was signed.', 'Firmaste el contrato de arrendamiento.'],
  rechazado: ['The landlord did not move forward with your application.', 'El arrendador no continuó con tu aplicación.'],
} as const

export function Applications({ highlight }: { highlight?: string }) {
  const s = useStore()
  const me = applicants.find((applicant) => applicant.id === s.applicantId)!
  const verified = s.verified.includes(me.id)
  const matches = rentalMatches(me, s.applications)
  const mine = matches.flatMap(({ listing, application }) => application ? [{ listing, application }] : [])
    .sort((a, b) => Number(b.application.status === 'aceptado') - Number(a.application.status === 'aceptado')
      || b.application.createdAt.localeCompare(a.application.createdAt))
  const ready = mine.filter(({ application }) => application.status === 'aceptado')
  const recommendations = matches.filter((match) => matchPriority(match, verified) >= 2).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{tr('My applications', 'Mis aplicaciones')}</h1>
      <p className="mt-1 text-stone-600">
        {tr(`Hi, ${me.name.split(' ')[0]}. Track your applications and pick up where you left off.`, `Hola, ${me.name.split(' ')[0]}. Consulta tus aplicaciones y retoma el proceso donde lo dejaste.`)}
      </p>

      <div className="mt-5 grid gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 sm:grid-cols-3 sm:p-5">
        <div>
          <p className="text-xl font-extrabold text-teal-900">{ready.length}</p>
          <p className="text-sm font-semibold text-teal-800">{tr('Ready to sign', 'Listos para firmar')}</p>
        </div>
        <div>
          <p className="text-xl font-extrabold text-teal-900">{mine.length}</p>
          <p className="text-sm font-semibold text-teal-800">{tr('Applications', 'Aplicaciones')}</p>
        </div>
        <div>
          <a href={verified ? '#/?coincidencias=1' : '#/'} className="text-sm font-bold text-teal-800 underline underline-offset-4">
            {verified ? tr(`See matches (${recommendations})`, `Ver coincidencias (${recommendations})`) : tr('Explore rentals', 'Explorar arriendos')}
          </a>
        </div>
      </div>

      {highlight && mine.some(({ listing }) => listing.id === highlight) && (
        <p role="status" className="mt-5 rounded-xl bg-emerald-600 p-4 font-bold text-white">{tr('Application sent!', '¡Aplicación enviada!')}</p>
      )}

      {mine.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-8 text-center">
          <p className="text-stone-600">{tr('You haven’t applied to any place yet.', 'Aún no has aplicado a ningún inmueble.')}</p>
          <Button className="mt-4" onClick={() => navigate('/')} >{tr('Explore places', 'Explorar inmuebles')}</Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {mine.map(({ application, listing }) => {
            const owner = landlords.find((landlord) => landlord.id === listing.landlordId)
            const readyToSign = application.status === 'aceptado'
            const note = application.status === 'en_revision' || application.status === 'rechazado' ? tr(application.noteEn, application.note) : undefined
            const [statusEn, statusEs] = statusCopy[application.status]
            return (
              <li key={application.id} className={`grid gap-4 rounded-2xl border p-4 sm:grid-cols-[10rem_minmax(0,1fr)] ${readyToSign || listing.id === highlight ? 'border-teal-400 bg-teal-50/30' : 'border-stone-200'}`}>
                <a href={`#/inmueble/${listing.id}`}>
                  <Photo src={listing.photos[0]} alt={tr(listing.titleEn, listing.title)} className="h-40 w-full rounded-xl sm:h-32" />
                </a>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`#/inmueble/${listing.id}`} className="font-extrabold hover:underline">{listing.buildingName ?? tr(listing.titleEn, listing.title)}</a>
                    <StatusPill status={application.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {tr(
                      `${listing.barrio} · ${formatCOP(listing.canon + listing.administracion)} / month with fees · Applied ${formatRelative(application.createdAt)}`,
                      `${listing.barrio} · ${formatCOP(listing.canon + listing.administracion)} / mes con administración · Aplicaste ${formatRelative(application.createdAt)}`,
                    )}
                  </p>
                  <p className="mt-2 text-sm text-stone-700">{note ?? tr(statusEn, statusEs)}</p>
                  {(readyToSign || application.status === 'firmado') && (
                    <Button className="mt-3" onClick={() => navigate(`/contrato/${application.id}`)}>
                      {readyToSign ? tr('Review and sign lease', 'Revisar y firmar contrato') : tr('View signed lease', 'Ver contrato firmado')}
                    </Button>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-200 pt-3 text-sm font-semibold text-teal-800">
                    {owner && <a href={`#/arrendador/${owner.id}`} className="inline-flex items-center gap-2 hover:underline">
                      <Avatar initials={owner.initials} color="#115e59" size={26} />
                      <span>{owner.operatorName ?? owner.name}</span>
                      <span className="font-normal underline underline-offset-2">{tr('View profile', 'Ver perfil')}</span>
                    </a>}
                    <a href={`#/inmueble/${listing.id}?vista=recorrido`} className="underline underline-offset-4">{tr('See 3D tour', 'Ver recorrido 3D')}</a>
                    {verified && <a href={`#/aplicar/${listing.id}`} className="underline underline-offset-4">{tr('See what we used', 'Ver qué datos usamos')}</a>}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
