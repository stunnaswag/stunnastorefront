export function getAnalyticsDayKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatAnalyticsDayLabel(dateValue) {
  const key = getAnalyticsDayKey(dateValue);
  if (!key) return 'N/A';

  const [year, month, day] = key.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return utcDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}
