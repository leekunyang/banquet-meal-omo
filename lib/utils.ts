import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats integer TWD as NT$1,280. Rejects non-integers so float bugs surface early. */
export function formatTWD(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`formatTWD expects an integer, got ${amount}`);
  }
  const sign = amount < 0 ? '−' : '';
  return `${sign}NT$${Math.abs(amount).toLocaleString('en-US')}`;
}

/** 0912345678 -> 0912-***-678. Used anywhere a phone number is displayed or logged. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return '****';
  return `${digits.slice(0, 4)}-***-${digits.slice(7)}`;
}

/** Accepts 0912 345 678, 0912-345-678 or +886912345678 and returns 0912345678. */
export function normalizeTwPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('886') ? `0${digits.slice(3)}` : digits;
  return /^09\d{8}$/.test(local) ? local : null;
}

export function toE164(localPhone: string): string {
  return `+886${localPhone.slice(1)}`;
}

const TAIPEI = 'Asia/Taipei';

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: TAIPEI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('zh-TW', { timeZone: TAIPEI, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(iso),
  );
}
