'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import SiteLogo from '@/components/SiteLogo'
import { useAuth } from '@/app/providers'
import { authService } from '@/services/supabase-auth'
import {
  Scale,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  Award,
  CheckCircle,
  Briefcase,
  BookOpen,
} from 'lucide-react'

interface PlatformRoleNavProps {
  currentRole: 'citizen' | 'law_student' | 'advocate' | 'admin' | 'student'
  userName?: string
  userEmail?: string
  isVerified?: boolean
}

export default function PlatformRoleNav({
  currentRole,
  userName,
  userEmail,
  isVerified,
}: PlatformRoleNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const handleLogout = async () => {
    await authService.signOut()
    router.push('/signin')
  }

  const citizenLinks = [
    { label: 'Bosh sahifa', href: '/citizen', icon: Scale },
    { label: 'Savol berish', href: '/citizen/ask', icon: HelpCircle },
    { label: 'Mening savollarim', href: '/citizen/questions', icon: FileText },
    { label: 'Advokatlar', href: '/citizen/advocates', icon: Users },
    { label: 'Uchrashuvlar', href: '/citizen/appointments', icon: Calendar },
    { label: 'Xabarlar', href: '/citizen/messages', icon: MessageSquare },
    { label: 'To‘lovlar', href: '/citizen/payments', icon: CreditCard },
  ]

  const lawStudentLinks = [
    { label: 'Talaba paneli', href: '/law-student', icon: Award },
    { label: 'Ommaviy savollar', href: '/law-student/questions', icon: BookOpen },
    { label: 'Mening javoblarim', href: '/law-student/answers', icon: CheckCircle },
    { label: 'IRAC Simulyator', href: '/dashboard', icon: Scale }, // Link to existing student practice!
  ]

  const advocateLinks = [
    { label: 'Advokat paneli', href: '/advocate', icon: Briefcase },
    { label: 'Uchrashuvlar', href: '/advocate/appointments', icon: Calendar },
    { label: 'Mijozlar bilan chat', href: '/advocate/messages', icon: MessageSquare },
    { label: 'Ishlar dosyesi', href: '/advocate/cases', icon: FileText },
    { label: 'Talabalar taqrizi', href: '/advocate/mentorship', icon: Award },
    { label: 'Daromadlar', href: '/advocate/earnings', icon: CreditCard },
  ]

  const activeLinks =
    currentRole === 'citizen'
      ? citizenLinks
      : currentRole === 'law_student'
        ? lawStudentLinks
        : currentRole === 'advocate'
          ? advocateLinks
          : []

  const roleBadgeText =
    currentRole === 'citizen'
      ? 'Fuqaro'
      : currentRole === 'law_student'
        ? isVerified
          ? 'Tasdiqlangan talaba'
          : 'Talaba (Tekshiruvda)'
        : currentRole === 'advocate'
          ? isVerified
            ? 'Tasdiqlangan advokat'
            : 'Advokat (Tekshiruvda)'
          : 'Foydalanuvchi'

  return (
    <header className="sticky top-0 z-40 bg-[#0B1528] text-white border-b border-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Role Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <SiteLogo size="sm" />
            </Link>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                currentRole === 'advocate'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : currentRole === 'law_student'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isVerified && <CheckCircle className="w-3 h-3 inline text-emerald-400" />}
              {roleBadgeText}
            </span>
          </div>

          {/* Role Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {activeLinks.map(link => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* User profile / Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-200">
                {userName || (user?.email ? user.email.split('@')[0] : 'Foydalanuvchi')}
              </p>
              <p className="text-xs text-gray-400">{userEmail || user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Chiqish"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
