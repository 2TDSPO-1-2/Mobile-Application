export function isEmpty(value: string): boolean {
  return !value || value.trim().length === 0;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
