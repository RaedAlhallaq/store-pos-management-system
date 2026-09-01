import { db } from './db';
import { apiError } from './errors';
import { seedIfEmpty } from './seed';

let ready = null;

export function ensureReady() {
  if (!ready) {
    ready = db.open().then(() => seedIfEmpty());
  }
  return ready;
}

export function money(value) {
  return Number.parseFloat(Number(value || 0).toFixed(2));
}

export function qty(value) {
  return Number.parseFloat(Number(value || 0).toFixed(3));
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function currentUser() {
  try {
    const raw = localStorage.getItem('store_pos_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns current user or throws if not authenticated.
 * Use in API methods that require an active session.
 */
export function requireUser() {
  const user = currentUser();
  if (!user) apiError('يجب تسجيل الدخول أولاً.');
  return user;
}

export async function nextSequence(prefix, storeName, field) {
  const rows = await db.getAll(storeName);
  const todayPrefix = `${prefix}-${todayDate().replaceAll('-', '')}-`;
  const todays = rows
    .map((row) => String(row[field] || ''))
    .filter((value) => value.startsWith(todayPrefix));
  const maxSeq = todays.reduce((max, value) => {
    const seq = Number.parseInt(value.split('-').pop() || '0', 10);
    return Number.isNaN(seq) ? max : Math.max(max, seq);
  }, 0);
  return `${todayPrefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

export function inDateRange(iso, dateFrom, dateTo) {
  if (!iso) return true;
  const day = String(iso).slice(0, 10);
  if (dateFrom && day < dateFrom) return false;
  if (dateTo && day > dateTo) return false;
  return true;
}
