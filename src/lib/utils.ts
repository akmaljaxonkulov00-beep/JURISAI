export function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ')
}
export function formatDate(date: { toLocaleDateString: () => string }) {
  return date.toLocaleDateString()
}
