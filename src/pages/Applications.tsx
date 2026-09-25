import { Button, Photo, StatusPill } from '../components/ui'
import { applicants, listings } from '../data/seed'
import { evaluate } from '../lib/evaluate'
import { formatCOP, formatRelative } from '../lib/format'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'

const statusCopy = {
  en_revision: 'Estamos validando tus documentos con el empleador. Te avisamos en menos de 24 h.',
  preaprobado: 'Cumples todos los requisitos. El propietario ya ve tu perfil preaprobado y te responderá pronto.',
  aceptado: '¡El propietario aceptó tu aplicación! Agenda la visita y firma el contrato digital.',
  rechazado: 'El propietario no continuó con tu aplicación.',
}

export function Applications({ highlight }: { highlight?: string }) {
  const s = useStore()
  const me = applicants.find((a) => a.id === s.applicantId)!
  const mine = s.applications.filter((a) => a.applicantId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Mis aplicaciones</h1>
      <p className="mt-1 text-stone-600">Hola, {me.name.split(' ')[0]}. Aquí ves el estado de cada inmueble al que aplicaste.</p>

      {highlight && mine.some((a) => a.listingId === highlight) && (
        <div className="mt-5 animate-fade-up rounded-2xl bg-emerald-600 p-4 text-white shadow-lg">
          <div className="font-bold">¡Aplicación enviada!</div>
          <div className="text-sm text-emerald-50">
            Ya estás de primero en la lista del propietario como aplicante preaprobado. Cambia a <strong>Propietario</strong> arriba para verlo desde el otro lado.
          </div>
        </div>
      )}

      {mine.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <p className="text-stone-600">Aún no has aplicado a ningún inmueble.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Explorar inmuebles
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {mine.map((a) => {
            const l = listings.find((x) => x.id === a.listingId)!
            const ev = evaluate(me, l)
            return (
              <li
                key={a.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${a.listingId === highlight ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-stone-200'}`}
              >
                <a href={`#/inmueble/${l.id}`} className="shrink-0">
                  <Photo src={l.photos[0]} alt={l.title} className="h-32 w-full rounded-xl sm:h-24 sm:w-32" />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`#/inmueble/${l.id}`} className="font-bold hover:underline">
                      {l.barrio} · {l.habitaciones} hab · {l.areaM2} m²
                    </a>
                    <StatusPill status={a.status} />
                  </div>
                  <div className="mt-0.5 text-sm text-stone-600">
                    {formatCOP(l.canon)} / mes · Aplicaste {formatRelative(a.createdAt)} · IA: {ev.passedCount}/{ev.results.length} requisitos
                  </div>
                  <p className="mt-2 text-sm text-stone-700">{a.note ?? statusCopy[a.status]}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
        {(['en_revision', 'preaprobado', 'rechazado'] as const).map((st) => (
          <div key={st} className="rounded-2xl bg-stone-50 p-4">
            <StatusPill status={st} />
            <p className="mt-2 text-stone-600">{statusCopy[st]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
