export type ValidationErrors = Record<string, string>;

export function onlyDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

export function isValidEmail(value: unknown): boolean {
  const email = normalizeEmail(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function formatInteger(value: unknown): string {
  const digits = onlyDigits(value);
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CL');
}

export function parseFormattedInteger(value: unknown): number {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : 0;
}

export function normalizePhone(value: unknown): string {
  return String(value ?? '').replace(/[^0-9+\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function formatRut(value: unknown): string {
  const clean = String(value ?? '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

export function cleanRut(value: unknown): string {
  return String(value ?? '').replace(/[^0-9kK]/g, '').toUpperCase();
}

export function isValidRut(value: unknown): boolean {
  const rut = cleanRut(value);
  if (rut.length < 2) return false;

  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expected;
}

export function isPositiveInteger(value: unknown): boolean {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}
