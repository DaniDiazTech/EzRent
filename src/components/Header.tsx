import { applicants, landlords, listings } from '../data/seed'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import type { Role } from '../types'
import { Logo } from './ui'

export function Header({ path }: { path: string }) {
  const s = useStore()

  const switchRole = (role: Role) => {
    if (role === s.role) return
    s.setRole(role)
    if (role === 'propietario') {
      // Abrimos el panel del propietario de la aplicación más reciente del arrendatario actual,
      // para que el aplicante recién preaprobado aparezca de primero en el pipeline.
      const latest = s.applications
        .filter((a) => a.applicantId === s.applicantId && a.status !== 'rechazado')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (latest) {
        const listingLandlord = landlordOfListing(latest.listingId)
        if (listingLandlord) s.setLandlord(listingLandlord)
        navigate(`/propietario?inmueble=${latest.listingId}`)
      } else navigate('/propietario')
    } else navigate('/')
  }

  const tenantLinks = [
    { to: '/', label: 'Explorar' },
    { to: '/aplicaciones', label: 'Mis aplicaciones' },
  ]
  const landlordLinks = [
    { to: '/propietario', label: 'Aplicantes' },
    { to: '/propietario/flujo', label: 'Flujo de caja' },
  ]
  const links = s.role === 'arrendatario' ? tenantLinks : landlordLinks
  const isActive = (to: string) => {
    const base = path.split('?')[0]
    if (to === '/') return base === '/' || base.startsWith('/inmueble') || base.startsWith('/aplicar')
    return base === to
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <a href="#/" onClick={(e) => (e.preventDefault(), switchRole('arrendatario'), navigate('/'))} className="shrink-0">
          <Logo />
        </a>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.to}
              href={`#${l.to}`}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive(l.to) ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-full bg-stone-100 p-1 text-xs font-bold sm:text-sm" role="tablist" aria-label="Cambiar rol">
            {(['arrendatario', 'propietario'] as Role[]).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={s.role === r}
                onClick={() => switchRole(r)}
                className={`rounded-full px-3 py-1.5 transition sm:px-4 ${s.role === r ? 'bg-white text-teal-800 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
              >
                {r === 'arrendatario' ? 'Arrendatario' : 'Propietario'}
              </button>
            ))}
          </div>

          <label className="hidden items-center md:flex">
            <span className="sr-only">{s.role === 'arrendatario' ? 'Persona demo' : 'Propietario demo'}</span>
            {s.role === 'arrendatario' ? (
              <select
                value={s.applicantId}
                onChange={(e) => s.setApplicant(e.target.value)}
                className="max-w-[210px] rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold"
                title="Perfil demo del arrendatario"
              >
                {applicants.map((a) => (
                  <option key={a.id} value={a.id}>
                    👤 {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={s.landlordId}
                onChange={(e) => s.setLandlord(e.target.value)}
                className="max-w-[210px] rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold"
                title="Propietario demo"
              >
                {landlords.map((l) => (
                  <option key={l.id} value={l.id}>
                    🏠 {l.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-stone-100 px-3 py-2 md:hidden">
        {links.map((l) => (
          <a
            key={l.to}
            href={`#${l.to}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${isActive(l.to) ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
          >
            {l.label}
          </a>
        ))}
        <select
          value={s.role === 'arrendatario' ? s.applicantId : s.landlordId}
          onChange={(e) => (s.role === 'arrendatario' ? s.setApplicant(e.target.value) : s.setLandlord(e.target.value))}
          className="ml-auto max-w-[45%] shrink truncate rounded-full border border-stone-200 bg-white px-2 py-1.5 text-xs font-semibold"
          aria-label="Perfil demo"
        >
          {(s.role === 'arrendatario' ? applicants : landlords).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}

function landlordOfListing(id: string) {
  return listings.find((l) => l.id === id)?.landlordId
}
