export function formatKztPerMonth(value: number) {
  return `${new Intl.NumberFormat('ru-KZ').format(value)} ₸ / мес`;
}

export function formatRating(value: number | null | undefined) {
  if (!value) {
    return '0.0';
  }

  return value.toFixed(1);
}
