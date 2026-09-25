import type { Applicant, ContractType, Listing, Requirements } from '../types'
import { formatCOP, formatRatio, tenureLabel } from './format'
import { getLang, tr } from './i18n'

export const contractLabels: Record<ContractType, string> = {
  indefinido: 'Término indefinido',
  fijo: 'Término fijo',
  prestacion_servicios: 'Prestación de servicios',
  independiente: 'Independiente',
}

export const contractLabelsEn: Record<ContractType, string> = {
  indefinido: 'Permanent',
  fijo: 'Fixed term',
  prestacion_servicios: 'Service contract (contractor)',
  independiente: 'Self-employed',
}

export const contractLabel = (c: ContractType) => tr(contractLabelsEn[c], contractLabels[c])

const contractPhrase: Record<ContractType, string> = {
  indefinido: 'con contrato a término indefinido',
  fijo: 'con contrato a término fijo',
  prestacion_servicios: 'por prestación de servicios',
  independiente: 'como independiente',
}

const contractPhraseEn: Record<ContractType, string> = {
  indefinido: 'on a permanent contract',
  fijo: 'on a fixed-term contract',
  prestacion_servicios: 'on a service contract',
  independiente: 'as a self-employed worker',
}

/** Applicant fields in the active language. */
export const cargoOf = (a: Applicant) => tr(a.cargoEn, a.cargo)
export const employerOf = (a: Applicant) => tr(a.employerEn, a.employer)
export const polizaOf = (a: Applicant) => tr(a.polizaEn, a.poliza)
export const codeudorOf = (a: Applicant) => tr(a.codeudorEn, a.codeudor)

export interface RequirementResult {
  key: 'ingresos' | 'contrato' | 'antiguedad' | 'garantia' | 'credito'
  label: string
  passed: boolean
  explanation: string
  fix?: string
}

export interface Evaluation {
  qualified: boolean
  results: RequirementResult[]
  passedCount: number
  incomeRatio: number
}

export function describeRequirements(r: Requirements, canon: number) {
  const mult = formatRatio(r.incomeMultiple)
  return [
    {
      key: 'ingresos',
      label: tr(`Minimum income of ${mult}× the rent`, `Ingresos mínimos de ${mult}× el canon`),
      detail: tr(
        `${formatCOP(canon * r.incomeMultiple)} per month, shown with payslips or bank statements.`,
        `${formatCOP(canon * r.incomeMultiple)} al mes, demostrables con desprendibles o extractos.`,
      ),
    },
    {
      key: 'contrato',
      label:
        r.contract === 'indefinido'
          ? tr('Permanent (indefinite-term) employment contract', 'Contrato a término indefinido')
          : r.contract === 'indefinido_o_fijo'
            ? tr('Permanent or fixed-term employment contract', 'Contrato laboral indefinido o fijo')
            : tr('Any contract type, or self-employed', 'Cualquier tipo de contrato o independiente'),
      detail:
        r.contract === 'cualquiera'
          ? tr('Self-employed and contractors accepted with bank statements.', 'Se aceptan independientes y prestación de servicios con extractos bancarios.')
          : tr('Verified with an employment letter issued within the last 30 days.', 'Validado con certificado laboral de menos de 30 días.'),
    },
    {
      key: 'antiguedad',
      label: tr(`At least ${tenureLabel(r.minTenureMonths)} in current job`, `Antigüedad laboral mínima de ${tenureLabel(r.minTenureMonths)}`),
      detail: tr('In your current job or line of work.', 'En el empleo o actividad actual.'),
    },
    {
      key: 'garantia',
      label:
        r.guarantee === 'poliza'
          ? tr('Lease insurance policy', 'Póliza de arrendamiento')
          : r.guarantee === 'codeudor_o_poliza'
            ? tr('Co-signer or lease insurance policy', 'Codeudor o póliza de arrendamiento')
            : tr('No additional guarantee', 'Sin garantía adicional'),
      detail:
        r.guarantee === 'poliza'
          ? tr('Approved by an insurer (El Libertador, SURA, Bolívar).', 'Aprobada por una aseguradora (El Libertador, SURA, Bolívar).')
          : tr('A co-signer who owns property in Bogotá, or a policy approved by an insurer.', 'Codeudor con finca raíz en Bogotá o póliza aprobada por aseguradora.'),
    },
    {
      key: 'credito',
      label: tr(`No negative credit reports (score ≥ ${r.minCreditScore})`, `Sin reportes negativos (puntaje ≥ ${r.minCreditScore})`),
      detail: tr('Credit bureau check authorized by the applicant.', 'Consulta en centrales de riesgo autorizada por el aplicante.'),
    },
  ]
}

export function evaluate(a: Applicant, l: Listing): Evaluation {
  const r = l.requirements
  const required = l.canon * r.incomeMultiple
  const incomeRatio = a.monthlyIncome / l.canon
  const results: RequirementResult[] = []
  const mult = formatRatio(r.incomeMultiple)

  const incomeOk = a.monthlyIncome >= required
  results.push({
    key: 'ingresos',
    label: tr(`Income ≥ ${mult}× rent`, `Ingresos ≥ ${mult}× canon`),
    passed: incomeOk,
    explanation: incomeOk
      ? tr(
          `Your income of ${formatCOP(a.monthlyIncome)} covers ${formatRatio(incomeRatio)}× the rent (minimum ${formatCOP(required)}).`,
          `Tus ingresos de ${formatCOP(a.monthlyIncome)} cubren ${formatRatio(incomeRatio)}× el canon (mínimo ${formatCOP(required)}).`,
        )
      : tr(
          `Your income of ${formatCOP(a.monthlyIncome)} is ${formatCOP(required - a.monthlyIncome)} below the minimum of ${formatCOP(required)}.`,
          `Tus ingresos de ${formatCOP(a.monthlyIncome)} están ${formatCOP(required - a.monthlyIncome)} por debajo del mínimo de ${formatCOP(required)}.`,
        ),
    fix: incomeOk
      ? undefined
      : tr('Add a co-tenant’s income or look for places with a lower rent.', 'Suma los ingresos de un co-arrendatario o busca inmuebles con canon más bajo.'),
  })

  const contractOk =
    r.contract === 'cualquiera' ||
    a.contract === 'indefinido' ||
    (r.contract === 'indefinido_o_fijo' && a.contract === 'fijo')
  results.push({
    key: 'contrato',
    label:
      r.contract === 'indefinido'
        ? tr('Permanent contract', 'Contrato indefinido')
        : r.contract === 'indefinido_o_fijo'
          ? tr('Employment contract', 'Contrato laboral')
          : tr('Contract type', 'Tipo de contrato'),
    passed: contractOk,
    explanation: contractOk
      ? tr(`Contract: ${contractLabelsEn[a.contract].toLowerCase()} · ${employerOf(a)}.`, `Contrato ${contractLabels[a.contract].toLowerCase()} con ${a.employer}.`)
      : tr(
          `Your contract type is ${contractLabelsEn[a.contract].toLowerCase()}, but the landlord requires ${r.contract === 'indefinido' ? 'a permanent contract' : 'an employment contract (permanent or fixed-term)'}.`,
          `Tu vínculo es ${contractLabels[a.contract].toLowerCase()} y el propietario exige ${r.contract === 'indefinido' ? 'término indefinido' : 'contrato laboral (indefinido o fijo)'}.`,
        ),
    fix: contractOk
      ? undefined
      : tr(
          'A co-signer does not replace this requirement for this landlord. Try places that accept self-employed applicants.',
          'Un codeudor no reemplaza este requisito para este propietario. Prueba inmuebles que acepten independientes.',
        ),
  })

  const tenureOk = a.tenureMonths >= r.minTenureMonths
  results.push({
    key: 'antiguedad',
    label: tr('Time in current job', 'Antigüedad laboral'),
    passed: tenureOk,
    explanation: tenureOk
      ? tr(
          `${tenureLabel(a.tenureMonths)} in your current job (minimum ${tenureLabel(r.minTenureMonths)}).`,
          `${tenureLabel(a.tenureMonths)} en tu actividad actual (mínimo ${tenureLabel(r.minTenureMonths)}).`,
        )
      : tr(
          `You have ${tenureLabel(a.tenureMonths)}; at least ${tenureLabel(r.minTenureMonths)} is required.`,
          `Llevas ${tenureLabel(a.tenureMonths)}; se piden al menos ${tenureLabel(r.minTenureMonths)}.`,
        ),
    fix: tenureOk
      ? undefined
      : tr('Attach letters from previous jobs to show continuous employment.', 'Adjunta certificados de empleos anteriores para demostrar continuidad laboral.'),
  })

  const guaranteeOk =
    r.guarantee === 'ninguna' ||
    (r.guarantee === 'poliza' && !!a.poliza) ||
    (r.guarantee === 'codeudor_o_poliza' && (!!a.poliza || !!a.codeudor))
  results.push({
    key: 'garantia',
    label: r.guarantee === 'poliza' ? tr('Lease insurance policy', 'Póliza de arrendamiento') : tr('Co-signer or lease insurance', 'Codeudor o póliza'),
    passed: guaranteeOk,
    explanation: guaranteeOk
      ? polizaOf(a) ?? tr(`Co-signer: ${codeudorOf(a)}`, `Codeudor: ${a.codeudor}`)
      : r.guarantee === 'poliza' && a.codeudor
        ? tr('You have a co-signer, but this landlord only accepts lease insurance.', 'Tienes codeudor, pero este propietario solo acepta póliza de arrendamiento.')
        : tr('We found no co-signer or approved lease insurance policy.', 'No encontramos codeudor ni póliza de arrendamiento aprobada.'),
    fix: guaranteeOk
      ? undefined
      : tr(
          'Request a lease insurance policy through EzRent (answer within 24 h) or add a co-signer who owns property.',
          'Solicita una póliza de arrendamiento desde EzRent (respuesta en 24 h) o agrega un codeudor con finca raíz.',
        ),
  })

  const creditOk = a.creditScore >= r.minCreditScore
  results.push({
    key: 'credito',
    label: tr('Credit history', 'Historial crediticio'),
    passed: creditOk,
    explanation: creditOk
      ? tr(`Score ${a.creditScore} with no negative reports (minimum ${r.minCreditScore}).`, `Puntaje ${a.creditScore} sin reportes negativos (mínimo ${r.minCreditScore}).`)
      : tr(
          `Score ${a.creditScore}, below the minimum of ${r.minCreditScore}. There is a recent negative report.`,
          `Puntaje ${a.creditScore}, por debajo del mínimo de ${r.minCreditScore}. Hay un reporte negativo reciente.`,
        ),
    fix: creditOk
      ? undefined
      : tr(
          'Bring the reported debts up to date; scores usually update within 1 to 3 months.',
          'Pon al día las obligaciones reportadas; el puntaje suele actualizarse en 1 a 3 meses.',
        ),
  })

  const passedCount = results.filter((x) => x.passed).length
  return { qualified: passedCount === results.length, results, passedCount, incomeRatio }
}

/** Resumen corto del perfil para la tarjeta del propietario. / Short profile summary for the landlord card. */
export function aiSummary(a: Applicant, l: Listing): string {
  const ev = evaluate(a, l)
  const first = a.name.split(' ')[0]
  const ratio = formatRatio(ev.incomeRatio)
  if (getLang() === 'en') {
    const guarantee = a.polizaEn ? a.polizaEn.replace('Pre-approved lease insurance · ', 'pre-approved lease insurance with ') : `a co-signer (${a.codeudorEn?.split(' · ')[0]})`
    // Keep acronyms ("UX designer") as written; lowercase ordinary job titles.
    const acronym = /^[A-Z]{2}/.test(a.cargoEn)
    const role = acronym ? a.cargoEn : a.cargoEn.charAt(0).toLowerCase() + a.cargoEn.slice(1)
    const article = !acronym && /^[aeiou]/i.test(role) ? 'an' : 'a'
    return `${first} is ${article} ${role} at ${a.employerEn.replace(' (contractor)', '')} ${contractPhraseEn[a.contract]} for ${tenureLabel(a.tenureMonths)}. Verified income covers ${ratio}× the rent, credit score is ${a.creditScore}, and the lease is backed by ${guarantee}.`
  }
  const guarantee = a.poliza ? a.poliza.replace('Póliza preaprobada · ', 'póliza preaprobada con ') : `codeudor (${a.codeudor?.split(' · ')[0]})`
  return `${first} es ${a.cargo.charAt(0).toLowerCase() + a.cargo.slice(1)} en ${a.employer.replace(' (contratista)', '')} ${contractPhrase[a.contract]} desde hace ${tenureLabel(a.tenureMonths)}. Sus ingresos verificados cubren ${ratio}× el canon, tiene puntaje crediticio de ${a.creditScore} y respalda el contrato con ${guarantee}.`
}
