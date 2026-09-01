export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pt-BR');
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return (
    today.getFullYear() === y &&
    today.getMonth() + 1 === m &&
    today.getDate() === d
  );
}

export function todayISO(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}
