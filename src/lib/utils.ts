export function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
export function formatDate(date) {
  return date.toLocaleDateString()
}
