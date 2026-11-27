import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { LeaseTerms, SignedLease } from '../types'

export const agreementTitle = (language: LeaseTerms['language']) =>
  language === 'es' ? 'Contrato de arrendamiento' : 'Rental agreement'

export function agreementDate(iso: string, language: LeaseTerms['language']) {
  const dateOnly = iso.length === 10
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    dateStyle: 'medium', timeZone: dateOnly ? 'UTC' : 'America/Bogota',
  }).format(new Date(iso))
}

export async function createLeasePdf(terms: LeaseTerms, signedAt?: string, signedLease?: SignedLease) {
  const word = (en: string, es: string) => terms.language === 'es' ? es : en
  const amount = (value: number) => `COP ${value.toLocaleString(terms.language === 'es' ? 'es-CO' : 'en-US')}`
  const pdf = await PDFDocument.create()
  pdf.setTitle(agreementTitle(terms.language))
  pdf.setSubject(terms.property)
  const page = pdf.addPage([612, 792])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const ink = rgb(0.11, 0.13, 0.12)
  const muted = rgb(0.32, 0.37, 0.35)
  const teal = rgb(0.06, 0.34, 0.31)
  const rule = rgb(0.87, 0.90, 0.88)

  function text(value: string, x: number, y: number, size: number, font = regular, color = ink, maxWidth = 516) {
    const fittedSize = Math.min(size, size * maxWidth / Math.max(1, font.widthOfTextAtSize(value, size)))
    page.drawText(value, { x, y, size: fittedSize, font, color })
  }

  function line(y: number) {
    page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, thickness: 0.7, color: rule })
  }

  function field(label: string, value: string, x: number, y: number) {
    text(label, x, y, 10, regular, muted)
    text(value, x, y - 19, 13, bold, ink, 242)
  }

  text('EzRent', 48, 738, 16, bold, teal)
  text(agreementTitle(terms.language), 48, 690, 30, bold)
  text(terms.property, 48, 661, 13, bold)
  text(`${terms.neighborhood}, Bogotá D.C.`, 48, 643, 11, regular, muted)
  line(621)
  text(word('PARTIES', 'PARTES'), 48, 595, 10, bold, teal)
  field(word('Tenant', 'Arrendatario'), terms.tenant, 48, 574)
  field(word('Landlord or operator', 'Arrendador u operador'), terms.landlord, 314, 574)
  line(533)
  text(word('RENTAL DETAILS', 'DATOS DEL ARRENDAMIENTO'), 48, 507, 10, bold, teal)
  field(word('Monthly rent', 'Canon mensual'), amount(terms.rent), 48, 484)
  field(word('HOA fee', 'Administración'), amount(terms.fee), 314, 484)

  page.drawRectangle({ x: 48, y: 391, width: 516, height: 50, color: rgb(0.93, 0.97, 0.95) })
  field(word('Monthly total', 'Total mensual'), amount(terms.rent + terms.fee), 60, 422)
  field(word('Available from', 'Disponible desde'), agreementDate(terms.availableFrom, terms.language), 314, 422)
  line(366)
  text(word('TENANT SIGNATURE', 'FIRMA DEL ARRENDATARIO'), 48, 338, 10, bold, teal)
  text(word(
    'By signing below, the tenant confirms they reviewed the rental details above.',
    'Al firmar, el arrendatario confirma que revisó los datos del arrendamiento.',
  ), 48, 317, 11, regular, muted)

  page.drawRectangle({ x: 48, y: 207, width: 280, height: 88, borderColor: rule, borderWidth: 1 })
  if (signedLease?.signature.kind === 'drawn') {
    const image = await pdf.embedPng(signedLease.signature.png)
    const size = image.scaleToFit(246, 68)
    page.drawImage(image, { x: 64, y: 207 + (88 - size.height) / 2, ...size })
  } else if (signedLease?.signature.kind === 'typed') {
    text(signedLease.signature.name, 64, 243, 27, italic, teal, 248)
  } else {
    text(word('Signature field', 'Campo de firma'), 64, 244, 11, regular, muted)
  }

  text(terms.tenant, 48, 185, 12, bold)
  if (signedAt) {
    text(`${word('Signed on', 'Firmado el')} ${agreementDate(signedAt, terms.language)}`, 48, 167, 10, regular, muted)
    if (signedLease && signedLease.capturedAt !== signedAt) {
      text(`${word('Signature added on', 'Firma añadida el')} ${agreementDate(signedLease.capturedAt, terms.language)}`, 48, 152, 10, regular, muted)
    }
  } else {
    text(word('Awaiting tenant signature', 'Pendiente de firma del arrendatario'), 48, 167, 10, regular, muted)
  }

  line(67)
  text(agreementTitle(terms.language), 48, 45, 9, regular, muted)
  text('1 / 1', 543, 45, 9, regular, muted)
  return pdf.save()
}
