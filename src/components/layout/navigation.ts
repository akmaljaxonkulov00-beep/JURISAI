import {
  LayoutDashboard,
  Scale,
  Building2,
  GitBranch,
  BookOpen,
  FileText,
  Wrench,
  Crown,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  id: string
  name: string
  href?: string
  icon: LucideIcon
  badge?: string | null
  requiresAuth?: boolean
  adminOnly?: boolean
  action?: 'logout'
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

/**
 * ─────────────────────────────────────────────────────────────
 *  YAGONA NAVIGATION MANBAI
 *  Desktop sidebar, mobil menyu va dashboard shu config'dan
 *  o'qiydi. Yangi element qo'shilsa — hamma joyda avtomatik
 *  paydo bo'ladi.
 * ─────────────────────────────────────────────────────────────
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Asosiy',
    items: [
      {
        id: 'dashboard',
        name: 'Bosh sahifa',
        href: '/dashboard',
        icon: LayoutDashboard,
        requiresAuth: true,
        badge: null,
      },
    ],
  },
  {
    title: 'Amaliyot',
    items: [
      {
        id: 'case-solver',
        name: 'IRAC Huquqiy Tahlil',
        href: '/case-solver',
        icon: Scale,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'virtual-court',
        name: 'Virtual Sud',
        href: '/virtual-court',
        icon: Building2,
        requiresAuth: true,
        badge: 'Yangi',
      },
      {
        id: 'decision-tree',
        name: 'Qarorlar Daraxti',
        href: '/decision-tree',
        icon: GitBranch,
        requiresAuth: true,
        badge: null,
      },
    ],
  },
  {
    title: 'Resurslar',
    items: [
      {
        id: 'legal-database',
        name: 'Qonunlar Bazasi',
        href: '/legal-database',
        icon: BookOpen,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'document-generator',
        name: 'Hujjat Generator',
        href: '/document-generator',
        icon: FileText,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'professional-tools',
        name: 'Asboblar',
        href: '/professional-tools',
        icon: Wrench,
        requiresAuth: true,
        badge: 'Pro',
      },
    ],
  },
  {
    title: 'Shaxsiy',
    items: [
      {
        id: 'premium',
        name: 'Premium',
        href: '/premium',
        icon: Crown,
        requiresAuth: true,
        badge: 'Pro',
      },
      {
        id: 'profile',
        name: 'Sozlamalar',
        href: '/profile',
        icon: Settings,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'help',
        name: 'Yordam',
        href: '/help',
        icon: HelpCircle,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'admin',
        name: 'Admin Panel',
        href: '/admin',
        icon: Shield,
        requiresAuth: true,
        adminOnly: true,
        badge: null,
      },
      {
        id: 'logout',
        name: 'Chiqish',
        icon: LogOut,
        requiresAuth: true,
        adminOnly: false,
        action: 'logout',
      },
    ],
  },
]

export interface NavFilterState {
  isAuthenticated: boolean
  isAdmin: boolean
}

/** requiresAuth / adminOnly filtri — barcha komponentlar bir xil mantiq ishlatadi */
export function filterNavGroups(groups: NavGroup[], state: NavFilterState): NavGroup[] {
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.requiresAuth && !state.isAuthenticated) return false
        if (item.adminOnly && !state.isAdmin) return false
        return true
      }),
    }))
    .filter(group => group.items.length > 0)
}

/** Faol elementni aniqlash — prefix mosligi bilan (masalan /legal-database/12) */
export function isNavItemActive(href: string | undefined, pathname: string): boolean {
  if (!href) return false
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}
