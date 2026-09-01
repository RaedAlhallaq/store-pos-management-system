import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Arabic locale string with 2 decimal places.
 * Used for financial display in tables and dashboards.
 */
export function fmtLocale(value) {
  return Number.parseFloat(String(value || 0)).toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as fixed 2 decimal places.
 * Used for receipt/closing displays where plain decimals are needed.
 */
export function fmtFixed(value) {
  return parseFloat(String(value || 0)).toFixed(2);
}
