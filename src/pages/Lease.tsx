import { useEffect, useMemo, useState } from 'react'
import { AgreementPdfPreview } from '../components/AgreementPdfPreview'
import { SignaturePad } from '../components/SignaturePad'
import { Button, StatusPill } from '../components/ui'
import { applicants, landlords, listings } from '../data/seed'
import { formatCOP } from '../lib/format'
import { tr } from '../lib/i18n'
import { agreementDate, agreementTitle, createLeasePdf } from '../lib/leasePdf'
import { useStore } from '../lib/store'
import type { Application, LeaseSignature, LeaseTerms, SignedLease } from '../types'

export default function Lease({ id }: { id: string }) {
  const s = useStore()
  const application = s.applications.find((item) => item.id === id && item.applicantId === s.applicantId)
  const listing = listings.find((item) => item.id === application?.listingId)
  const tenant = applicants.find((applicant) => applicant.id === s.applicantId)
  const landlord = landlords.find((owner) => owner.id === listing?.landlordId)

  const terms = useMemo<LeaseTerms | undefined>(() => {
    if (application?.signedLease) return application.signedLease.terms
    if (!listing || !tenant || !landlord) return
    return {
      property: s.lang === 'es' ? listing.title : listing.titleEn,
      neighborhood: listing.barrio,
      tenant: tenant.name,
      landlord: landlord.operatorName ?? landlord.name,
      rent: listing.canon,
      fee: listing.administracion,
      availableFrom: listing.disponibleDesde,
      language: s.lang,
    }
  }, [application?.signedLease, landlord, listing, s.lang, tenant])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <a href="#/aplicaciones" className="text-sm font-bold text-teal-800 underline underline-offset-4">
        {tr('Back to my applications', 'Volver a mis aplicaciones')}
      </a>
      {application && listing && terms && (application.status === 'aceptado' || application.status === 'firmado') ? (
        <Agreement key={application.id} application={application} terms={terms} listingId={listing.id} />
      ) : (
        <h1 className="mt-4 text-2xl font-extrabold">{tr('Lease unavailable', 'Contrato no disponible')}</h1>
      )}
    </div>
  )
}

function Agreement({ application, terms, listingId }: { application: Application; terms: LeaseTerms; listingId: string }) {
  const s = useStore()
  const [mode, setMode] = useState<'drawn' | 'typed'>('drawn')
  const [drawn, setDrawn] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [pdf, setPdf] = useState<{ terms: LeaseTerms; url: string; signedLease?: SignedLease }>()
  const [pdfError, setPdfError] = useState(false)
  const recorded = application.signedLease
  const signedAt = application.signedAt
  const filename = `${tr('rental-agreement', 'contrato-de-arrendamiento')}-${listingId}.pdf`
  const pdfUrl = pdf?.terms === terms && pdf.signedLease === recorded ? pdf.url : undefined
  const signature: LeaseSignature | null = mode === 'typed'
    ? { kind: 'typed', name: terms.tenant }
    : drawn ? { kind: 'drawn', png: drawn } : null

  useEffect(() => {
    let cancelled = false
    let url: string | undefined
    setPdfError(false)
    createLeasePdf(terms, signedAt, recorded).then((bytes) => {
      if (cancelled) return
      url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }))
      setPdf({ terms, url, signedLease: recorded })
    }).catch(() => { if (!cancelled) setPdfError(true) })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [terms, signedAt, recorded])

  return (
    <>
      <header className="mt-4 flex flex-wrap items-start justify-between gap-3 sm:mt-5">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{agreementTitle(s.lang)}</h1>
            <StatusPill status={application.status} />
          </div>
          <a href={`#/inmueble/${listingId}`} className="mt-1 block text-sm font-semibold text-teal-800 underline underline-offset-4">
            {terms.property}
          </a>
        </div>
        {pdfUrl && <div className="flex flex-wrap gap-2 text-sm font-bold text-teal-800">
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-stone-200 px-3 py-2 hover:bg-stone-50">{tr('Open PDF', 'Abrir PDF')}</a>
          <a href={pdfUrl} download={filename} className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 hover:bg-teal-100">{tr('Download PDF', 'Descargar PDF')}</a>
        </div>}
      </header>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
        {pdfUrl ? <AgreementPdfPreview key={pdfUrl} url={pdfUrl} title={agreementTitle(terms.language)} /> : (
          <p role="status" className="rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-700">
            {pdfError ? tr('The PDF could not be generated. Reload the page to try again.', 'No se pudo generar el PDF. Recarga la página para volver a intentarlo.') : tr('Preparing PDF…', 'Preparando PDF…')}
          </p>
        )}

        <aside className="space-y-4 lg:sticky lg:top-20">
          <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <h2 className="font-extrabold">{tr('Agreement details', 'Detalles del contrato')}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              {[
                [tr('Tenant', 'Arrendatario'), terms.tenant],
                [tr('Landlord or operator', 'Arrendador u operador'), terms.landlord],
                [tr('Monthly rent', 'Canon mensual'), formatCOP(terms.rent)],
                [tr('HOA fee', 'Administración'), formatCOP(terms.fee)],
                [tr('Monthly total', 'Total mensual'), formatCOP(terms.rent + terms.fee)],
                [tr('Available from', 'Disponible desde'), agreementDate(terms.availableFrom, s.lang)],
              ].map(([label, value]) => <div key={label}><dt className="text-xs text-stone-600">{label}</dt><dd className="mt-0.5 font-bold">{value}</dd></div>)}
            </dl>
          </section>

          {recorded ? (
            <section className="rounded-2xl border border-teal-100 bg-teal-50 p-4 sm:p-5">
              <h2 className="font-extrabold text-teal-950">{tr('Tenant signature', 'Firma del arrendatario')}</h2>
              <div className="mt-3 flex min-h-20 items-center rounded-xl bg-white p-3 ring-1 ring-teal-100">
                {recorded.signature.kind === 'drawn'
                  ? <img src={recorded.signature.png} alt={tr('Handwritten tenant signature', 'Firma manuscrita del arrendatario')} className="max-h-20 max-w-full object-contain" />
                  : <span className="font-serif text-2xl italic text-teal-900">{recorded.signature.name}</span>}
              </div>
              <p role="status" className="mt-3 text-sm font-semibold text-teal-900">
                {tr(`Signed on ${agreementDate(signedAt ?? recorded.capturedAt, s.lang)}`, `Firmado el ${agreementDate(signedAt ?? recorded.capturedAt, s.lang)}`)}
              </p>
            </section>
          ) : (
            <form className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5" onSubmit={(event) => {
              event.preventDefault()
              if (signature && confirmed && pdfUrl) s.signLease(application.id, terms, signature)
            }}>
              <h2 className="font-extrabold">{tr('Tenant signature', 'Firma del arrendatario')}</h2>
              {application.status === 'firmado' && <p className="mt-1 text-sm text-stone-600">{tr('Add your signature to the PDF. Your original signing date stays on the agreement.', 'Añade tu firma al PDF. Se conserva la fecha original de firma.')}</p>}
              <div className="my-3 inline-flex gap-1 rounded-xl bg-stone-100 p-1 text-sm font-bold" role="group" aria-label={tr('Signature method', 'Método de firma')}>
                {(['drawn', 'typed'] as const).map((method) => <button
                  type="button" key={method} aria-pressed={mode === method} onClick={() => { setMode(method); setConfirmed(false) }}
                  className={`rounded-lg px-3 py-1.5 ${mode === method ? 'bg-white text-teal-900 shadow-sm' : 'text-stone-600'}`}
                >{method === 'drawn' ? tr('Draw', 'Dibujar') : tr('Type', 'Escribir')}</button>)}
              </div>
              <div hidden={mode !== 'drawn'}><SignaturePad onChange={setDrawn} /></div>
              {mode === 'typed' && <div className="rounded-xl border border-stone-300 bg-stone-50 p-4 font-serif text-2xl italic text-teal-900">{terms.tenant}</div>}
              <label className="mt-4 flex items-start gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-teal-700" />
                {tr('I reviewed the agreement and adopt this as my signature.', 'Revisé el contrato y adopto esta firma como mía.')}
              </label>
              <Button type="submit" className="mt-4 w-full" disabled={!signature || !confirmed || !pdfUrl}>
                {application.status === 'firmado' ? tr('Save signature', 'Guardar firma') : tr('Sign agreement', 'Firmar contrato')}
              </Button>
              <p className="mt-2 text-xs text-stone-600">{tr('Saved on this device. Download the PDF to keep a copy.', 'Se guarda en este dispositivo. Descarga el PDF para conservar una copia.')}</p>
            </form>
          )}
        </aside>
      </div>
    </>
  )
}
