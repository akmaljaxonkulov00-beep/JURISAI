'use client'

import React, { useState } from 'react'
import {
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { authService } from '@/services/supabase-auth'

export default function DataManagementTab() {
  const { t, language } = useLanguage()

  const [exporting, setExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmKeyword, setConfirmKeyword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const expectedKeyword = language === 'ru' ? 'УДАЛИТЬ' : language === 'en' ? 'DELETE' : 'O‘CHIRISH'

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/user/export-data')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `juristiv-account-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmKeyword.trim().toUpperCase() !== expectedKeyword.toUpperCase()) {
      setDeleteError(`Tasdiqlash uchun aynan "${expectedKeyword}" so‘zini kiriting`)
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()

      if (res.ok && json.success) {
        await authService.signOut()
        window.location.href = '/signin'
      } else {
        setDeleteError(json.error || 'Hisobni o‘chirishda xatolik yuz berdi')
      }
    } catch {
      setDeleteError('Server bilan aloqa uzildi. Iltimos qayta urinib ko‘ring.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('dataTitle', 'Ma’lumotlar boshqaruvi')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {t('dataSubtitle', 'Shaxsiy ma’lumotlaringizni eksport qiling yoki hisobni boshqaring')}
        </p>
      </div>

      {/* 1. Data Export Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <span>{t('exportDataTitle', 'Ma’lumotlarni yuklab olish (JSON Export)')}</span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-xl">
              {t(
                'exportDataDesc',
                'Profilingiz, yechilgan kazuslar, qarorlar daraxti va vositalar tarixini to‘liq yuklab oling'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex-shrink-0"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('exporting', 'Eksport qilinmoqda...')}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t('exportDataButton', 'Ma’lumotlarni yuklab olish')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Danger Zone: Delete Account */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 mb-1">
              {t('deleteAccountTitle', 'Hisobni o‘chirish')}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 mb-4 leading-relaxed">
              {t(
                'deleteAccountWarning',
                'Diqqat: Hisobni o‘chirish amalini ortga qaytarib bo‘lmaydi. Barcha kazuslar, tahlillar va to‘lovlar tarixi o‘chiriladi.'
              )}
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('deleteAccountButton', 'Hisobni o‘chirish')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {t('deleteAccountConfirmModalTitle', 'Hisobni o‘chirishni tasdiqlaysizmi?')}
              </h4>
            </div>

            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {t(
                'deleteAccountConfirmModalDesc',
                'Bu amalni qaytarib bo‘lmaydi. Barcha shaxsiy ma’lumotlaringiz butunlay o‘chirib yuboriladi.'
              )}
            </p>

            {deleteError && (
              <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-300">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                {t('deleteAccountTypeToConfirm', 'Tasdiqlash uchun quyidagi maydonga yozing')}:{' '}
                <span className="text-rose-600 font-bold">{expectedKeyword}</span>
              </label>
              <input
                type="text"
                value={confirmKeyword}
                onChange={e => setConfirmKeyword(e.target.value)}
                placeholder={expectedKeyword}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmKeyword('')
                  setDeleteError(null)
                }}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
              >
                {t('cancel', 'Bekor qilish')}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  deleting || confirmKeyword.trim().toUpperCase() !== expectedKeyword.toUpperCase()
                }
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('deletingAccount', 'Hisob o‘chirilmoqda...')}</span>
                  </>
                ) : (
                  <span>{t('confirmDelete', 'Ha, butunlay o‘chirilsin')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
