import { useState, type ReactNode } from 'react'
import { tr } from '../lib/i18n'
import type { ApplicationStatus } from '../types'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#0f766e" />
        <path d="M8 16.5 16 9l8 7.5V24a1 1 0 0 1-1 1h-4.5v-5.5h-5V25H9a1 1 0 0 1-1-1z" fill="#fff" />
        <circle cx="23.5" cy="9" r="3" fill="#f59e0b" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-stone-900">
        Ez<span className="text-teal-700">Rent</span>
      </span>
    </span>
  )
}

export function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-teal-100 via-stone-100 to-amber-100 ${className}`} aria-label={alt}>
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-teal-700/50" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

export function Badge3D({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-stone-900 shadow-sm ${className}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal-700" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10" strokeLinejoin="round" />
      </svg>
      {tr('3D tour', 'Recorrido 3D')}
    </span>
  )
}

const statusStyles: Record<ApplicationStatus, { label: string; labelEn: string; cls: string }> = {
  en_revision: { label: 'En revisión', labelEn: 'Under review', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  preaprobado: { label: 'Preaprobado', labelEn: 'Pre-approved', cls: 'bg-teal-50 text-teal-800 ring-teal-200' },
  aceptado: { label: 'Aceptado', labelEn: 'Accepted', cls: 'bg-emerald-600 text-white ring-emerald-700' },
  rechazado: { label: 'Rechazado', labelEn: 'Declined', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export const statusLabel = (status: ApplicationStatus) => tr(statusStyles[status].labelEn, statusStyles[status].label)

export function StatusPill({ status }: { status: ApplicationStatus }) {
  const s = statusStyles[status]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${s.cls}`}>{tr(s.labelEn, s.label)}</span>
}

export function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

export function Check({ ok, className = 'h-5 w-5' }: { ok: boolean; className?: string }) {
  return ok ? (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0 text-emerald-600`} fill="currentColor" aria-label={tr('Meets', 'Cumple')}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0 text-rose-600`} fill="currentColor" aria-label={tr('Does not meet', 'No cumple')}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m3.5 12.1-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1z" />
    </svg>
  )
}

export function Spec({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 px-3 py-2.5">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-0.5 font-semibold text-stone-900">{value}</div>
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const v = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-stone-300',
    secondary: 'bg-white text-stone-900 ring-1 ring-stone-300 hover:bg-stone-50 disabled:text-stone-400',
    ghost: 'text-stone-700 hover:bg-stone-100',
    danger: 'bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed ${v} ${className}`}
    >
      {children}
    </button>
  )
}
