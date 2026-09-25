import { useEffect } from 'react'
import { Header } from './components/Header'
import { Applications } from './pages/Applications'
import { Apply } from './pages/Apply'
import { CashFlow } from './pages/CashFlow'
import { ListingDetail } from './pages/ListingDetail'
import { Listings } from './pages/Listings'
import { Pipeline } from './pages/Pipeline'
import { match, useRoute } from './lib/router'
import { useStore } from './lib/store'

function query(path: string) {
  return new URLSearchParams(path.split('?')[1] ?? '')
}

export default function App() {
  const path = useRoute()
  const s = useStore()

  // El rol sigue a la sección: si alguien abre un enlace del otro rol, cambiamos el selector.
  useEffect(() => {
    const landlordPage = path.startsWith('/propietario')
    if (landlordPage && s.role !== 'propietario') s.setRole('propietario')
    if (!landlordPage && s.role !== 'arrendatario') s.setRole('arrendatario')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  let page
  let m
  if ((m = match('/inmueble/:id', path))) page = <ListingDetail key={m.id} id={m.id} />
  else if ((m = match('/aplicar/:id', path))) page = <Apply key={m.id} id={m.id} />
  else if (match('/aplicaciones', path)) page = <Applications highlight={query(path).get('nueva') ?? undefined} />
  else if (match('/propietario', path)) page = <Pipeline initialListing={query(path).get('inmueble') ?? undefined} />
  else if (match('/propietario/flujo', path)) page = <CashFlow />
  else page = <Listings />

  return (
    <div className="flex min-h-screen flex-col">
      <Header path={path} />
      <main className="flex-1">{page}</main>
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 EzRent · Prototipo de demostración · Bogotá, Colombia · Datos simulados</span>
          <button
            onClick={() => {
              if (confirm('¿Reiniciar la demo? Se borrarán las aplicaciones y documentos cargados.')) {
                s.reset()
                window.location.hash = '/'
              }
            }}
            className="self-start font-semibold text-stone-600 underline sm:self-auto"
          >
            Reiniciar demo
          </button>
        </div>
      </footer>
    </div>
  )
}
