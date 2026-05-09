import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeMinutes(value?: string | null) {
  if (!value) {
    return 'Unknown'
  }

  const delta = new Date(value).getTime() - Date.now()
  const minutes = Math.round(delta / 60000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute')
  }

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 48) {
    return formatter.format(hours, 'hour')
  }

  const days = Math.round(hours / 24)
  return formatter.format(days, 'day')
}

export function formatConfidence(value?: number | null) {
  if (typeof value !== 'number') {
    return 'Unknown'
  }

  return `${Math.round(value * 100)}%`
}

export function formatPercentageValue(valueJson: string) {
  try {
    const parsed = JSON.parse(valueJson)
    if (typeof parsed === 'number') {
      return `${parsed}%`
    }
  } catch {
    return valueJson
  }

  return valueJson
}

export function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function copyText(value: string) {
  return navigator.clipboard.writeText(value)
}
