export function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
export function formatDate(date: any) {
  return date.toLocaleDateString()
}
