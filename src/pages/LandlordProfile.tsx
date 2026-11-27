import { ListingCard } from '../components/ListingCard'
import { Avatar, Spec } from '../components/ui'
import { landlords, listings } from '../data/seed'
import { tr } from '../lib/i18n'
import { useStore } from '../lib/store'

export function LandlordProfile({ id }: { id: string }) {
  const s = useStore()
  const owner = landlords.find((landlord) => landlord.id === id)
  const properties = listings.filter((listing) => listing.landlordId === id)
  const units = properties.reduce((total, listing) => total + (listing.availableUnits ?? 1), 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-teal-800">
        <a className="underline underline-offset-4" href="#/">{tr('Explore rentals', 'Explorar arriendos')}</a>
        <a className="underline underline-offset-4" href="#/aplicaciones">{tr('My applications', 'Mis aplicaciones')}</a>
        {s.landlordId === id && (
          <a className="underline underline-offset-4" href="#/propietario">{tr('Landlord dashboard', 'Panel del propietario')}</a>
        )}
      </div>
      {owner ? (
        <>
          <section className="mt-5 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 sm:p-8">
            <div className="flex items-start gap-4">
              <Avatar initials={owner.initials} color="#115e59" size={56} />
              <div>
                <p className="text-sm font-semibold text-teal-800">
                  {owner.operatorName ? tr('Building operator', 'Operadora de edificios') : tr('Landlord', 'Arrendador')}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{owner.operatorName ?? owner.name}</h1>
                {owner.operatorName && <p className="mt-1 text-sm text-stone-600">{owner.name}</p>}
                <p className="mt-2 max-w-2xl text-sm text-stone-700">
                  {tr(owner.bioEn, owner.bio) || tr('Manages residential rentals in Bogotá through EzRent.', 'Administra arriendos residenciales en Bogotá a través de EzRent.')}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Spec label={tr('Listings', 'Inmuebles publicados')} value={properties.length} />
              <Spec label={tr('Available apartments', 'Apartamentos disponibles')} value={units} />
              <Spec label={tr('On EzRent since', 'En EzRent desde')} value={owner.since} />
            </div>
          </section>
          <h2 className="mt-8 text-xl font-extrabold">{tr('Available rentals', 'Arriendos disponibles')}</h2>
          <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${properties.length > 2 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'max-w-4xl'}`}>
            {properties.map((listing) => (
              <div className="rental-result" key={listing.id}><ListingCard listing={listing} /></div>
            ))}
          </div>
        </>
      ) : <h1 className="mt-5 text-2xl font-extrabold">{tr('Landlord profile unavailable', 'Perfil del arrendador no disponible')}</h1>}
    </div>
  )
}
