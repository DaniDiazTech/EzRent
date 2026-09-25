import { useEffect, useState } from 'react'
import { Avatar, Button, Check, Photo } from '../components/ui'
import { applicants, listings } from '../data/seed'
import { contractLabels, evaluate } from '../lib/evaluate'
import { formatCOP, tenureLabel } from '../lib/format'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import type { DocType } from '../types'

const DOCS: { type: DocType; label: string; hint: string; multiple?: boolean }[] = [
  { type: 'cedula', label: 'Cédula de ciudadanía', hint: 'Ambas caras, foto o PDF' },
  { type: 'certificado', label: 'Certificado laboral', hint: 'Expedido hace menos de 30 días' },
  { type: 'nomina', label: 'Desprendibles de nómina', hint: 'Últimos 3 meses', multiple: true },
  { type: 'extractos', label: 'Extractos bancarios', hint: 'Últimos 3 meses', multiple: true },
]

const REVIEW_STEPS = ['Leyendo documentos', 'Verificando ingresos', 'Comparando con requisitos']
const STEP_MS = 1150

type Step = 'consent' | 'upload' | 'review' | 'result'

export function Apply({ id }: { id: string }) {
  const s = useStore()
  const listing = listings.find((l) => l.id === id)
  const me = applicants.find((a) => a.id === s.applicantId)!
  const hasConsent = !!s.consent[me.id]
  const savedDocs = s.documents[me.id] ?? {}
  const [step, setStep] = useState<Step>(hasConsent ? 'upload' : 'consent')
  const [consentChecked, setConsentChecked] = useState(hasConsent)
  const [docs, setDocs] = useState<Partial<Record<DocType, string>>>(savedDocs)
  const [reviewIdx, setReviewIdx] = useState(0)

  // Si cambia la persona demo, reiniciamos el flujo.
  useEffect(() => {
    setStep(s.consent[me.id] ? 'upload' : 'consent')
    setConsentChecked(!!s.consent[me.id])
    setDocs(s.documents[me.id] ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id])

  useEffect(() => {
    if (step !== 'review') return
    setReviewIdx(0)
    const timers = REVIEW_STEPS.map((_, i) => setTimeout(() => setReviewIdx(i + 1), STEP_MS * (i + 1)))
    const done = setTimeout(() => {
      s.markVerified()
      setStep('result')
    }, STEP_MS * REVIEW_STEPS.length + 350)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (!listing) return <div className="p-10 text-center">Inmueble no encontrado.</div>

  const allDocs = DOCS.every((d) => docs[d.type])
  const ev = evaluate(me, listing)
  const existing = s.applications.find((a) => a.listingId === listing.id && a.applicantId === me.id)
  const reused = DOCS.every((d) => savedDocs[d.type])

  const fillSample = () => {
    const slug = me.name.split(' ').slice(0, 2).join('_').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    setDocs({
      cedula: `cedula_${slug}.jpg`,
      certificado: `certificado_laboral_${slug}.pdf`,
      nomina: 'desprendibles_jul_ago_sep_2026.pdf (3)',
      extractos: 'extractos_bancarios_jul_ago_sep_2026.pdf (3)',
    })
  }

  const startReview = () => {
    s.setDocuments(docs)
    setStep('review')
  }

  const doApply = () => {
    s.apply(listing.id)
    navigate(`/aplicaciones?nueva=${listing.id}`)
  }

  const stepNo = { consent: 1, upload: 2, review: 3, result: 3 }[step]

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6">
      <a href={`#/inmueble/${listing.id}`} className="text-sm font-semibold text-stone-600 hover:text-stone-900">
        ← Volver al inmueble
      </a>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-stone-200 p-3">
        <Photo src={listing.photos[0]} alt={listing.title} className="h-16 w-20 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <div className="truncate font-bold">{listing.title}</div>
          <div className="text-sm text-stone-600">
            {listing.barrio} · {formatCOP(listing.canon)} / mes
          </div>
        </div>
      </div>

      <ol className="mt-6 flex items-center gap-2 text-xs font-semibold text-stone-500">
        {['Autorización', 'Documentos', 'Revisión IA'].map((l, i) => (
          <li key={l} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${i + 1 <= stepNo ? 'bg-teal-700 text-white' : 'bg-stone-200'}`}>{i + 1}</span>
            <span className={i + 1 === stepNo ? 'text-stone-900' : ''}>{l}</span>
            {i < 2 && <span className="mx-1 h-px w-6 bg-stone-300 sm:w-10" />}
          </li>
        ))}
      </ol>

      {step === 'consent' && (
        <section className="mt-6 animate-fade-up">
          <h1 className="text-2xl font-extrabold">Autorización de tratamiento de datos</h1>
          <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl bg-stone-50 p-5 text-sm leading-relaxed text-stone-700">
            <p>
              En cumplimiento de la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013 (habeas data), EzRent S.A.S. solicita tu autorización previa, expresa e
              informada para recolectar y tratar los datos personales contenidos en tu cédula, certificado laboral, desprendibles de nómina y extractos bancarios.
            </p>
            <p className="mt-3">
              <strong>Finalidad:</strong> verificar tu identidad y capacidad de pago, compararla con los requisitos de los propietarios a los que decidas aplicar y
              consultar tu historial en centrales de riesgo. Solo compartiremos con el propietario un resumen de cumplimiento, nunca tus documentos completos sin tu permiso.
            </p>
            <p className="mt-3">
              <strong>Tus derechos:</strong> conocer, actualizar, rectificar y suprimir tus datos, y revocar esta autorización en cualquier momento escribiendo a
              datos@ezrent.co. Los datos sensibles son de entrega facultativa.
            </p>
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4">
            <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-0.5 h-5 w-5 accent-teal-700" />
            <span className="text-sm">
              Autorizo de manera previa, expresa e informada a EzRent el tratamiento de mis datos personales y la consulta en centrales de riesgo para las finalidades descritas.
            </span>
          </label>
          <Button
            className="mt-5 w-full py-3 sm:w-auto"
            disabled={!consentChecked}
            onClick={() => {
              s.giveConsent()
              setStep('upload')
            }}
          >
            Continuar
          </Button>
        </section>
      )}

      {step === 'upload' && (
        <section className="mt-6 animate-fade-up">
          <h1 className="text-2xl font-extrabold">Sube tus documentos</h1>
          <p className="mt-1 text-stone-600">
            {reused ? 'Ya tenemos tus documentos. Los reutilizamos para este inmueble, sin volver a subirlos.' : 'Solo lo haces una vez: sirven para aplicar a cualquier inmueble en EzRent.'}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {DOCS.map((d) => {
              const file = docs[d.type]
              return (
                <label
                  key={d.type}
                  className={`relative flex cursor-pointer flex-col rounded-2xl border-2 border-dashed p-4 transition ${file ? 'border-teal-600 bg-teal-50/50' : 'border-stone-300 hover:border-stone-400'}`}
                >
                  <input
                    type="file"
                    multiple={d.multiple}
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? [])
                      if (files.length) setDocs((prev) => ({ ...prev, [d.type]: files.length > 1 ? `${files[0].name} (+${files.length - 1})` : files[0].name }))
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{d.label}</span>
                    {file ? <Check ok /> : <span className="text-xl text-stone-400">+</span>}
                  </div>
                  <span className="mt-1 truncate text-sm text-stone-500">{file ?? d.hint}</span>
                </label>
              )
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="py-3" disabled={!allDocs} onClick={startReview}>
              Revisar con IA
            </Button>
            {!allDocs && (
              <Button variant="secondary" className="py-3" onClick={fillSample}>
                Usar documentos de ejemplo
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-stone-500">Prototipo: se acepta cualquier archivo. La revisión usa el perfil demo de {me.name}.</p>
        </section>
      )}

      {step === 'review' && (
        <section className="mt-6 animate-fade-up">
          <h1 className="text-2xl font-extrabold">Revisando tus documentos…</h1>
          <p className="mt-1 text-stone-600">Nuestra IA extrae tus datos y los compara con los requisitos del propietario.</p>
          <div className="mt-6 rounded-2xl border border-stone-200 p-5">
            <ul className="space-y-4">
              {REVIEW_STEPS.map((label, i) => {
                const done = reviewIdx > i
                const active = reviewIdx === i
                return (
                  <li key={label} className={`flex items-center gap-3 transition ${!done && !active ? 'opacity-40' : ''}`}>
                    {done ? (
                      <Check ok className="h-6 w-6" />
                    ) : (
                      <span className={`h-6 w-6 rounded-full border-[3px] ${active ? 'animate-spin border-teal-600 border-t-transparent' : 'border-stone-300'}`} />
                    )}
                    <span className="font-semibold">{label}</span>
                    {active && <span className="text-sm text-stone-500">{['cédula, certificado, 3 desprendibles, 3 extractos', 'promedio de nómina y movimientos', `${ev.results.length} requisitos`][i]}</span>}
                  </li>
                )
              })}
            </ul>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-teal-600 transition-all duration-1000 ease-linear" style={{ width: `${Math.min(100, (reviewIdx / REVIEW_STEPS.length) * 100)}%` }} />
            </div>
          </div>
        </section>
      )}

      {step === 'result' && (
        <section className="mt-6 animate-fade-up">
          <div className={`rounded-2xl p-5 ${ev.qualified ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-rose-50 ring-1 ring-rose-200'}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white ${ev.qualified ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                {ev.qualified ? '✓' : '!'}
              </span>
              <div>
                <h1 className="text-2xl font-extrabold">{ev.qualified ? 'Calificas' : 'Aún no calificas'}</h1>
                <p className="text-sm text-stone-700">
                  Cumples {ev.passedCount} de {ev.results.length} requisitos de este propietario.
                </p>
              </div>
            </div>
          </div>

          <h2 className="mt-7 text-lg font-bold">Datos extraídos de tus documentos</h2>
          <div className="mt-3 rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <Avatar initials={me.initials} color={me.color} />
              <div>
                <div className="font-bold">{me.name}</div>
                <div className="text-sm text-stone-500">C.C. {me.cedula} · {me.age} años</div>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <Field label="Ingresos mensuales" value={formatCOP(me.monthlyIncome)} strong />
              <Field label="Empleador" value={me.employer} />
              <Field label="Tipo de contrato" value={contractLabels[me.contract]} />
              <Field label="Cargo" value={me.cargo} />
              <Field label="Antigüedad" value={tenureLabel(me.tenureMonths)} />
              <Field label="Saldo promedio (extractos)" value={formatCOP(me.avgBankBalance)} />
              <Field label="Puntaje crediticio" value={String(me.creditScore)} />
              <Field label="Garantía" value={me.poliza ? 'Póliza preaprobada' : me.codeudor ? 'Codeudor' : 'Ninguna'} />
              <Field label="Fuente" value={me.contract === 'independiente' || me.contract === 'prestacion_servicios' ? 'Extractos y cuentas de cobro' : '3 desprendibles · 3 extractos'} />
            </dl>
          </div>

          <h2 className="mt-7 text-lg font-bold">Resultado por requisito</h2>
          <ul className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200">
            {ev.results.map((r) => (
              <li key={r.key} className="flex gap-3 p-4">
                <Check ok={r.passed} />
                <div>
                  <div className="font-semibold">
                    {r.label} <span className={`ml-1 text-xs font-bold ${r.passed ? 'text-emerald-700' : 'text-rose-700'}`}>{r.passed ? 'Cumple' : 'No cumple'}</span>
                  </div>
                  <div className="text-sm text-stone-600">{r.explanation}</div>
                </div>
              </li>
            ))}
          </ul>

          {ev.qualified ? (
            <div className="mt-7 rounded-2xl bg-stone-900 p-5 text-white">
              <p className="font-bold">Tu perfil llega al propietario como aplicante preaprobado.</p>
              <p className="mt-1 text-sm text-stone-300">Recibirá un resumen de cumplimiento; tus documentos completos solo se comparten si aceptas la visita.</p>
              {existing ? (
                <Button className="mt-4 w-full bg-white !text-stone-900 hover:bg-stone-100 sm:w-auto" onClick={() => navigate('/aplicaciones')}>
                  Ya aplicaste · Ver estado
                </Button>
              ) : (
                <Button className="mt-4 w-full bg-amber-400 py-3 !text-stone-900 hover:bg-amber-300 sm:w-auto" onClick={doApply}>
                  Aplicar a este inmueble
                </Button>
              )}
            </div>
          ) : (
            <Missing />
          )}
        </section>
      )}
    </div>
  )

  function Missing() {
    const failed = ev.results.filter((r) => !r.passed)
    const alternatives = listings.filter((l) => l.id !== listing!.id && evaluate(me, l).qualified).slice(0, 3)
    return (
      <div className="mt-7">
        <h2 className="text-lg font-bold">Lo que te falta</h2>
        <ul className="mt-3 space-y-3">
          {failed.map((r) => (
            <li key={r.key} className="rounded-2xl bg-amber-50 p-4 text-sm ring-1 ring-amber-200">
              <div className="font-bold text-amber-900">{r.label}</div>
              <div className="mt-1 text-amber-900/80">{r.fix}</div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-stone-600">Te ahorraste una visita: con este perfil el propietario no aprobaría el contrato.</p>
        {alternatives.length > 0 && (
          <>
            <h3 className="mt-6 font-bold">Inmuebles donde sí calificas</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {alternatives.map((l) => (
                <a key={l.id} href={`#/inmueble/${l.id}`} className="overflow-hidden rounded-2xl border border-stone-200 hover:shadow-md">
                  <Photo src={l.photos[0]} alt={l.title} className="h-24 w-full" />
                  <div className="p-3 text-sm">
                    <div className="font-bold">{l.barrio}</div>
                    <div className="text-stone-600">{formatCOP(l.canon)} / mes</div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className={strong ? 'font-extrabold text-teal-800' : 'font-semibold'}>{value}</dd>
    </div>
  )
}
