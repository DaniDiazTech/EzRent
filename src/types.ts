export type Role = 'arrendatario' | 'propietario'

export type ContractType = 'indefinido' | 'fijo' | 'prestacion_servicios' | 'independiente'

/** Qué tipo de contrato laboral acepta el propietario. */
export type ContractRule = 'indefinido' | 'indefinido_o_fijo' | 'cualquiera'

export type GuaranteeRule = 'codeudor_o_poliza' | 'poliza' | 'ninguna'

export interface Requirements {
  /** Ingresos mínimos como múltiplo del canon mensual. */
  incomeMultiple: number
  contract: ContractRule
  /** Antigüedad laboral mínima en meses. */
  minTenureMonths: number
  guarantee: GuaranteeRule
  /** Puntaje mínimo en centrales de riesgo (simulado). */
  minCreditScore: number
}

export interface Listing {
  id: string
  title: string
  barrio: string
  localidad: string
  estrato: number
  areaM2: number
  habitaciones: number
  banos: number
  parqueaderos: number
  canon: number
  administracion: number
  piso: number
  antiguedadAnos: number
  photos: string[]
  landlordId: string
  description: string
  amenities: string[]
  requirements: Requirements
  disponibleDesde: string
}

export interface Landlord {
  id: string
  name: string
  initials: string
  since: string
  phoneMasked: string
}

export interface Applicant {
  id: string
  name: string
  initials: string
  cedula: string
  age: number
  cargo: string
  employer: string
  contract: ContractType
  tenureMonths: number
  monthlyIncome: number
  avgBankBalance: number
  creditScore: number
  codeudor: string | null
  poliza: string | null
  color: string
}

export type ApplicationStatus = 'en_revision' | 'preaprobado' | 'aceptado' | 'rechazado'

export interface Application {
  id: string
  listingId: string
  applicantId: string
  status: ApplicationStatus
  createdAt: string
  note?: string
}

export type BillType = 'agua' | 'luz' | 'gas' | 'administracion' | 'predial'

export interface Bill {
  type: BillType
  amount: number
}

export interface MonthRecord {
  month: string // YYYY-MM
  rentCollected: number
  bills: Bill[]
}

export interface ManagedProperty {
  id: string
  landlordId: string
  name: string
  barrio: string
  tenantName: string
  canon: number
  history: MonthRecord[]
}

export type DocType = 'cedula' | 'certificado' | 'nomina' | 'extractos'
