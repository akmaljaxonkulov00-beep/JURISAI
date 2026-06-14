export function cn(...classes) { return classes.filter(Boolean).join(" "); }
export function formatDate(date) { return date.toLocaleDateString(); }