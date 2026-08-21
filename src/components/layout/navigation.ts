import {
  Scale,
  Building2,
  GitBranch,
  BookOpen,
  Wrench,
  Users,
  BarChart3,
  Crown,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  Clapperboard,
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
 * ─────────────────────────────────────────────────────────────────────
 *  YAGONA NAVIGATION MANBAI
 *
 *  Desktop sidebar, mobil menyu va dashboard shu config'dan o'qiydi.
 *  Yangi element qo'shilsa — hamma joyda avtomatik paydo bo'ladi.
 *
 *  Struktura (1-rasm — source of truth):
 *    AMALIYOT → IRAC Huquqiy Tahlil, Qarorlar Daraxti, Virtual Sud
 *    RESURSLAR → Qonunlar bazasi, Asboblar, Jamiyat, Statistika
 *    SHAXSIY → Sozlamalar, Premium, Yordam, (Admin Panel — faqat admin), Chiqish
 * ─────────────────────────────────────────────────────────────────────
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Amaliyot',
    items: [
      {
        id: 'case-solver',
        name: 'Kazus Yechish (IRAC)',
        href: '/case-solver',
        icon: Scale,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'decision-tree',
        name: 'Qarorlar Daraxti',
        href: '/decision-tree',
        icon: GitBranch,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'virtual-court',
        name: 'Virtual Sud',
        href: '/virtual-court',
        icon: Building2,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'scenario-generator',
        name: 'Senariy Generator',
        href: '/scenario-generator',
        icon: Clapperboard,
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
        name: 'Qonunlar bazasi',
        href: '/legal-database',
        icon: BookOpen,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'professional-tools',
        name: 'Asboblar',
        href: '/professional-tools',
        icon: Wrench,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'community',
        name: 'Jamiyat',
        href: '/community',
        icon: Users,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'statistics',
        name: 'Statistika',
        href: '/statistics',
        icon: BarChart3,
        requiresAuth: true,
        badge: null,
      },
    ],
  },
  {
    title: 'Shaxsiy',
    items: [
      {
        id: 'profile',
        name: 'Sozlamalar',
        href: '/profile',
        icon: Settings,
        requiresAuth: true,
        badge: null,
      },
      {
        id: 'premium',
        name: 'Premium',
        href: '/premium',
        icon: Crown,
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

// ═══════════════════════════════════════════════════════════════
// Translation map — group title + item name kalitlari
// ═══════════════════════════════════════════════════════════════
export const NAV_GROUP_KEYS: Record<string, string> = {
  Amaliyot: 'groupPractice',
  Resurslar: 'groupResources',
  Shaxsiy: 'groupPersonal',
}

export const NAV_ITEM_KEYS: Record<string, string> = {
  'case-solver': 'navCaseSolver',
  'decision-tree': 'navDecisionTree',
  'virtual-court': 'navVirtualCourt',
  'scenario-generator': 'navScenarioGen',
  'legal-database': 'navLegalDatabase',
  'professional-tools': 'navTools',
  community: 'navCommunity',
  statistics: 'navStatistics',
  profile: 'navSettings',
  premium: 'navPremium',
  help: 'navHelp',
  admin: 'navAdminPanel',
  logout: 'navLogout',
}

/** Tarjima qilingan nav groups qaytaradi */
export function getTranslatedNavGroups(
  groups: NavGroup[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
): NavGroup[] {
  return groups.map(group => ({
    ...group,
    title: t(NAV_GROUP_KEYS[group.title] || group.title),
    items: group.items.map(item => ({
      ...item,
      name: t(NAV_ITEM_KEYS[item.id] || item.name),
    })),
  }))
}
