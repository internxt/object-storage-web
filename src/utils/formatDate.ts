export function formatDate(date?: Date): string {
  if (!date) {
    return '—';
  }
  const day = date.toLocaleDateString('en-GB', { day: '2-digit' });
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `${day}-${month}-${year} ${time}`;
}
