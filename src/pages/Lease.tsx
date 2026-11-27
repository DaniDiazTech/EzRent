import { useState } from 'react'
import { Button, Spec, StatusPill } from '../components/ui'
import { applicants, landlords, listings } from '../data/seed'
import { formatCOP, formatDate } from '../lib/format'
import { tr } from '../lib/i18n'
import { useStore } from '../lib/store'

export function Lease({ id }: { id: string }) {
  const s = useStore()
  const application = s.applications.find((item) => item.id === id && item.applicantId === s.applicantId)
  const listing = listings.find((item) => item.id === application?.listingId)
  const [confirmed, setConfirmed] = useState(false)
  const tenant = applicants.find((applicant) => applicant.id === s.applicantId)
  const landlord = landlords.find((owner) => owner.id === listing?.landlordId)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <a href="#/aplicaciones" className="text-sm font-bold text-teal-800 underline underline-offset-4">
        {tr('Back to my applications', 'Volver a mis aplicaciones')}
      </a>
      {!application || !listing || !tenant || !landlord || (application.status !== 'aceptado' && application.status !== 'firmado') ? (
        <h1 className="mt-4 text-2xl font-extrabold">{tr('Lease unavailable', 'Contrato no disponible')}</h1>
      ) : (
        <section className="mt-5 rounded-3xl border border-stone-200 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold">{tr('Demo lease', 'Contrato de demostración')}</h1>
            <StatusPill status={application.status} />
          </div>
          <a href={`#/inmueble/${listing.id}`} className="mt-2 block font-semibold text-teal-800 underline underline-offset-4">
            {tr(listing.titleEn, listing.title)}
          </a>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Spec label={tr('Tenant', 'Arrendatario')} value={tenant.name} />
            <Spec label={tr('Landlord or operator', 'Arrendador u operador')} value={landlord.operatorName ?? landlord.name} />
            <Spec label={tr('Monthly rent', 'Canon mensual')} value={formatCOP(listing.canon)} />
            <Spec label={tr('HOA fee', 'Administración')} value={formatCOP(listing.administracion)} />
            <Spec label={tr('Monthly total', 'Total mensual')} value={formatCOP(listing.canon + listing.administracion)} />
            <Spec label={tr('Available from', 'Disponible desde')} value={formatDate(listing.disponibleDesde)} />
          </div>
          {application.status === 'firmado' ? (
            <p role="status" className="mt-5 rounded-xl bg-teal-50 p-4 font-semibold text-teal-800">
              {application.signedAt
                ? tr(`Demo signature recorded on ${formatDate(application.signedAt.slice(0, 10))}.`, `Firma de demostración registrada el ${formatDate(application.signedAt.slice(0, 10))}.`)
                : tr('Demo signature recorded.', 'Firma de demostración registrada.')}
            </p>
          ) : (
            <form className="mt-5" onSubmit={(event) => { event.preventDefault(); if (confirmed) s.signLease(application.id) }}>
              <p className="text-sm text-stone-600">{tr('Your signature is saved in this demo browser only.', 'Tu firma se guarda solo en este navegador de demostración.')}</p>
              <label className="mt-3 flex items-start gap-2 text-sm font-semibold">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-teal-700" />
                {tr('I reviewed the terms and want to sign this demo lease.', 'Revisé las condiciones y quiero firmar este contrato de demostración.')}
              </label>
              <Button type="submit" className="mt-4" disabled={!confirmed}>{tr('Sign demo lease', 'Firmar contrato de demostración')}</Button>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
