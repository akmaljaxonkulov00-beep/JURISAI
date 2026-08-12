'use client'

import type { ReactNode } from 'react'
import AppSidebar from './AppSidebar'

/**
 * Eski Sidebar — endi yagona AppSidebar komponentiga delegatsiya qiladi.
 * Desktop va mobil menyu bitta NAV_GROUPS manbasidan ishlaydi.
 */
interface SidebarProps {
  user?: unknown
  className?: string
  isOpen?: boolean
  onToggle?: () => void
  children?: ReactNode
}

const Sidebar: React.FC<SidebarProps> = ({ className, children }) => {
  return (
    <div className={className}>
      <AppSidebar>{children}</AppSidebar>
    </div>
  )
}

export default Sidebar
