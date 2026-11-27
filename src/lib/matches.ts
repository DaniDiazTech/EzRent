import { listings } from '../data/seed'
import type { Applicant, Application } from '../types'
import { evaluate } from './evaluate'

export function rentalMatches(applicant: Applicant, applications: Application[]) {
  const mine = new Map(applications.filter((entry) => entry.applicantId === applicant.id).map((entry) => [entry.listingId, entry]))
  return listings.map((listing) => {
    const application = mine.get(listing.id)
    return { listing, application, result: evaluate(applicant, listing) }
  })
}

export type RentalMatch = ReturnType<typeof rentalMatches>[number]

export function matchPriority({ application, result }: RentalMatch, verified: boolean) {
  if (application?.status === 'aceptado') return 4
  if (application?.status === 'preaprobado' && result.qualified) return 3
  if (!application && verified && result.qualified) return 2
  if (application?.status === 'en_revision') return 1
  return 0
}
