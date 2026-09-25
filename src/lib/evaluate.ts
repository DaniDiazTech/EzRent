import type { Applicant, ContractType, Listing, Requirements } from '../types'
import { formatCOP, tenureLabel } from './format'

export const contractLabels: Record<ContractType, string> = {
  indefinido: 'Término indefinido',
  fijo: 'Término fijo',
  prestacion_servicios: 'Prestación de servicios',
  independiente: 'Independiente',
}

const contractPhrase: Record<ContractType, string> = {
  indefinido: 'con contrato a término indefinido',
  fijo: 'con contrato a término fijo',
  prestacion_servicios: 'por prestación de servicios',
  independiente: 'como independiente',
}

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
  return [
    {
      key: 'ingresos',
      label: `Ingresos mínimos de ${r.incomeMultiple.toLocaleString('es-CO')}× el canon`,
      detail: `${formatCOP(canon * r.incomeMultiple)} al mes, demostrables con desprendibles o extractos.`,
    },
    {
      key: 'contrato',
      label:
        r.contract === 'indefinido'
          ? 'Contrato a término indefinido'
          : r.contract === 'indefinido_o_fijo'
            ? 'Contrato laboral indefinido o fijo'
            : 'Cualquier tipo de contrato o independiente',
      detail:
        r.contract === 'cualquiera'
          ? 'Se aceptan independientes y prestación de servicios con extractos bancarios.'
          : 'Validado con certificado laboral de menos de 30 días.',
    },
    {
      key: 'antiguedad',
      label: `Antigüedad laboral mínima de ${tenureLabel(r.minTenureMonths)}`,
      detail: 'En el empleo o actividad actual.',
    },
    {
      key: 'garantia',
      label: r.guarantee === 'poliza' ? 'Póliza de arrendamiento' : r.guarantee === 'codeudor_o_poliza' ? 'Codeudor o póliza de arrendamiento' : 'Sin garantía adicional',
      detail:
        r.guarantee === 'poliza'
          ? 'Aprobada por una aseguradora (El Libertador, SURA, Bolívar).'
          : 'Codeudor con finca raíz en Bogotá o póliza aprobada por aseguradora.',
    },
    {
      key: 'credito',
      label: `Sin reportes negativos (puntaje ≥ ${r.minCreditScore})`,
      detail: 'Consulta en centrales de riesgo autorizada por el aplicante.',
    },
  ]
}

export function evaluate(a: Applicant, l: Listing): Evaluation {
  const r = l.requirements
  const required = l.canon * r.incomeMultiple
  const incomeRatio = a.monthlyIncome / l.canon
  const results: RequirementResult[] = []

  const incomeOk = a.monthlyIncome >= required
  results.push({
    key: 'ingresos',
    label: `Ingresos ≥ ${r.incomeMultiple.toLocaleString('es-CO')}× canon`,
    passed: incomeOk,
    explanation: incomeOk
      ? `Tus ingresos de ${formatCOP(a.monthlyIncome)} cubren ${incomeRatio.toLocaleString('es-CO', { maximumFractionDigits: 1 })}× el canon (mínimo ${formatCOP(required)}).`
      : `Tus ingresos de ${formatCOP(a.monthlyIncome)} están ${formatCOP(required - a.monthlyIncome)} por debajo del mínimo de ${formatCOP(required)}.`,
    fix: incomeOk ? undefined : 'Suma los ingresos de un co-arrendatario o busca inmuebles con canon más bajo.',
  })

  const contractOk =
    r.contract === 'cualquiera' ||
    a.contract === 'indefinido' ||
    (r.contract === 'indefinido_o_fijo' && a.contract === 'fijo')
  results.push({
    key: 'contrato',
    label: r.contract === 'indefinido' ? 'Contrato indefinido' : r.contract === 'indefinido_o_fijo' ? 'Contrato laboral' : 'Tipo de contrato',
    passed: contractOk,
    explanation: contractOk
      ? `Contrato ${contractLabels[a.contract].toLowerCase()} con ${a.employer}.`
      : `Tu vínculo es ${contractLabels[a.contract].toLowerCase()} y el propietario exige ${r.contract === 'indefinido' ? 'término indefinido' : 'contrato laboral (indefinido o fijo)'}.`,
    fix: contractOk ? undefined : 'Un codeudor no reemplaza este requisito para este propietario. Prueba inmuebles que acepten independientes.',
  })

  const tenureOk = a.tenureMonths >= r.minTenureMonths
  results.push({
    key: 'antiguedad',
    label: 'Antigüedad laboral',
    passed: tenureOk,
    explanation: tenureOk
      ? `${tenureLabel(a.tenureMonths)} en tu actividad actual (mínimo ${tenureLabel(r.minTenureMonths)}).`
      : `Llevas ${tenureLabel(a.tenureMonths)}; se piden al menos ${tenureLabel(r.minTenureMonths)}.`,
    fix: tenureOk ? undefined : 'Adjunta certificados de empleos anteriores para demostrar continuidad laboral.',
  })

  const guaranteeOk =
    r.guarantee === 'ninguna' ||
    (r.guarantee === 'poliza' && !!a.poliza) ||
    (r.guarantee === 'codeudor_o_poliza' && (!!a.poliza || !!a.codeudor))
  results.push({
    key: 'garantia',
    label: r.guarantee === 'poliza' ? 'Póliza de arrendamiento' : 'Codeudor o póliza',
    passed: guaranteeOk,
    explanation: guaranteeOk
      ? a.poliza ?? `Codeudor: ${a.codeudor}`
      : r.guarantee === 'poliza' && a.codeudor
        ? 'Tienes codeudor, pero este propietario solo acepta póliza de arrendamiento.'
        : 'No encontramos codeudor ni póliza de arrendamiento aprobada.',
    fix: guaranteeOk ? undefined : 'Solicita una póliza de arrendamiento desde EzRent (respuesta en 24 h) o agrega un codeudor con finca raíz.',
  })

  const creditOk = a.creditScore >= r.minCreditScore
  results.push({
    key: 'credito',
    label: 'Historial crediticio',
    passed: creditOk,
    explanation: creditOk
      ? `Puntaje ${a.creditScore} sin reportes negativos (mínimo ${r.minCreditScore}).`
      : `Puntaje ${a.creditScore}, por debajo del mínimo de ${r.minCreditScore}. Hay un reporte negativo reciente.`,
    fix: creditOk ? undefined : 'Pon al día las obligaciones reportadas; el puntaje suele actualizarse en 1 a 3 meses.',
  })

  const passedCount = results.filter((x) => x.passed).length
  return { qualified: passedCount === results.length, results, passedCount, incomeRatio }
}

/** Resumen corto estilo IA para la tarjeta del propietario. */
export function aiSummary(a: Applicant, l: Listing): string {
  const ev = evaluate(a, l)
  const first = a.name.split(' ')[0]
  const ratio = ev.incomeRatio.toLocaleString('es-CO', { maximumFractionDigits: 1 })
  const guarantee = a.poliza ? a.poliza.replace('Póliza preaprobada · ', 'póliza preaprobada con ') : `codeudor (${a.codeudor?.split(' · ')[0]})`
  return `${first} es ${a.cargo.charAt(0).toLowerCase() + a.cargo.slice(1)} en ${a.employer.replace(' (contratista)', '')} ${contractPhrase[a.contract]} desde hace ${tenureLabel(a.tenureMonths)}. Sus ingresos verificados cubren ${ratio}× el canon, tiene puntaje crediticio de ${a.creditScore} y respalda el contrato con ${guarantee}.`
}
