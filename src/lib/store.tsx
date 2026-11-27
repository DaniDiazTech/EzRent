import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applicants, DEMO_APPLICANT_ID, listings, seedApplications } from '../data/seed'
import type { Application, ApplicationStatus, DocType, LeaseSignature, LeaseTerms, Role } from '../types'
import { evaluate } from './evaluate'
import { DEFAULT_LANG, setLang as setActiveLang, type Lang } from './i18n'

const STORAGE_KEY = 'ezrent:v1'

export interface AppState {
  lang: Lang
  role: Role
  applicantId: string
  landlordId: string
  applications: Application[]
  /** Documentos cargados por persona: nombre del archivo por tipo. */
  documents: Record<string, Partial<Record<DocType, string>>>
  /** Personas cuya documentación ya fue revisada por nuestro agente. */
  verified: string[]
  consent: Record<string, string>
}

const initialState = (): AppState => ({
  lang: DEFAULT_LANG,
  role: 'arrendatario',
  applicantId: DEMO_APPLICANT_ID,
  landlordId: 'l1',
  applications: seedApplications,
  documents: {},
  verified: ['a6'],
  consent: {},
})

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved: AppState = { ...initialState(), ...JSON.parse(raw) }
      const ids = new Set(saved.applications.map((app) => app.id))
      const pairs = new Set(saved.applications.map((app) => `${app.applicantId}/${app.listingId}`))
      const missing = seedApplications.filter((app) => !ids.has(app.id) && !pairs.has(`${app.applicantId}/${app.listingId}`))
      return {
        ...saved,
        verified: [...new Set([...saved.verified, ...initialState().verified])],
        applications: [...saved.applications, ...missing].map((application) => {
          const seed = seedApplications.find((app) => app.id === application.id)
          if (seed && (seed.status === 'en_revision' || seed.status === 'rechazado') && application.status === 'preaprobado') {
            return { ...application, status: seed.status }
          }
          return application
        }),
      }
    }
  } catch {
    /* almacenamiento no disponible: arrancamos con la semilla */
  }
  return initialState()
}

interface Store extends AppState {
  setLang: (l: Lang) => void
  setRole: (r: Role) => void
  setApplicant: (id: string) => void
  setLandlord: (id: string) => void
  giveConsent: () => void
  setDocuments: (docs: Partial<Record<DocType, string>>) => void
  markVerified: () => void
  apply: (listingId: string) => boolean
  signLease: (applicationId: string, terms: LeaseTerms, signature: LeaseSignature) => void
  setStatus: (applicationId: string, status: ApplicationStatus) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  // Module-level language used by tr() and the formatters; set before children render.
  setActiveLang(state.lang)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignorar */
    }
  }, [state])

  const setLang = useCallback((lang: Lang) => setState((s) => ({ ...s, lang })), [])
  const setRole = useCallback((role: Role) => setState((s) => ({ ...s, role })), [])
  const setApplicant = useCallback((applicantId: string) => setState((s) => ({ ...s, applicantId })), [])
  const setLandlord = useCallback((landlordId: string) => setState((s) => ({ ...s, landlordId })), [])
  const giveConsent = useCallback(
    () => setState((s) => ({ ...s, consent: { ...s.consent, [s.applicantId]: new Date().toISOString() } })),
    [],
  )
  const setDocuments = useCallback(
    (docs: Partial<Record<DocType, string>>) =>
      setState((s) => ({ ...s, documents: { ...s.documents, [s.applicantId]: docs } })),
    [],
  )
  const markVerified = useCallback(
    () => setState((s) => (s.verified.includes(s.applicantId) ? s : { ...s, verified: [...s.verified, s.applicantId] })),
    [],
  )
  const apply = useCallback((listingId: string) => {
    const listing = listings.find((item) => item.id === listingId)
    const applicant = applicants.find((item) => item.id === state.applicantId)
    if (!listing || !applicant || !state.verified.includes(applicant.id) || !evaluate(applicant, listing).qualified) return false
    const existing = (app: Application) => app.listingId === listingId && app.applicantId === applicant.id
    if (state.applications.some(existing)) return false
    const app: Application = {
      id: `app-${crypto.randomUUID()}`,
      listingId,
      applicantId: applicant.id,
      status: 'preaprobado',
      createdAt: new Date().toISOString(),
    }
    setState((s) => s.applications.some(existing) ? s : { ...s, applications: [app, ...s.applications] })
    return true
  }, [state.applicantId, state.applications, state.verified])
  const setStatus = useCallback(
    (id: string, status: ApplicationStatus) =>
      setState((s) => ({
        ...s,
        applications: s.applications.map((app) => app.id === id && app.status !== 'firmado' ? { ...app, status } : app),
      })),
    [],
  )
  const signLease = useCallback((id: string, terms: LeaseTerms, signature: LeaseSignature) => {
    const capturedAt = new Date().toISOString()
    setState((s) => ({
      ...s,
      applications: s.applications.map((app) =>
        app.id === id && app.applicantId === s.applicantId && !app.signedLease &&
        (app.status === 'aceptado' || app.status === 'firmado')
          ? { ...app, status: 'firmado', signedAt: app.signedAt ?? capturedAt, signedLease: { terms, signature, capturedAt } }
          : app,
      ),
    }))
  }, [])
  // Reiniciar la demo conserva el idioma elegido. / Resetting the demo keeps the chosen language.
  const reset = useCallback(() => setState((s) => ({ ...initialState(), lang: s.lang })), [])

  const value = useMemo<Store>(
    () => ({ ...state, setLang, setRole, setApplicant, setLandlord, giveConsent, setDocuments, markVerified, apply, signLease, setStatus, reset }),
    [state, setLang, setRole, setApplicant, setLandlord, giveConsent, setDocuments, markVerified, apply, signLease, setStatus, reset],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider / useStore debe usarse dentro de StoreProvider')
  return s
}
