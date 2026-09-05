'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { Save, Upload, Trash2, Image, Sun, Moon, Globe, Eye } from 'lucide-react'

interface BrandingData {
  logoUrl: string | null
  logoDarkUrl: string | null
  faviconUrl: string | null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function LogoUploadSection({
  label,
  icon: Icon,
  iconColor,
  currentUrl,
  onUpload,
  onDelete,
  uploading,
  deleting,
  previewBg,
}: {
  label: string
  icon: typeof Sun
  iconColor: string
  currentUrl: string | null
  onUpload: (file: File) => void
  onDelete: () => void
  uploading: boolean
  deleting: boolean
  previewBg: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = '' // reset
  }

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <span className="text-sm font-semibold text-gray-800 dark:text-white">{label}</span>
      </div>

      {/* Preview */}
      <div
        className={`w-full h-20 rounded-lg flex items-center justify-center mb-3 overflow-hidden ${previewBg}`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="max-h-16 max-w-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400 dark:text-zinc-500">Logo yuklanmagan</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          onChange={handleChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {uploading ? 'Yuklanmoqda...' : currentUrl ? 'Almashtirish' : 'Yuklash'}
        </Button>
        {currentUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2">
        PNG, SVG, JPG, WEBP — max 2MB
      </p>
    </div>
  )
}

export default function BrandingSettingsCard() {
  const [branding, setBranding] = useState<BrandingData>({
    logoUrl: null,
    logoDarkUrl: null,
    faviconUrl: null,
  })
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Load current logos
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings/logo', { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          setBranding({
            logoUrl: data.logoUrl || null,
            logoDarkUrl: data.logoDarkUrl || null,
            faviconUrl: data.faviconUrl || null,
          })
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleUpload = async (key: string, file: File) => {
    setUploadingKey(key)
    setError('')
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          imageData: base64,
          imageType: file.type,
          imageKey: key,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBranding(prev => ({
          ...prev,
          [key]: data[key] || `data:${file.type};base64,${base64}`,
        }))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const err = await res.json()
        setError(err.error || 'Yuklashda xatolik')
      }
    } catch {
      setError('Yuklashda xatolik yuz berdi')
    } finally {
      setUploadingKey(null)
    }
  }

  const handleDelete = async (key: string) => {
    setDeletingKey(key)
    try {
      const res = await fetch(`/api/settings/logo?key=${key}`, {
        method: 'DELETE',
        headers: { ...(await getAuthHeaders()) },
      })
      if (res.ok) {
        setBranding(prev => ({ ...prev, [key]: null }))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError("O'chirishda xatolik — admin huquqi kerak")
      }
    } catch {
      setError("O'chirishda xatolik")
    } finally {
      setDeletingKey(null)
    }
  }

  if (loading) {
    return (
      <Card className="card-default rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-gray-200 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Yuklanmoqda...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-default rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5 text-indigo-600" />
          Brending — Sayt logosi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
          Sayt logotipini yuklang. Yuklangan logotip header, login, landing va boshqa sahifalarda
          avtomatik ko&apos;rinishi kerak.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LogoUploadSection
            label="Asosiy logo (Light)"
            icon={Sun}
            iconColor="#F59E0B"
            currentUrl={branding.logoUrl}
            onUpload={file => handleUpload('logo_url', file)}
            onDelete={() => handleDelete('logo_url')}
            uploading={uploadingKey === 'logo_url'}
            deleting={deletingKey === 'logo_url'}
            previewBg="bg-gray-100 dark:bg-zinc-800"
          />

          <LogoUploadSection
            label="Dark theme logo"
            icon={Moon}
            iconColor="#8B5CF6"
            currentUrl={branding.logoDarkUrl}
            onUpload={file => handleUpload('logo_dark_url', file)}
            onDelete={() => handleDelete('logo_dark_url')}
            uploading={uploadingKey === 'logo_dark_url'}
            deleting={deletingKey === 'logo_dark_url'}
            previewBg="bg-gray-900 dark:bg-black"
          />

          <LogoUploadSection
            label="Favicon"
            icon={Globe}
            iconColor="#2563EB"
            currentUrl={branding.faviconUrl}
            onUpload={file => handleUpload('favicon_url', file)}
            onDelete={() => handleDelete('favicon_url')}
            uploading={uploadingKey === 'favicon_url'}
            deleting={deletingKey === 'favicon_url'}
            previewBg="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
          />
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        {saved && (
          <p className="text-sm text-green-600 mt-3">
            ✅ Logo saqlandi — saytning barcha sahifalarida yangilanadi
          </p>
        )}

        {/* Live preview */}
        {(branding.logoUrl || branding.logoDarkUrl) && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                Jonli ko&apos;rinish
              </span>
            </div>
            <div className="flex items-center gap-6">
              {/* Light preview */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Light</span>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  {branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Light logo" className="h-8 object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">Yo&apos;q</span>
                  )}
                </div>
              </div>
              {/* Dark preview */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Dark</span>
                <div className="bg-gray-900 rounded-lg px-4 py-2 border border-zinc-700">
                  {branding.logoDarkUrl ? (
                    <img
                      src={branding.logoDarkUrl}
                      alt="Dark logo"
                      className="h-8 object-contain"
                    />
                  ) : branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="Dark logo fallback"
                      className="h-8 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">Yo&apos;q</span>
                  )}
                </div>
              </div>
              {/* Favicon preview */}
              {branding.faviconUrl && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Favicon
                  </span>
                  <div className="bg-white rounded-lg p-2 border border-gray-200">
                    <img
                      src={branding.faviconUrl}
                      alt="Favicon"
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
