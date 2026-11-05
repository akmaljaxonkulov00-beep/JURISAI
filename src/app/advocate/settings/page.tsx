'use client'

import React, { useState, useEffect } from 'react'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  Briefcase,
  User,
  Shield,
  ShieldCheck,
  CreditCard,
  Lock,
  Globe,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

export default function AdvocateSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Profile Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [specializations, setSpecializations] = useState<string[]>([])
  const [experienceYears, setExperienceYears] = useState(5)
  const [education, setEducation] = useState('')
  const [lawFirm, setLawFirm] = useState('')
  const [region, setRegion] = useState('Toshkent shahri')
  const [languages, setLanguages] = useState<string[]>(['O‘zbek'])
  const [consultationFormats, setConsultationFormats] = useState<string[]>(['Online video', 'Telefon'])
  const [workingSchedule, setWorkingSchedule] = useState('Dushanba - Juma, 09:00 - 18:00')
  const [isAcceptingClients, setIsAcceptingClients] = useState(true)

  // Pricing & Confidentiality
  const [pricingType, setPricingType] = useState<'fixed' | 'starting' | 'negotiable' | 'per_case'>('fixed')
  const [priceAmount, setPriceAmount] = useState<number>(150000)
  const [isPricePublic, setIsPricePublic] = useState(true)

  // License & Verification
  const [licenseNumber, setLicenseNumber] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('pending')

  const availableSpecializations = [
    'Fuqarolik huquqi',
    'Jinoyat huquqi',
    'Iqtisodiy va korporativ huquq',
    'Mehnat huquqi',
    'Oilaviy nizolar',
    'Meros huquqi',
    'Ko‘chmas mulk va yer nizolari',
    'Soliq va bojxona huquqi',
    'Bankrotlik va qarzdorlik',
    'Intellektual mulk',
  ]

  const availableLanguages = ['O‘zbek', 'Ruscha', 'Inglizcha']
  const availableFormats = ['Online video', 'Yuzma-yuz ofisda', 'Telefon muloqoti']

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const res = await fetch('/api/advocates/profile')
        const json = await res.json()
        if (json.success && json.profile) {
          const p = json.profile
          setFullName(p.full_name || '')
          setPhone(p.phone || '')
          setBio(p.bio || '')
          setSpecializations(Array.isArray(p.specializations) ? p.specializations : [])
          setExperienceYears(p.experience_years || 5)
          setEducation(p.education || '')
          setLawFirm(p.law_firm || p.bar_association || '')
          setRegion(p.region || 'Toshkent shahri')
          setLanguages(Array.isArray(p.languages) ? p.languages : ['O‘zbek'])
          setConsultationFormats(Array.isArray(p.consultation_formats) ? p.consultation_formats : ['Online video'])
          setWorkingSchedule(p.working_schedule || 'Dushanba - Juma, 09:00 - 18:00')
          setIsAcceptingClients(p.is_accepting_clients !== false)
          setPricingType(p.pricing_type || 'fixed')
          setPriceAmount(p.consultation_price || 150000)
          setIsPricePublic(p.is_price_public !== false)
          setLicenseNumber(p.license_number || '')
          setVerificationStatus(p.verification_status || 'pending')
        }
      } catch (e) {
        console.error('Error fetching advocate profile:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const toggleSpecialization = (spec: string) => {
    setSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    )
  }

  const toggleLanguage = (lang: string) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const toggleFormat = (format: string) => {
    setConsultationFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/advocates/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          bio,
          specializations,
          experienceYears,
          education,
          lawFirm,
          region,
          languages,
          consultationFormats,
          workingSchedule,
          isAcceptingClients,
          pricingType,
          consultationPrice: priceAmount,
          isPricePublic,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 4000)
      } else {
        setErrorMessage(json.error || 'Profilni saqlashda xatolik yuz berdi')
      }
    } catch {
      setErrorMessage('Server bilan aloqa uzildi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav
        currentRole="advocate"
        isVerified={verificationStatus === 'verified' || verificationStatus === 'approved'}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Advokat Profilini Sozlash va Narxlash
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kasbiy biografiya, ixtisosliklar, moslashuvchan narxlar va kasbiy sir xavfsizligi
            </p>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-2">
            {verificationStatus === 'verified' || verificationStatus === 'approved' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Rasmiy Tasdiqlangan Advokat
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-500" />
                Verifikatsiya: {verificationStatus}
              </span>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            Profil sozlamalari muvaffaqiyatli saqlandi va ommaviy profilda yangilandi!
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asosiy ma'lumotlar */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Asosiy professional ma’lumotlar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  F.I.Sh. (To‘liq ism)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Aloqa telefoni
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Advokatlik tuzilmasi / Firma
                </label>
                <input
                  type="text"
                  value={lawFirm}
                  onChange={e => setLawFirm(e.target.value)}
                  placeholder="Masalan: 'Lex Legal Partners' advokatlik firmasi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ish tajribasi (yil)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={experienceYears}
                  onChange={e => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Hudud / Viloyat
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ta’lim / Oliy o‘quv yurti
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  placeholder="Masalan: Toshkent davlat yuridik universiteti (TDYU)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Professional Biografiya (Bio)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Kasbiy yo‘nalishingiz, yutuqlaringiz va tajribangiz haqida..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
              />
            </div>
          </div>

          {/* Mutaxassisliklar va Format */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Ixtisosliklar, Tillari va Xizmat formati
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Huquqiy ixtisosliklar (Tanlang):
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSpecializations.map(spec => {
                  const selected = specializations.includes(spec)
                  return (
                    <button
                      type="button"
                      key={spec}
                      onClick={() => toggleSpecialization(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {spec}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Konsultatsiya tillari:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map(l => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => toggleLanguage(l)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        languages.includes(l)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Konsultatsiya formati:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFormats.map(f => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => toggleFormat(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        consultationFormats.includes(f)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ish jadvali
                </label>
                <input
                  type="text"
                  value={workingSchedule}
                  onChange={e => setWorkingSchedule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="acceptClients"
                  checked={isAcceptingClients}
                  onChange={e => setIsAcceptingClients(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="acceptClients" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Yangi mijozlarni qabul qilish holati (Faol)
                </label>
              </div>
            </div>
          </div>

          {/* Narxlar va Kasbiy Sir (Section 1.3) */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Xizmat Narxlari va Kasbiy Sir Himoyasi
              </h3>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Maxfiy narx rejimi mavjud
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Quyidagi 4 xil narxlash usulidan birini tanlang. Agar narxni maxfiy saqlashni tanlasangiz, ommaviy profilda narx ko‘rsatilmaydi va mijoz bilan chat orqali individual kelishiladi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div
                onClick={() => setPricingType('fixed')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pricingType === 'fixed'
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="font-bold text-xs text-gray-900 dark:text-white">1. Aniq narx (Fixed)</div>
                <p className="text-[11px] text-gray-500 mt-1">Konsultatsiya uchun qat’iy belgilangan narx.</p>
              </div>

              <div
                onClick={() => setPricingType('starting')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pricingType === 'starting'
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="font-bold text-xs text-gray-900 dark:text-white">2. Boshlang‘ich narx (Starting from)</div>
                <p className="text-[11px] text-gray-500 mt-1">"... so‘mdan boshlanadi" shaklida taqdim etiladi.</p>
              </div>

              <div
                onClick={() => setPricingType('negotiable')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pricingType === 'negotiable'
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="font-bold text-xs text-gray-900 dark:text-white">3. Kelishilgan narx (Negotiable)</div>
                <p className="text-[11px] text-gray-500 mt-1">Aniq narx ko‘rsatilmaydi, mijoz bilan alohida kelishiladi.</p>
              </div>

              <div
                onClick={() => setPricingType('per_case')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  pricingType === 'per_case'
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="font-bold text-xs text-gray-900 dark:text-white">4. Ishga qarab narx (Per Case)</div>
                <p className="text-[11px] text-gray-500 mt-1">Murojaatni ko‘rib chiqib individual taklif beriladi.</p>
              </div>
            </div>

            {(pricingType === 'fixed' || pricingType === 'starting') && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Konsultatsiya qiymati (UZS)
                </label>
                <input
                  type="number"
                  step={10000}
                  value={priceAmount}
                  onChange={e => setPriceAmount(Number(e.target.value))}
                  className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold"
                />
              </div>
            )}

            {/* Ommaviy ko'rsatish / Maxfiy saqlash switch */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  {isPricePublic ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
                  Ommaviy profilda narxni ko‘rsatish
                </p>
                <p className="text-[11px] text-gray-500">
                  {isPricePublic
                    ? 'Narx mijozlar uchun advokatlar katalogida ochiq ko‘rinadi.'
                    : 'Narx maxfiy saqlanadi va faqat mijoz murojaat qilganda chat orqali yuboriladi.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPricePublic(!isPricePublic)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isPricePublic
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                }`}
              >
                {isPricePublic ? 'Ommaviy (Ochiq)' : 'Maxfiy (Yashirin)'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
