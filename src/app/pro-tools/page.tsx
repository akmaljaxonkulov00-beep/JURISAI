'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Wrench, Calculator, FileText, Search, Download, Upload, Clock, TrendingUp, Shield, Database, Settings, BookOpen, Target, Zap, X, FileCheck, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { ALL_LEGAL_CODES, CODE_DISPLAY_NAMES } from '@/data/legal-codes';

// ── Pure Functions ────────────────────────────────────────────────────

type CalcResult = { result: string; details: string[] };

function calcFine(crime: string, amount: number): CalcResult {
  const f: Record<string, { mn: number; mx: number }> = {
    "O'g'irlik": { mn: 5, mx: 50 }, Talonchilik: { mn: 10, mx: 100 },
    Firibgarlik: { mn: 5, mx: 100 }, "Makon buzish": { mn: 3, mx: 30 },
    "Jarohat yetkazish": { mn: 10, mx: 50 },
  };
  const r = f[crime] || { mn: 5, mx: 50 };
  const bhm = 300000;
  const mn = r.mn * bhm;
  const mx = r.mx * bhm;
  return {
    result: `${mn.toLocaleString()} - ${mx.toLocaleString()} UZS`,
    details: [`Jinoyat: ${crime}`, `BHM: ${bhm.toLocaleString()} UZS`, `Min: ${mn.toLocaleString()} UZS`, `Max: ${mx.toLocaleString()} UZS`],
  };
}

function calcComp(type: string, amount: number, income: number): CalcResult {
  const m: Record<string, number> = { Moddiy: 1.0, Axloqiy: 0.5, Moral: 0.3 };
  const mult = m[type] || 1.0;
  const total = (amount || 0) * mult + (income || 0) * 30;
  return {
    result: `${total.toLocaleString()} UZS`,
    details: [`Zarar: ${type}`, `Asos: ${((amount || 0) * mult).toLocaleString()} UZS`, `Yo'qotilgan: ${((income || 0) * 30).toLocaleString()} UZS`, `Jami: ${total.toLocaleString()} UZS`],
  };
}

function calcAllow(type: string, income: number, exp: number): CalcResult {
  const rates: Record<string, { r: number; m: number }> = {
    Asosiy: { r: 0.6, m: 6 }, "Qo'shimcha": { r: 0.4, m: 3 }, Ishsizlik: { r: 0.3, m: 12 },
  };
  const r = rates[type] || { r: 0.5, m: 6 };
  const monthly = (income || 0) * r.r * (1 + Math.min((exp || 0) * 0.02, 0.2));
  return {
    result: `${(monthly * r.m).toLocaleString()} UZS`,
    details: [`Ish: ${type}`, `Oylik: ${(income || 0).toLocaleString()} UZS`, `Stavka: ${(r.r * 100).toFixed(0)}%`, `Jami: ${(monthly * r.m).toLocaleString()} UZS`],
  };
}

function calcDeadline(date: string, type: string): CalcResult {
  const days: Record<string, number> = { "Da'vo berish": 30, Apellyatsiya: 30, Kassatsiya: 30, Nazorat: 365 };
  const d = days[type] || 30;
  const end = new Date(date);
  end.setDate(end.getDate() + d);
  const rem = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  return {
    result: end.toLocaleDateString('uz-UZ'),
    details: [`Boshlang'ich: ${new Date(date).toLocaleDateString('uz-UZ')}`, `Muddat: ${d} kun`, `Oxirgi: ${end.toLocaleDateString('uz-UZ')}`, `Qolgan: ${rem} kun`],
  };
}

// ── Static Data ───────────────────────────────────────────────────────

const TEMPLATES = [
  { name: "Da'vo arizasi", desc: "Sudga da'vo berish arizasi", cat: "Sud hujjatlari" },
  { name: "Shartnoma", desc: "Fuqarolik-huquqiy shartnoma", cat: "Fuqarolik-huquqiy" },
  { name: "Vakolatnoma", desc: "Vakolat berish hujjati", cat: "Vakolat hujjatlari" },
  { name: "Mehnat shartnomasi", desc: "Ish beruvchi va xodim", cat: "Mehnat huquqi" },
];

type Tab = 'calc' | 'doc' | 'search' | 'templates' | 'cases' | 'deadline';

const TOOLS: { id: Tab; n: string; icon: React.ReactNode; d: string; c: string; cat: string }[] = [
  { id: 'calc', n: 'Huquqiy kalkulyator', icon: <Calculator className="w-6 h-6" />, d: 'Jarima va tovon hisoblash', c: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', cat: 'Hisob-kitob' },
  { id: 'doc', n: 'Hujjat tahlili', icon: <FileText className="w-6 h-6" />, d: 'Hujjatlarni AI tahlili', c: 'bg-green-100 dark:bg-green-900/30 text-green-600', cat: 'Tahlil' },
  { id: 'search', n: 'Qonun qidiruvi', icon: <Search className="w-6 h-6" />, d: 'Qonunlarda tezkor qidiruv', c: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', cat: 'Qidiruv' },
  { id: 'templates', n: 'Namunalar', icon: <Download className="w-6 h-6" />, d: 'Hujjat namunalari', c: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', cat: 'Yaratish' },
  { id: 'cases', n: 'Case kuzatuv', icon: <Clock className="w-6 h-6" />, d: 'Case holatini kuzatish', c: 'bg-red-100 dark:bg-red-900/30 text-red-600', cat: 'Kuzatuv' },
  { id: 'deadline', n: 'Muddat hisoblash', icon: <Target className="w-6 h-6" />, d: 'Muddatlarni hisoblash', c: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600', cat: 'Eslatma' },
];

function badge(id: string) {
  return CODE_DISPLAY_NAMES[id];
}

// ── Component ─────────────────────────────────────────────────────────

export default function ProTools() {
  const [tab, setTab] = useState<Tab>('calc');
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchRun, setSearchRun] = useState(false);
  const [codeFilter, setCodeFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculator states
  const [fineForm, setFineForm] = useState({ crime: '', amount: 0 });
  const [compForm, setCompForm] = useState({ type: '', amount: 0, income: 0 });
  const [allowForm, setAllowForm] = useState({ type: '', income: 0, exp: 0 });

  // Deadline states
  const [dlForm, setDlForm] = useState({ date: '', type: '' });
  const [dlResult, setDlResult] = useState<CalcResult | null>(null);
  const [dlLoading, setDlLoading] = useState(false);

  const doCalc = (fn: () => void) => {
    setCalcLoading(true);
    setTimeout(() => { fn(); setCalcLoading(false); }, 200);
  };

  const doSearch = useCallback(() => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchRun(true);
    setTimeout(() => {
      const lq = query.toLowerCase();
      const results: any[] = [];
      ALL_LEGAL_CODES.forEach((code: any) => {
        if (codeFilter && code.id !== codeFilter) return;
        (code.articles || []).forEach((a: any) => {
          if (
            (a.number && a.number.toLowerCase().includes(lq)) ||
            (a.title && a.title.toLowerCase().includes(lq)) ||
            (a.content && a.content.toLowerCase().includes(lq)) ||
            (a.category && a.category.toLowerCase().includes(lq))
          ) {
            results.push({ code, article: a });
          }
        });
      });
      setSearchResults(results.slice(0, 20));
      setSearchLoading(false);
    }, 200);
  }, [query, codeFilter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setAnalysisLoading(true);
    setAnalysis(null);
    
    try {
      const text = await f.text();
      
      // Call real AI analysis API
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text, documentType: f.name.split('.').pop() || 'unknown' }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysis(result.analysis || 'Tahlil natijasi olinmadi.');
      } else {
        // Fallback: basic analysis without mock data
        const wordCount = text.split(/\s+/).length;
        setAnalysis(
          `📄 Hujjat tahlili:\n` +
          `  • Tur: ${f.name.split('.').pop()?.toUpperCase() || 'Nomaʼlum'}\n` +
          `  • Hajm: ${f.size > 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B'}\n` +
          `  • So'zlar soni: ${wordCount.toLocaleString()}\n` +
          `  • Baho: ${wordCount > 100 ? '✅ Qoniqarli' : '⚠️ Juda qisqa'}\n\n` +
          `Takliflar:\n` +
          `  • Huquqiy jihatdan tekshirish tavsiya etiladi\n` +
          `  • Muhim shartlarni belgilang\n` +
          `  • Nizolarni hal qilish tartibini kiriting`
        );
      }
    } catch (error) {
      console.log('Document analysis error:', error);
      setAnalysis('❌ Hujjat tahlilida xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm mr-4"><Wrench className="w-8 h-8" /></div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Professional Asboblar</h1>
              <p className="text-white/90">Huquqchilar uchun maxsus asboblar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Tool Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TOOLS.map(t => (
            <div
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg border border-gray-200 dark:border-zinc-800 ${tab === t.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${t.c}`}>{t.icon}</div>
                <Badge variant="outline">{t.cat}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t.n}</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm">{t.d}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-zinc-800 mb-6 overflow-x-auto">
            <nav className="flex space-x-6 min-w-max">
              {TOOLS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.n}
                </button>
              ))}
            </nav>
          </div>

          {/* ════════════════ CALCULATOR ════════════════ */}
          {tab === 'calc' && (
            <div className="space-y-6">
              {calcResult && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Natija:</h3>
                    <button onClick={() => setCalcResult(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"><X size={16} /></button>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calcResult.result}</p>
                  <div className="mt-2 space-y-0.5">
                    {calcResult.details.map((d, i) => (
                      <p key={i} className="text-xs text-gray-600 dark:text-zinc-400">{d}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Jarima */}
                <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Calculator className="w-6 h-6" /></div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Jarima</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">JK va MJK boyicha</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <select
                      value={fineForm.crime}
                      onChange={e => setFineForm({ ...fineForm, crime: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Jinoyat turi</option>
                      <option value="O'g'irlik">O'g'irlik</option>
                      <option value="Talonchilik">Talonchilik</option>
                      <option value="Firibgarlik">Firibgarlik</option>
                      <option value="Makon buzish">Makon buzish</option>
                      <option value="Jarohat yetkazish">Jarohat yetkazish</option>
                    </select>
                    <input
                      type="number"
                      value={fineForm.amount || ''}
                      onChange={e => setFineForm({ ...fineForm, amount: Number(e.target.value) })}
                      placeholder="Zarar miqdori"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={() => doCalc(() => setCalcResult(calcFine(fineForm.crime, fineForm.amount)))}
                      disabled={calcLoading || !fineForm.crime}
                      className="w-full"
                    >
                      {calcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Tovon */}
                <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><TrendingUp className="w-6 h-6" /></div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Tovon</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Moddiy va axloqiy</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <select
                      value={compForm.type}
                      onChange={e => setCompForm({ ...compForm, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Zarar turi</option>
                      <option value="Moddiy">Moddiy</option>
                      <option value="Axloqiy">Axloqiy</option>
                      <option value="Moral">Moral</option>
                    </select>
                    <input
                      type="number"
                      value={compForm.amount || ''}
                      onChange={e => setCompForm({ ...compForm, amount: Number(e.target.value) })}
                      placeholder="Zarar miqdori"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={compForm.income || ''}
                      onChange={e => setCompForm({ ...compForm, income: Number(e.target.value) })}
                      placeholder="Kunlik daromad"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={() => doCalc(() => setCalcResult(calcComp(compForm.type, compForm.amount, compForm.income)))}
                      disabled={calcLoading || !compForm.type}
                      className="w-full"
                    >
                      Hisoblash
                    </Button>
                  </CardContent>
                </Card>

                {/* Nafaqa */}
                <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><Shield className="w-6 h-6" /></div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">Nafaqa</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Nafaqa hisoblash</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <select
                      value={allowForm.type}
                      onChange={e => setAllowForm({ ...allowForm, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Ish turi</option>
                      <option value="Asosiy">Asosiy</option>
                      <option value="Qo'shimcha">Qo'shimcha</option>
                      <option value="Ishsizlik">Ishsizlik</option>
                    </select>
                    <input
                      type="number"
                      value={allowForm.income || ''}
                      onChange={e => setAllowForm({ ...allowForm, income: Number(e.target.value) })}
                      placeholder="Oylik daromad"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={allowForm.exp || ''}
                      onChange={e => setAllowForm({ ...allowForm, exp: Number(e.target.value) })}
                      placeholder="Ish staji (yil)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={() => doCalc(() => setCalcResult(calcAllow(allowForm.type, allowForm.income, allowForm.exp)))}
                      disabled={calcLoading || !allowForm.type}
                      className="w-full"
                    >
                      Hisoblash
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ════════════════ DOCUMENT ANALYZER ════════════════ */}
          {tab === 'doc' && (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Hujjatni AI tahlili</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Hujjatni yuklang (PDF, DOC, TXT)</p>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                    <Upload className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-zinc-400 mb-2">{file ? file.name : 'Hujjatni yuklash uchun bosing'}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">PDF, DOC, DOCX, TXT (10 MB gacha)</p>
                    <Button variant={file ? 'default' : 'outline'} onClick={() => inputRef.current?.click()}>
                      {file ? 'Boshqa fayl' : 'Fayl tanlash'}
                    </Button>
                  </div>
                  {analysisLoading && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-center text-sm text-gray-500 dark:text-zinc-400">
                      Tahlil qilinmoqda...
                    </div>
                  )}
                  {analysis && !analysisLoading && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl whitespace-pre-wrap font-mono text-xs text-gray-800 dark:text-zinc-200">
                      {analysis}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════ LEGAL SEARCH ════════════════ */}
          {tab === 'search' && (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && doSearch()}
                        placeholder="Qonun, modda yoki kalit soz..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button onClick={doSearch} disabled={!query.trim() || searchLoading} className="flex items-center gap-2">
                      {searchLoading ? 'Qidirilmoqda...' : <><Search className="w-4 h-4" /> Qidirish</>}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      { id: '', label: 'Barchasi' },
                      { id: 'constitution', label: CODE_DISPLAY_NAMES['constitution'] },
                      { id: 'criminal_code', label: CODE_DISPLAY_NAMES['criminal_code'] },
                      { id: 'civil_code', label: CODE_DISPLAY_NAMES['civil_code'] },
                      { id: 'admin_code', label: CODE_DISPLAY_NAMES['admin_code'] },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setCodeFilter(f.id); setSearchRun(false); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          codeFilter === f.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {searchRun && (
                <div className="space-y-3">
                  {searchLoading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-zinc-400">Qidirilmoqda...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">{searchResults.length} ta natija</p>
                      {searchResults.map(({ code, article }: any, i: number) => (
                        <Link key={i} href={`/qonunlar/${code.id}`} className="block">
                          <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[10px]">
                                  {badge(code.id) || code.id}
                                </Badge>
                                <span className="font-medium text-sm text-gray-900 dark:text-white">{article.number}-modda</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-zinc-400">{article.title}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                      <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p>Topilmadi</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ TEMPLATES ════════════════ */}
          {tab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((t, i) => (
                <Card key={i} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{t.desc}</p>
                    <Badge variant="outline" className="text-[10px]">{t.cat}</Badge>
                    <div className="mt-4">
                      <Link href={`/api/templates/${t.name.toLowerCase().replace(/ /g, '-')}`} download>
                        <Button size="sm" className="w-full"><Download className="w-3 h-3 mr-1" /> Yuklab olish</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ════════════════ CASE TRACKER ════════════════ */}
          {tab === 'cases' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Case kuzatuv tizimi</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Hozircha case lar mavjud emas. Yangi case qo'shish uchun IRAC huquqiy tahlil sahifasidan foydalaning.</p>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Jarayonda', value: 0, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Tugatilgan', value: 0, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Yangi', value: 0, color: 'text-orange-600 dark:text-orange-400' },
                ].map(s => (
                  <div key={s.label} className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-center">
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ DEADLINE CALCULATOR ════════════════ */}
          {tab === 'deadline' && (
            <div className="space-y-6">
              {dlResult && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Natija:</h3>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">Oxirgi kun: {dlResult.result}</p>
                  <div className="mt-2 space-y-0.5">
                    {dlResult.details.map((d, i) => (
                      <p key={i} className="text-xs text-gray-600 dark:text-zinc-400">{d}</p>
                    ))}
                  </div>
                </div>
              )}
              <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar className="w-5 h-5 text-yellow-500" /> Muddat hisoblash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="date"
                    value={dlForm.date}
                    onChange={e => setDlForm({ ...dlForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={dlForm.type}
                    onChange={e => setDlForm({ ...dlForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ish turi</option>
                    <option value="Da'vo berish">Da'vo berish (30 kun)</option>
                    <option value="Apellyatsiya">Apellyatsiya (30 kun)</option>
                    <option value="Kassatsiya">Kassatsiya (30 kun)</option>
                    <option value="Nazorat">Nazorat (1 yil)</option>
                  </select>
                  <Button
                    onClick={() => {
                      setDlLoading(true);
                      setTimeout(() => {
                        setDlResult(calcDeadline(dlForm.date, dlForm.type));
                        setDlLoading(false);
                      }, 200);
                    }}
                    disabled={dlLoading || !dlForm.date || !dlForm.type}
                    className="w-full"
                  >
                    {dlLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ════════════════ Resources ════════════════ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Qoshimcha resurslar</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { href: '/qonunlar', icon: <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />, title: "Qonunlar bazasi", desc: "Toliq qonunlar" },
              { href: '/help', icon: <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />, title: "Qollanmalar", desc: "Yorignoma" },
              { href: '/profile', icon: <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />, title: "Sozlamalar", desc: "Profil" },
              { href: '/dashboard', icon: <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />, title: "Bosh sahifa", desc: "Dashboard" },
            ].map((r, i) => (
              <Link key={i} href={r.href}>
                <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg mr-3">{r.icon}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{r.title}</h3>
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mb-4">{r.desc}</p>
                    <Button variant="outline" size="sm" className="w-full">Ochish</Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
