'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Loader2,
  FileSearch,
} from 'lucide-react'
import { RiskScanResult, ClauseRiskIssue, MissingClauseWarning } from '@/types/professional-tools'
import { getAuthHeaders } from '@/lib/api-auth-client'

export default function RiskAssessmentWorkspace() {
  const [docText, setDocText] = useState('')
  const [docTitle, setDocTitle] = useState('Oldi-sotdi / Xizmat ko‘rsatish shartnomasi')
  const [docType, setDocType] = useState('contract')
  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState<RiskScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''))
    try {
      const text = await file.text()
      setDocText(text)
    } catch {
      setError(
        'Faylni o‘qishda xatolik yuz berdi. Matnni to‘g‘ridan-to‘g‘ri nusxalab qo‘yishingiz mumkin.'
      )
    }
  }

  const handleRunScan = async () => {
    if (!docText.trim() || docText.length < 30) {
      setError('Tahlil uchun kamida 30 ta belgidan iborat shartnoma yoki hujjat matnini kiriting')
      return
    }

    setLoading(true)
    setError(null)
    setScanResult(null)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/tools/risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          documentText: docText,
          documentTitle: docTitle,
          documentType: docType,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Xavflarni tahlil qilishda xatolik yuz berdi')
      }

      setScanResult(data.report)
    } catch (err) {
      console.error('Scan error:', err)
      setError(err instanceof Error ? err.message : 'Tahlil jarayonida xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Input Box */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" /> Shartnoma va Hujjatlar Risk
              Skaneri
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Shartnomani yuklang yoki matnini kiriting — AI O‘zbekiston qonunchiligi (FK, Qonun
              670-I) bo‘yicha xavfli bandlarni tekshiradi
            </p>
          </div>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 cursor-pointer text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Fayl yuklash (DOCX/TXT)</span>
            <input
              type="file"
              accept=".txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Hujjat nomi
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Hujjat turi
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="contract">Shartnoma / Bitim</option>
              <option value="claim">Talabnoma / Da‘vo</option>
              <option value="general">Boshqa huquqiy hujjat</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
            Hujjat yoki Shartnoma matni *
          </label>
          <textarea
            rows={6}
            value={docText}
            onChange={e => setDocText(e.target.value)}
            placeholder="Shartnoma matnini bu yerga joylashtiring (masalan: 1. Shartnoma predmeti... 2. Tomonlarning majburiyatlari... 3. Javobgarlik...)"
            className="w-full p-3.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">{docText.length} belgi kiritildi</span>
          <button
            onClick={handleRunScan}
            disabled={loading || docText.length < 30}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Audit o‘tkazilmoqda...
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                Huquqiy Xavflarni Skaner Qilish
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Results Report */}
      {scanResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Summary Score Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${
                  scanResult.overallRisk === 'low'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : scanResult.overallRisk === 'high'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {scanResult.riskScore}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                      scanResult.overallRisk === 'low'
                        ? 'bg-emerald-100 text-emerald-800'
                        : scanResult.overallRisk === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Xavf darajasi: {scanResult.overallRisk}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {scanResult.documentTitle}
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 max-w-xl">
                  {scanResult.summary}
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 dark:text-zinc-400 flex-shrink-0">
              <p>
                Topilgan muammolar: <strong>{scanResult.detectedIssues?.length || 0} ta</strong>
              </p>
              <p>
                Yetishmayotgan bandlar: <strong>{scanResult.missingClauses?.length || 0} ta</strong>
              </p>
            </div>
          </div>

          {/* Identified Clause Issues */}
          {scanResult.detectedIssues && scanResult.detectedIssues.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Aniqlangan Xavfli Bandlar va Noaniqliklar
              </h4>

              <div className="space-y-3">
                {scanResult.detectedIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-800 dark:text-zinc-100 text-xs">
                        {issue.clauseTitle}
                      </h5>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          issue.severity === 'high' || issue.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {issue.severity} xavf
                      </span>
                    </div>

                    {issue.clauseText && (
                      <p className="p-2 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-200 font-mono text-[11px] italic">
                        “{issue.clauseText}”
                      </p>
                    )}

                    <p className="text-slate-700 dark:text-zinc-300 font-medium">
                      ⚠️ <strong>Muammo:</strong> {issue.issue}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        📚 Asos: {issue.legalGround}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-300">
                        ✓ <strong>Tavsiya:</strong> {issue.recommendation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Essential Clauses */}
          {scanResult.missingClauses && scanResult.missingClauses.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Shartnomaga Kiritilishi Zarur Bo‘lgan Yetishmayotgan Bandlar
              </h4>

              <div className="space-y-3">
                {scanResult.missingClauses.map((missing, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-blue-950 dark:text-blue-200 text-xs">
                        + {missing.clauseType}
                      </h5>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-200/60 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                        {missing.importance === 'essential' ? 'Majburiy' : 'Tavsiya etiladi'}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-zinc-300">{missing.whyNeeded}</p>

                    {missing.suggestedText && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-800 dark:text-zinc-200">
                        <span className="font-bold text-blue-600 block mb-0.5">Tavsiya matni:</span>
                        “{missing.suggestedText}”
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
