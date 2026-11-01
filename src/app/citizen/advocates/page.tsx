'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import {
  Users,
  Search,
  Filter,
  Star,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Video,
  Award,
  ChevronRight,
  CheckCircle,
  X,
  CreditCard,
} from 'lucide-react'

const SPECIALTIES = [
  'Barchasi',
  'Fuqarolik huquqi',
  'Mehnat huquqi',
  'Oilaviy huquq',
  'Jinoyat huquqi',
  'Meros huquqi',
  'Uy-joy huquqi',
  'Biznes va shartnomalar',
]

const CITIES = ['Barchasi', 'Toshkent', 'Samarqand', 'Buxoro', 'Farg‘ona', 'Andijon', 'Namangan']

export default function AdvocateDiscoveryPage() {
  const [advocates, setAdvocates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('Barchasi')
  const [selectedCity, setSelectedCity] = useState('Barchasi')
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'online' | 'offline'>('all')

  // Booking Modal State
  const [selectedAdvocate, setSelectedAdvocate] = useState<any | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('10:00')
  const [bookingFormat, setBookingFormat] = useState<'online' | 'offline'>('online')
  const [bookingService, setBookingService] = useState<any | null>(null)
  const [bookingNotes, setBookingNotes] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAdvocates() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (selectedSpecialty !== 'Barchasi') params.set('specialty', selectedSpecialty)
        if (selectedCity !== 'Barchasi') params.set('city', selectedCity)
        if (selectedFormat !== 'all') params.set('format', selectedFormat)
        if (searchQuery) params.set('search', searchQuery)

        const res = await fetch(`/api/advocates?${params.toString()}`)
        const json = await res.json()
        if (json.success && json.data) {
          setAdvocates(json.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadAdvocates()
  }, [selectedSpecialty, selectedCity, selectedFormat, searchQuery])

  const openBookingModal = (advocate: any) => {
    setSelectedAdvocate(advocate)
    setBookingService(advocate.services?.[0] || null)
    setBookingDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10))
    setBookingTime('10:00')
    setBookingSuccess(null)
    setBookingError(null)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdvocate || !bookingDate || !bookingTime) return

    setIsBooking(true)
    setBookingError(null)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advocateId: selectedAdvocate.user_id || selectedAdvocate.id,
          serviceTitle: bookingService?.title || 'Yuridik konsultatsiya',
          format: bookingFormat,
          appointmentDate: bookingDate,
          appointmentTime: bookingTime,
          amount: bookingService?.price || selectedAdvocate.hourly_rate || 150000,
          notes: bookingNotes,
        }),
      })

      const json = await res.json()
      if (json.success && json.data) {
        setBookingSuccess(json.data)
      } else {
        setBookingError(json.error || 'Uchrashuvni band qilishda xatolik yuz berdi')
      }
    } catch {
      setBookingError('Server bilan aloqa uzildi')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            100% Rasmiy Litsenziyalangan Advokatlar
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Professional Advokatlarni Izlash va Tanlash
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
            O‘zbekiston Advokatlar palatasida ro‘yxatga olingan mutaxassislar. Soha, tajriba,
            narx va fuqarolar qoldirgan haqiqiy taqrizlar asosida mos advokatni toping.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Advokat ismi, ixtisosligi yoki kalit so‘z bo‘yicha qidiring..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Huquqiy soha</label>
              <select
                value={selectedSpecialty}
                onChange={e => setSelectedSpecialty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
              >
                {SPECIALTIES.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shahar / Hudud</label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Konsultatsiya formati</label>
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
              >
                <option value="all">Barcha formatlar</option>
                <option value="online">Online (Video/Audio)</option>
                <option value="offline">Offline (Advokat ofisida)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advocates Grid */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            Advokatlar yuklanmoqda...
          </div>
        ) : advocates.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
            <Users className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Tanlangan filtrlar bo‘yicha advokat topilmadi
            </p>
            <p className="text-xs text-gray-500">Filtrlarni tozalab qayta qidirib ko‘ring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advocates.map(adv => (
              <div
                key={adv.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Avatar & Main Info */}
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        adv.avatar_url ||
                        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop'
                      }
                      alt={adv.full_name}
                      className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          {adv.full_name}
                        </h3>
                        {adv.verification_status === 'approved' && (
                          <span title="Tasdiqlangan advokat">
                            <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {adv.location_city}
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {adv.rating || 5.0}
                        </span>
                        <span className="text-gray-400">({adv.review_count || 0} taqriz)</span>
                      </div>
                    </div>
                  </div>

                  {/* License Info */}
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs space-y-0.5">
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      Litsenziya: <span className="font-mono">{adv.license_number}</span>
                    </p>
                    <p className="text-gray-500 text-[11px] truncate">{adv.bar_association}</p>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {adv.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5">
                    {adv.specialties?.map((sp: string) => (
                      <span
                        key={sp}
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing & Booking Action */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Konsultatsiya narxi:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(adv.hourly_rate || 150000).toLocaleString('uz-UZ')} UZS
                    </span>
                  </div>

                  <button
                    onClick={() => openBookingModal(adv)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Yozilish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedAdvocate && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedAdvocate(null)}
                className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  Konsultatsiyaga yozilish
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Advokat {selectedAdvocate.full_name}
                </h2>
                <p className="text-xs text-gray-500">
                  Litsenziya: {selectedAdvocate.license_number} ({selectedAdvocate.location_city})
                </p>
              </div>

              {bookingSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    Konsultatsiya muvaffaqiyatli band qilindi!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Sana: {bookingSuccess.appointment_date} | Vaqt: {bookingSuccess.appointment_time}
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <Link
                      href="/citizen/appointments"
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
                    >
                      Uchrashuvlarimga o‘tish
                    </Link>
                    <Link
                      href={`/citizen/messages?advocateId=${selectedAdvocate.user_id || selectedAdvocate.id}`}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                    >
                      Advokatga xabar yozish
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {bookingError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs">
                      {bookingError}
                    </div>
                  )}

                  {/* Service selection */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Xizmat turi
                    </label>
                    <div className="space-y-2">
                      {selectedAdvocate.services?.map((srv: any) => (
                        <label
                          key={srv.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            bookingService?.id === srv.id
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="service"
                              checked={bookingService?.id === srv.id}
                              onChange={() => setBookingService(srv)}
                            />
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                {srv.title}
                              </span>
                              <span className="text-[11px] text-gray-500">{srv.description}</span>
                            </div>
                          </div>
                          <span className="font-bold text-blue-600 whitespace-nowrap">
                            {Number(srv.price).toLocaleString('uz-UZ')} UZS
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Sana
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Vaqt oralig‘i
                      </label>
                      <select
                        value={bookingTime}
                        onChange={e => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      >
                        <option value="09:00">09:00 - 10:00</option>
                        <option value="10:00">10:00 - 11:00</option>
                        <option value="11:00">11:00 - 12:00</option>
                        <option value="14:00">14:00 - 15:00</option>
                        <option value="15:00">15:00 - 16:00</option>
                        <option value="16:00">16:00 - 17:00</option>
                      </select>
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Uchrashuv formati
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingFormat('online')}
                        className={`py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                          bookingFormat === 'online'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" /> Online (Video qo‘ng‘iroq)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingFormat('offline')}
                        className={`py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 ${
                          bookingFormat === 'offline'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" /> Ofisda (Shaxsiy)
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Advokat uchun izoh / mavzu
                    </label>
                    <textarea
                      rows={2}
                      value={bookingNotes}
                      onChange={e => setBookingNotes(e.target.value)}
                      placeholder="Konsultatsiyada nimalarni muhokama qilmoqchisiz..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    />
                  </div>

                  {/* Upfront fee notice */}
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs flex items-center justify-between">
                    <span className="text-gray-500">To‘lov summasi:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {Number(bookingService?.price || selectedAdvocate.hourly_rate || 150000).toLocaleString('uz-UZ')} UZS
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isBooking}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isBooking ? 'Band qilinmoqda...' : 'Tasdiqlash va band qilish'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
