'use client'

import Link from 'next/link'
import { ArrowLeft, Book, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function AssignmentsPage() {
  const assignments = [
    {
      id: 1,
      title: 'IRAC Tahlil - Shartnoma Nizosi',
      course: 'Fuqarolik Huquqi',
      dueDate: '2026-06-20',
      status: 'pending',
      difficulty: 'medium'
    },
    {
      id: 2,
      title: 'Jinoiy Ish Bo\'yicha Tahlil',
      course: 'Jinoiy Huquq',
      dueDate: '2026-06-18',
      status: 'completed',
      difficulty: 'hard'
    },
    {
      id: 3,
      title: 'Hujjat Tayyorlash',
      course: 'Huquqiy Yozuv',
      dueDate: '2026-06-25',
      status: 'pending',
      difficulty: 'easy'
    }
  ]

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-purple-100 text-purple-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboardga qaytish
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Topshiriqlar</h1>
          <p className="text-gray-600">Sizning barcha topshiriqlaringiz va deadlinelar</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Jami Topshiriqlar</p>
                <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <Book className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tugallangan</p>
                <p className="text-3xl font-bold text-green-600">
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Kutilmoqda</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {assignments.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(assignment.status)}`}>
                      {getStatusIcon(assignment.status)}
                      {assignment.status === 'completed' ? 'Tugallangan' : 'Kutilmoqda'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{assignment.course}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      Muddati: {new Date(assignment.dueDate).toLocaleDateString('uz-UZ')}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(assignment.difficulty)}`}>
                      {assignment.difficulty === 'easy' ? 'Oson' : assignment.difficulty === 'medium' ? 'O\'rtacha' : 'Qiyin'}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/irac`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {assignment.status === 'completed' ? 'Ko\'rish' : 'Boshlash'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
