import { useEffect, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleX,
  Info,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAppStore } from '../store'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ---------------------------------- Panel --------------------------------- */

export function Panel({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <div className={cn('panel', className)}>
      <div className={cn('panel-inner', innerClassName)}>{children}</div>
    </div>
  )
}

/* --------------------------------- Buttons -------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_-14px_var(--accent)]',
  secondary: 'border border-line bg-elevated/70 text-ink hover:bg-elevated',
  ghost: 'text-muted hover:bg-elevated/70 hover:text-ink',
  danger: 'border border-loss/25 bg-loss/10 text-loss hover:bg-loss/15',
}

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[10.5px] gap-1.5',
  sm: 'h-8 px-3 text-[11.5px] gap-1.5',
  md: 'h-9 px-4 text-[12px] gap-2',
  lg: 'h-10 px-5 text-[12.5px] gap-2',
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
}) {
  return (
    <button
      className={cn(
        'group inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition-all duration-300 ease-expo',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && (
        <span
          className={cn(
            'grid place-items-center rounded-full transition-transform duration-300 ease-expo group-hover:translate-x-0.5',
            size === 'xs' || size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
            variant === 'primary'
              ? 'bg-white/15 text-white'
              : 'border border-line bg-surface/60 text-muted',
          )}
        >
          {iconRight}
        </span>
      )}
    </button>
  )
}

export function IconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-transparent text-muted transition-all duration-300 ease-expo',
        'hover:border-line hover:bg-elevated/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        'active:scale-95 disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* --------------------------------- Badges --------------------------------- */

type BadgeVariant = 'neutral' | 'profit' | 'loss' | 'accent' | 'sim' | 'outline'

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: 'border-line bg-elevated/70 text-muted',
  profit: 'border-profit/20 bg-profit/10 text-profit',
  loss: 'border-loss/20 bg-loss/10 text-loss',
  accent: 'border-accent/25 bg-accent/10 text-accent',
  sim: 'border-dashed border-accent/40 bg-accent/[0.06] text-accent',
  outline: 'border-line bg-transparent text-muted',
}

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className,
}: {
  children: ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[9px] font-medium uppercase tracking-[0.14em]',
        badgeVariants[variant],
        className,
      )}
    >
      {dot && <span className="h-1 w-1 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusDot({ tone = 'neutral', pulse = false }: { tone?: 'profit' | 'loss' | 'accent' | 'neutral'; pulse?: boolean }) {
  const color =
    tone === 'profit'
      ? 'bg-profit'
      : tone === 'loss'
        ? 'bg-loss'
        : tone === 'accent'
          ? 'bg-accent'
          : 'bg-faint'
  return (
    <span className="relative flex h-1.5 w-1.5">
      {pulse && <span className={cn('absolute inset-0 rounded-full opacity-60', color, 'pulse-soft')} />}
      <span className={cn('relative h-1.5 w-1.5 rounded-full', color)} />
    </span>
  )
}

/* ---------------------------------- Forms --------------------------------- */

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[11.5px] font-medium text-muted">
          {label}
        </label>
        {hint && <span className="text-[10.5px] text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('input min-h-[96px] resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('input select', className)} {...props}>
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors duration-300 ease-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40',
        checked ? 'border-accent bg-accent' : 'border-line bg-elevated',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow-sm transition-[left] duration-300 ease-spring',
          checked ? 'left-[17px] bg-white' : 'left-[2px] bg-faint',
        )}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('inline-flex rounded-full border border-line bg-elevated/60 p-[3px]', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full font-medium transition-all duration-300 ease-expo',
            size === 'sm' ? 'px-2.5 py-1 text-[10.5px]' : 'px-3 py-1.5 text-[11.5px]',
            value === option.value
              ? 'bg-surface text-ink shadow-[0_1px_3px_var(--shadow)] ring-1 ring-line'
              : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------- Progress -------------------------------- */

export function Progress({
  value,
  tone = 'accent',
  className,
  height = 6,
}: {
  value: number
  tone?: 'accent' | 'profit' | 'loss' | 'muted'
  className?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(100, value))
  const color =
    tone === 'profit' ? 'bg-profit' : tone === 'loss' ? 'bg-loss' : tone === 'muted' ? 'bg-faint' : 'bg-accent'
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-elevated', className)}
      style={{ height }}
    >
      <div
        className={cn('h-full w-full origin-left rounded-full transition-transform duration-700 ease-expo', color)}
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  )
}

export function Ring({
  value,
  size = 132,
  stroke = 9,
  tone = 'accent',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: 'accent' | 'profit' | 'loss'
  children?: ReactNode
}) {
  const pct = Math.max(0, Math.min(100, value))
  const [progress, setProgress] = useState(0)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(pct))
    return () => cancelAnimationFrame(frame)
  }, [pct])

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--grid)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`var(--${tone})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 1.1s var(--ease-expo)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* -------------------------------- Sparkline ------------------------------- */

export function Sparkline({
  values,
  tone = 'accent',
  width = 96,
  height = 30,
  className,
}: {
  values: number[]
  tone?: 'accent' | 'profit' | 'loss'
  width?: number
  height?: number
  className?: string
}) {
  const gradientId = useId().replace(/:/g, '')
  if (values.length < 2) return <div style={{ width, height }} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / span) * (height - 4) - 2
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`var(--${tone})`} stopOpacity="0.22" />
          <stop offset="100%" stopColor={`var(--${tone})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={`var(--${tone})`}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* --------------------------------- Layout --------------------------------- */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent" />
            <span className="eyebrow">{eyebrow}</span>
            {meta}
          </div>
        )}
        <h1 className="text-[26px] font-medium leading-[1.1] tracking-[-0.035em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-muted sm:text-[12.5px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PanelHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 text-[10.5px] text-faint">{subtitle}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

export function InfoNote({
  title,
  children,
  icon,
  className,
}: {
  title: ReactNode
  children?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-xl border border-dashed border-accent/25 bg-accent/[0.035] px-3.5 py-3',
        className,
      )}
    >
      <span className="mt-[1px] shrink-0 text-accent">{icon ?? <ShieldCheck size={14} strokeWidth={1.5} />}</span>
      <div className="text-[10.5px] leading-relaxed text-muted">
        <span className="font-medium text-ink">{title}</span>
        {children ? <span> {children}</span> : null}
      </div>
    </div>
  )
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface shadow-[0_30px_90px_-20px_rgba(0,0,0,0.6)] animate-scale-in sm:rounded-[22px]',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-4">
          <div>
            <div className="text-[14px] font-medium tracking-tight text-ink">{title}</div>
            {description && <div className="mt-1 text-[11px] text-muted">{description}</div>}
          </div>
          <IconButton aria-label="Close dialog" onClick={onClose}>
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line-soft bg-elevated/30 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* --------------------------------- Toasts --------------------------------- */

export function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts)
  const dismiss = useAppStore((state) => state.dismissToast)

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-[90] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[330px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-surface/95 p-3.5 shadow-[0_20px_50px_-12px_var(--shadow)] backdrop-blur-xl animate-toast"
        >
          <span
            className={cn(
              'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full',
              toast.tone === 'error'
                ? 'bg-loss/10 text-loss'
                : toast.tone === 'success'
                  ? 'bg-profit/10 text-profit'
                  : 'bg-accent/10 text-accent',
            )}
          >
            {toast.tone === 'error' ? (
              <CircleX size={14} strokeWidth={1.5} />
            ) : toast.tone === 'success' ? (
              <Check size={14} strokeWidth={2} />
            ) : (
              <Info size={14} strokeWidth={1.5} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium text-ink">{toast.title}</div>
            {toast.message && <div className="mt-0.5 text-[10.5px] text-muted">{toast.message}</div>}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="mt-0.5 text-faint transition-colors hover:text-ink"
            aria-label="Dismiss notification"
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}

/* ---------------------------------- Misc ---------------------------------- */

export function CheckMark({ className }: { className?: string }) {
  return (
    <span className={cn('grid h-5 w-5 place-items-center rounded-full bg-profit/10 text-profit', className)}>
      <Check size={13} strokeWidth={2} />
    </span>
  )
}

export function ArrowChip({ tone = 'profit' }: { tone?: 'profit' | 'loss' }) {
  return (
    <span
      className={cn(
        'grid h-5 w-5 place-items-center rounded-full',
        tone === 'profit' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss',
      )}
    >
      <ArrowUpRight size={12} strokeWidth={1.8} className={tone === 'loss' ? 'rotate-90' : ''} />
    </span>
  )
}

export function Chevron({ className }: { className?: string }) {
  return <ChevronDown size={14} strokeWidth={1.5} className={className} />
}
