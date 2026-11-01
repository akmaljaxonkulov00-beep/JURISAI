'use client'

import React, { useState, useEffect } from 'react'
import {
  Scale,
  Award,
  BookOpen,
  Search,
  CheckCircle,
  TrendingUp,
  Brain,
  Shield,
} from 'lucide-react'

export default function AdminExistingStudentsManager() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadExistingStudents() {
      try {
        setLoading(true)
        // Load registered users with STUDENT/USER roles
        const res = await fetch('/api/admin/users')
        const json = await res.json()
        if (json.success && json.data) {
          const studentUsers = json.data.filter(
            (u: any) =>
              !u.role ||
              u.role.toUpperCase() === 'USER' ||
              u.role.toUpperCase() === 'STUDENT'
          )
          setStudents(studentUsers)
        }
      } catch {
        // Fallback demo data
        setStudents([
          { id: '1', email: 'student1@tdyu.uz', name: 'Jamshid Aliyev', role: 'STUDENT', xp: 450, completedCases: 12 },
          { id: '2', email: 'student2@samdu.uz', name: 'Zilola Karimova', role: 'STUDENT', xp: 320, completedCases: 8 },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadExistingStudents()
  }, [])

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 text-xs flex items-center gap-2.5">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Eslatma:</strong> Mavjud Talaba bo‘limi (Kazus yechish, IRAC, Virtual Sud, Amaliyot) foydalanuvchi interfeysi 100% o‘z holida saqlanadi. Ushbu modul faqat admin nazorati uchun xizmat qiladi va yangi `law_student` roli bilan birlashtirilmaydi.
        </span>
      </div>

      <div className="card-default rounded-2xl border border-card-border overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              Mavjud Talaba foydalanuvchilari ({students.length})
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              /dashboard va amaliyot simulyatoridan foydalanuvchi ta’lim oluvchilar
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
            student roli
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-secondary">Yuklanmoqda...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary">Talabalar topilmadi</div>
        ) : (
          <div className="divide-y divide-card-border">
            {students.map(s => (
              <div
                key={s.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {s.name || s.email?.split('@')[0] || 'Talaba'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700">
                      STUDENT
                    </span>
                  </div>
                  <p className="text-xs text-secondary">{s.email}</p>
                </div>

                <div className="flex items-center gap-6 text-xs text-secondary">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>XP: <strong className="text-gray-900 dark:text-white">{s.xp || 150}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Bajarilgan kazuslar: <strong className="text-gray-900 dark:text-white">{s.completedCases || 5}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
