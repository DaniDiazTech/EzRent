import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_APPLICANT_ID, seedApplications } from '../data/seed'
import type { Application, ApplicationStatus, DocType, Role } from '../types'
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
  /** Personas cuya documentación ya fue revisada por la IA. */
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
  verified: [],
  consent: {},
})

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
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
  apply: (listingId: string) => Application
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
  const apply = useCallback(
    (listingId: string) => {
      const app: Application = {
        id: `app-${Date.now()}`,
        listingId,
        applicantId: state.applicantId,
        status: 'preaprobado',
        createdAt: new Date().toISOString(),
      }
      setState((s) => ({
        ...s,
        applications: [app, ...s.applications.filter((a) => !(a.listingId === listingId && a.applicantId === app.applicantId))],
      }))
      return app
    },
    [state.applicantId],
  )
  const setStatus = useCallback(
    (id: string, status: ApplicationStatus) =>
      setState((s) => ({ ...s, applications: s.applications.map((a) => (a.id === id ? { ...a, status } : a)) })),
    [],
  )
  // Reiniciar la demo conserva el idioma elegido. / Resetting the demo keeps the chosen language.
  const reset = useCallback(() => setState((s) => ({ ...initialState(), lang: s.lang })), [])

  const value = useMemo<Store>(
    () => ({ ...state, setLang, setRole, setApplicant, setLandlord, giveConsent, setDocuments, markVerified, apply, setStatus, reset }),
    [state, setLang, setRole, setApplicant, setLandlord, giveConsent, setDocuments, markVerified, apply, setStatus, reset],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider / useStore debe usarse dentro de StoreProvider')
  return s
}
