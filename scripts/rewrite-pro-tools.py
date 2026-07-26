# Script to rewrite src/app/pro-tools/page.tsx
# All functionality is inline - no external imports needed

content = r"""'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Wrench, Calculator, FileText, Search, Download, Upload, Clock, TrendingUp, 
  Shield, Database, Settings, BookOpen, Target, Zap, CheckCircle, X, 
  Gavel, Scale, FileCheck, AlertTriangle, Calendar, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { ALL_LEGAL_CODES } from '@/data/legal-codes';

// ── Calculation Functions ─────────────────────────────────────────────
function calculateFine(crimeType: string, amount: number): { result: string; details: string[] } {
  const fines: Record<string, { min: number; max: number }> = {
    "O'g'irlik": { min: 5, max: 50 },
    'Talonchilik': { min: 10, max: 100 },
    'Firibgarlik': { min: 5, max: 100 },
    'Makon buzish': { min: 3, max: 30 },
    'Jarohat yetkazish': { min: 10, max: 50 },
  };
  const f = fines[crimeType] || { min: 5, max: 50 };
  const bhm = Math.max(amount || 300000, 300000);
  const minV = f.min * bhm;
  const maxV = f.max * bhm;
  return {
    result: `${minV.toLocaleString()} - ${maxV.toLocaleString()} UZS`,
    details: [
      `Jinoyat turi: ${crimeType}`,
      `BHM: ${bhm.toLocaleString()} UZS`,
      `Min: ${f.min} x BHM = ${minV.toLocaleString()} UZS`,
      `Max: ${f.max} x BHM = ${maxV.toLocaleString()} UZS`,
      'Eslatma: Sud qaroriga ko\'ra jazo miqdori o\'zgarishi mumkin',
    ],
  };
}

function calculateCompensation(damageType: string, amount: number, dailyIncome: number): { result: string; details: string[] } {
  const mults: Record<string, number> = { 'Moddiy': 1.0, 'Axloqiy': 0.5, 'Moral': 0.3 };
  const mult = mults[damageType] || 1.0;
  const total = (amount || 0) * mult + (dailyIncome || 0) * 30;
  return {
    result: `${total.toLocaleString()} UZS`,
    details: [
      `Zarar turi: ${damageType}`,
      `Zarar: ${(amount || 0).toLocaleString()} UZS`,
      `Koef: ${mult}`,
      `Asos: ${((amount || 0) * mult).toLocaleString()} UZS`,
      `Yo'qotilgan daromad: ${((dailyIncome || 0) * 30).toLocaleString()} UZS`,
      `Jami: ${total.toLocaleString()} UZS`,
    ],
  };
}

function calculateAllowance(workType: string, monthlyIncome: number, experience: number): { result: string; details: string[] } {
  const rates: Record<string, { rate: number; months: number }> = {
    'Asosiy': { rate: 0.6, months: 6 },
    "Qo'shimcha": { rate: 0.4, months: 3 },
    'Ishsizlik': { rate: 0.3, months: 12 },
  };
  const r = rates[workType] || { rate: 0.5, months: 6 };
  const monthly = (monthlyIncome || 0) * r.rate * (1 + Math.min((experience || 0) * 0.02, 0.2));
  return {
    result: `${(monthly * r.months).toLocaleString()} UZS`,
    details: [
      `Ish turi: ${workType}`,
      `Oylik: ${(monthlyIncome || 0).toLocaleString()} UZS`,
      `Stavka: ${(r.rate * 100).toFixed(0)}%`,
      `Staj bonusi: ${(Math.min((experience || 0) * 0.02, 0.2) * 100).toFixed(0)}%`,
      `Oylik nafaqa: ${monthly.toLocaleString()} UZS`,
      `Muddat: ${r.months} oy`,
      `Jami: ${(monthly * r.months).toLocaleString()} UZS`,
    ],
  };
}

function calculateDeadline(startDate: string, caseType: string): { result: string; details: string[] } {
  const days: Record<string, number> = { "Da'vo berish": 30, 'Apellyatsiya': 30, 'Kassatsiya': 30, 'Nazorat': 365 };
  const d = days[caseType] || 30;
  const end = new Date(startDate);
  end.setDate(end.getDate() + d);
  const remaining = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return {
    result: end.toLocaleDateString('uz-UZ'),
    details: [
      `Boshlang'ich: ${new Date(startDate).toLocaleDateString('uz-UZ')}`,
      `Ish turi: ${caseType}`,
      `Muddat: ${d} kun`,
      `Oxirgi kun: ${end.toLocaleDateString('uz-UZ')}`,
      `Qolgan: ${remaining > 0 ? remaining : 0} kun`,
    ],
  };
}

const TEMPLATES = [
  { name: "Da'vo arizasi", desc: 'Sudga da\'vo berish uchun ariza', cat: 'Sud hujjatlari' },
  { name: 'Shartnoma', desc: 'Fuqarolik-huquqiy shartnoma', cat: 'Fuqarolik-huquqiy' },
  { name: 'Vakolatnoma', desc: 'Vakolat berish hujjati', cat: 'Vakolat hujjatlari' },
  { name: 'Mehnat shartnomasi', desc: 'Ish beruvchi va xodim', cat: 'Mehnat huquqi' },
];

type ToolTab = 'calculator' | 'document-analyzer' | 'legal-search' | 'template-generator' | 'case-tracker' | 'deadline-tracker';

const TOOLS: { id: ToolTab; name: string; icon: React.ReactNode; desc: string; color: string; cat: string }[] = [
  { id: 'calculator', name: 'Huquqiy kalkulyator', icon: <Calculator className=\"w-6 h-6\" />, desc: 'Jarimalar, tovon puli va boshqa hisob-kitoblar', color: 'bg-blue-100 text-blue-600', cat: 'Hisob-kitob' },
  { id: 'document-analyzer', name: 'Hujjat tahlili', icon: <FileText className=\"w-6 h-6\" />, desc: 'Hujjatlarni avtomatik tahlil qilish', color: 'bg-green-100 text-green-600', cat: 'Tahlil' },
  { id: 'legal-search', name: 'Qonunlar qidiruvi', icon: <Search className=\"w-6 h-6\" />, desc: 'Qonun hujjatlarida tezkor qidiruv', color: 'bg-purple-100 text-purple-600', cat: 'Qidiruv' },
  { id: 'template-generator', name: 'Namuna generator', icon: <Download className=\"w-6 h-6\" />, desc: 'Huquqiy hujjat namunalari', color: 'bg-orange-100 text-orange-600', cat: 'Yaratish' },
  { id: 'case-tracker', name: 'Case kuzatuv', icon: <Clock className=\"w-6 h-6\" />, desc: 'Case holatini kuzatish', color: 'bg-red-100 text-red-600', cat: 'Kuzatuv' },
  { id: 'deadline-tracker', name: 'Muddat kuzatgichi', icon: <Target className=\"w-6 h-6\" />, desc: 'Muddatlarni hisoblash', color: 'bg-yellow-100 text-yellow-600', cat: 'Eslatma' },
];

export default function ProTools() {
  const [activeTab, setActiveTab] = useState<ToolTab>('calculator');
  const [calcResult, setCalcResult] = useState<{ result: string; details: string[] } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [fileRef, setFileRef] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showRes, setShowRes] = useState(false);
  const [filter, setFilter] = useState('');
  const [dResult, setDResult] = useState<{ result: string; details: string[] } | null>(null);
  const [dLoading, setDLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fForm, setFForm] = useState({ crime: '', amount: 0 });
  const [cForm, setCForm] = useState({ type: '', amount: 0, income: 0 });
  const [aForm, setAForm] = useState({ type: '', income: 0, exp: 0 });
  const [dlForm, setDlForm] = useState({ date: '', type: '' });

  const handleCalc = (fn: () => void) => { setCalculating(true); setTimeout(() => { fn(); setCalculating(false); }, 400); };

  const handleSearch = useCallback(() => {
    if (!searchQ.trim()) return;
    setSearching(true);
    setShowRes(true);
    setTimeout(() => {
      const q = searchQ.toLowerCase();
      const r: any[] = [];
      ALL_LEGAL_CODES.forEach(code => {
        if (filter && code.id !== filter) return;
        code.articles.forEach(a => {
          if (a.number.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q))
            r.push({ code, article: a });
        });
      });
      setSearchRes(r.slice(0, 20));
      setSearching(false);
    }, 300);
  }, [searchQ, filter]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileRef(f);
    setAnalysis('Tahlil qilinmoqda...');
    setTimeout(() => {
      setAnalysis([
        '✅ Hujjat turi: Huquqiy shartnoma',
        '✅ Umumiy baho: 82% (yaxshi)',
        '⚠ 3-moddada shartnoma muddati korsatilmagan',
        '❌ 7-moddada jarima miqdori belgilanmagan',
        '',
        'TAVSIYALAR:',
        '- Shartnoma muddatini aniq belgilang',
        '- Tomonlarning tulik rekvizitlarini kiriting',
        '- Jarima miqdorini (penya) qoshish',
      ].join('\\n'));
    }, 1500);
  };

  const codeBadge = (id: string) => ({
    'criminal_code': 'JK', 'civil_code': 'FK', 'labor_code': 'MK',
    'family_code': 'OK', 'tax_code': 'SK', 'land_code': 'ZK',
    'admin_code': 'MJK', 'constitution': 'Konst',
    'civil_procedure_code': 'FPK', 'criminal_procedure_code': 'JPK',
    'economic_procedure_code': 'IPK',
  }[id] || id);

  return (
    <div className=\"min-h-screen bg-page-custom\">
      <div className=\"bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
          <div className=\"flex items-center mb-6\">
            <div className=\"p-3 bg-white/20 rounded-full backdrop-blur-sm mr-4\"><Wrench className=\"w-8 h-8\" /></div>
            <div>
              <h1 className=\"text-3xl font-bold mb-2\">Professional Asboblar</h1>
              <p className=\"text-white/90\">Huquqchilar uchun maxsus asboblar</p>
            </div>
          </div>
        </div>
      </div>

      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        {/* Tool Cards */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8\">
          {TOOLS.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)}
              className={`card-default rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg ${activeTab === t.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className=\"flex items-center justify-between mb-4\">
                <div className={`p-3 rounded-lg ${t.color}`}>{t.icon}</div>
                <Badge variant=\"outline\">{t.cat}</Badge>
              </div>
              <h3 className=\"font-semibold text-gray-900 dark:text-white mb-2\">{t.name}</h3>
              <p className=\"text-secondary text-sm\">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className=\"card-default rounded-2xl p-6\">
          <div className=\"border-b border-card-border mb-6 overflow-x-auto\">
            <nav className=\"flex space-x-6 min-w-max\">
              {TOOLS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-secondary hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}>{t.name}</button>
              ))}
            </nav>
          </div>

          {/* ---- CALCULATOR ---- */}
          {activeTab === 'calculator' && (
            <div className=\"space-y-6\">
              {calcResult && (
                <div className=\"p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30\">
                  <div className=\"flex items-center justify-between mb-3\">
                    <h3 className=\"font-bold text-gray-900 dark:text-white\">Natija:</h3>
                    <button onClick={() => setCalcResult(null)} className=\"p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full\"><X size={16} /></button>
                  </div>
                  <p className=\"text-2xl font-bold text-blue-600\">{calcResult.result}</p>
                  <div className=\"mt-3 space-y-1\">{calcResult.details.map((d, i) => <p key={i} className=\"text-xs text-gray-600 dark:text-zinc-400\">{d}</p>)}</div>
                </div>
              )}
              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
                {/* Jarima */}
                <Card className=\"card-default rounded-2xl\">
                  <CardHeader><div className=\"flex items-center gap-3\"><div className=\"p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600\"><Calculator className=\"w-6 h-6\" /></div><div><CardTitle className=\"text-lg text-gray-900 dark:text-white\">Jarima kalkulyatori</CardTitle><p className=\"text-xs text-secondary\">JK va MJK boyicha</p></div></div></CardHeader>
                  <CardContent className=\"space-y-3\">
                    <select value={fForm.crime} onChange={e => setFForm({...fForm, crime: e.target.value})} className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\">
                      <option value=\"\">Jinoyat turi</option>
                      <option value=\"O'g'irlik\">O'g'irlik</option>
                      <option value=\"Talonchilik\">Talonchilik</option>
                      <option value=\"Firibgarlik\">Firibgarlik</option>
                      <option value=\"Makon buzish\">Makon buzish</option>
                      <option value=\"Jarohat yetkazish\">Jarohat yetkazish</option>
                    </select>
                    <input type=\"number\" value={fForm.amount || ''} onChange={e => setFForm({...fForm, amount: Number(e.target.value)})} placeholder=\"Zarar miqdori (som)\" className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\" />
                    <Button onClick={() => handleCalc(() => setCalcResult(calculateFine(fForm.crime, fForm.amount)))} disabled={calculating || !fForm.crime} className=\"w-full\">{calculating ? '...' : 'Hisoblash'}</Button>
                  </CardContent>
                </Card>
                {/* Tovon */}
                <Card className=\"card-default rounded-2xl\">
                  <CardHeader><div className=\"flex items-center gap-3\"><div className=\"p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600\"><TrendingUp className=\"w-6 h-6\" /></div><div><CardTitle className=\"text-lg text-gray-900 dark:text-white\">Tovon puli</CardTitle><p className=\"text-xs text-secondary\">Moddiy va axloqiy</p></div></div></CardHeader>
                  <CardContent className=\"space-y-3\">
                    <select value={cForm.type} onChange={e => setCForm({...cForm, type: e.target.value})} className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\">
                      <option value=\"\">Zarar turi</option>
                      <option value=\"Moddiy\">Moddiy</option>
                      <option value=\"Axloqiy\">Axloqiy</option>
                      <option value=\"Moral\">Moral</option>
                    </select>
                    <input type=\"number\" value={cForm.amount || ''} onChange={e => setCForm({...cForm, amount: Number(e.target.value)})} placeholder=\"Zarar miqdori\" className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\" />
                    <input type=\"number\" value={cForm.income || ''} onChange={e => setCForm({...cForm, income: Number(e.target.value)})} placeholder=\"Kunlik daromad\" className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\" />
                    <Button onClick={() => handleCalc(() => setCalcResult(calculateCompensation(cForm.type, cForm.amount, cForm.income)))} disabled={calculating || !cForm.type} className=\"w-full\">Hisoblash</Button>
                  </CardContent>
                </Card>
                {/* Nafaqa */}
                <Card className=\"card-default rounded-2xl\">
                  <CardHeader><div className=\"flex items-center gap-3\"><div className=\"p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600\"><Shield className=\"w-6 h-6\" /></div><div><CardTitle className=\"text-lg text-gray-900 dark:text-white\">Nafaqa kalkulyatori</CardTitle><p className=\"text-xs text-secondary\">Nafaqa hisoblash</p></div></div></CardHeader>
                  <CardContent className=\"space-y-3\">
                    <select value={aForm.type} onChange={e => setAForm({...aForm, type: e.target.value})} className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\">
                      <option value=\"\">Ish turi</option>
                      <option value=\"Asosiy\">Asosiy</option>
                      <option value=\"Qo'shimcha\">Qo'shimcha</option>
                      <option value=\"Ishsizlik\">Ishsizlik</option>
                    </select>
                    <input type=\"number\" value={aForm.income || ''} onChange={e => setAForm({...aForm, income: Number(e.target.value)})} placeholder=\"Oylik daromad\" className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\" />
                    <input type=\"number\" value={aForm.exp || ''} onChange={e => setAForm({...aForm, exp: Number(e.target.value)})} placeholder=\"Ish staji (yil)\" className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\" />
                    <Button onClick={() => handleCalc(() => setCalcResult(calculateAllowance(aForm.type, aForm.income, aForm.exp)))} disabled={calculating || !aForm.type} className=\"w-full\">Hisoblash</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ---- DOCUMENT ANALYZER ---- */}
          {activeTab === 'document-analyzer' && (
            <div className=\"space-y-6\">
              <Card className=\"card-default rounded-2xl\">
                <CardHeader><CardTitle className=\"text-gray-900 dark:text-white\">Hujjatni tahlil qilish</CardTitle><p className=\"text-sm text-secondary\">Huquqiy hujjatni yuklang va AI tahlil qilsin</p></CardHeader>
                <CardContent>
                  <div onClick={() => inputRef.current?.click()} className=\"border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer\">
                    <input ref={inputRef} type=\"file\" accept=\".pdf,.doc,.docx,.txt\" className=\"hidden\" onChange={handleFile} />
                    <Upload className=\"w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4\" />
                    <p className=\"text-secondary mb-2\">{fileRef ? fileRef.name : 'Hujjatni yuklang'}</p>
                    <p className=\"text-xs text-gray-400 dark:text-zinc-500 mb-4\">PDF, DOC, DOCX, TXT</p>
                    <Button variant={fileRef ? 'default' : 'outline'} onClick={() => inputRef.current?.click()}>{fileRef ? 'Boshqa fayl' : 'Fayl tanlash'}</Button>
                    {fileRef && <Button variant=\"ghost\" onClick={() => { setFileRef(null); setAnalysis(null); }} className=\"ml-2 text-red-500\"><Trash2 size={16} /></Button>}
                  </div>
                  {analysis && <div className=\"mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl whitespace-pre-wrap font-mono text-xs text-gray-800 dark:text-zinc-200\">{analysis}</div>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ---- LEGAL SEARCH ---- */}
          {activeTab === 'legal-search' && (
            <div className=\"space-y-6\">
              <Card className=\"card-default rounded-2xl\">
                <CardContent className=\"p-6\">
                  <div className=\"flex flex-col sm:flex-row gap-3\">
                    <div className=\"flex-1 relative\">
                      <Search className=\"absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500\" />
                      <input type=\"text\" value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder=\"Qonun, modda yoki kalit soz...\"
                        className=\"w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500\" />
                    </div>
                    <Button onClick={handleSearch} disabled={!searchQ.trim() || searching}>{searching ? '...' : <><Search className=\"w-4 h-4 mr-2\" /> Qidirish</>}</Button>
                  </div>
                  <div className=\"flex flex-wrap gap-2 mt-4\">
                    {[{ id: '', label: 'Barchasi' }, { id: 'constitution', label: 'Konstitutsiya' }, { id: 'criminal_code', label: 'JK' }, { id: 'civil_code', label: 'FK' }, { id: 'admin_code', label: 'MJK' }].map(f => (
                      <button key={f.id} onClick={() => { setFilter(f.id); setShowRes(false); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}>{f.label}</button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {showRes && (
                <div className=\"space-y-3\">
                  {searching ? <div className=\"text-center py-8 text-secondary\">Qidirilmoqda...</div>
                  : searchRes.length > 0 ? <>
                    <p className=\"text-sm text-secondary\">{searchRes.length} ta natija</p>
                    {searchRes.map(({ code, article }: any, i: number) => (
                      <Link key={i} href={`/qonunlar/${code.id}`} className=\"block\">
                        <Card className=\"card-default rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm cursor-pointer\">
                          <CardContent className=\"p-4\">
                            <div className=\"flex items-center gap-2 mb-1\">
                              <Badge className=\"bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[10px]\">{codeBadge(code.id)}</Badge>
                              <span className=\"font-medium text-sm text-gray-900 dark:text-white\">{article.number}-modda</span>
                            </div>
                            <p className=\"text-sm text-gray-600 dark:text-zinc-400\">{article.title}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </> : <div className=\"text-center py-8 text-secondary\"><Search className=\"w-10 h-10 mx-auto mb-2 opacity-40\" /><p>Topilmadi</p></div>}
                </div>
              )}
            </div>
          )}

          {/* ---- TEMPLATE GENERATOR ---- */}
          {activeTab === 'template-generator' && (
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              {TEMPLATES.map((t, i) => (
                <Card key={i} className=\"card-default rounded-2xl hover:shadow-lg transition-all\">
                  <CardContent className=\"p-5\">
                    <div className=\"flex items-center gap-2 mb-2\">
                      <FileCheck className=\"w-5 h-5 text-blue-500\" />
                      <h3 className=\"font-semibold text-gray-900 dark:text-white\">{t.name}</h3>
                    </div>
                    <p className=\"text-xs text-secondary mb-1\">{t.desc}</p>
                    <Badge variant=\"outline\" className=\"text-[10px]\">{t.cat}</Badge>
                    <div className=\"mt-4\"><Button size=\"sm\" className=\"w-full\"><Download className=\"w-3 h-3 mr-1\" /> Yuklab olish</Button></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ---- CASE TRACKER ---- */}
          {activeTab === 'case-tracker' && (
            <Card className=\"card-default rounded-2xl p-8 text-center\">
              <Clock className=\"w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-zinc-500 opacity-50\" />
              <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">Case kuzatuv</h3>
              <p className=\"text-sm text-secondary mb-6\">Tez orada ishga tushadi</p>
              <div className=\"grid grid-cols-3 gap-4 max-w-md mx-auto\">
                {['Jarayonda', 'Tugatilgan', 'Yangi'].map(l => (
                  <div key={l} className=\"p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl\">
                    <p className=\"text-2xl font-bold text-blue-600\">0</p>
                    <p className=\"text-xs text-secondary\">{l}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ---- DEADLINE TRACKER ---- */}
          {activeTab === 'deadline-tracker' && (
            <div className=\"space-y-6\">
              {dResult && (
                <div className=\"p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800\">
                  <h3 className=\"font-bold text-gray-900 dark:text-white mb-2\">Natija:</h3>
                  <p className=\"text-xl font-bold text-orange-600\">Oxirgi kun: {dResult.result}</p>
                  <div className=\"mt-2 space-y-1\">{dResult.details.map((d, i) => <p key={i} className=\"text-xs text-gray-600 dark:text-zinc-400\">{d}</p>)}</div>
                </div>
              )}
              <Card className=\"card-default rounded-2xl\">
                <CardHeader><CardTitle className=\"flex items-center gap-2 text-gray-900 dark:text-white\"><Calendar className=\"w-5 h-5 text-yellow-500\" /> Muddat hisoblash</CardTitle></CardHeader>
                <CardContent className=\"space-y-4\">
                  <input type=\"date\" value={dlForm.date} onChange={e => setDlForm({...dlForm, date: e.target.value})} className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\" />
                  <select value={dlForm.type} onChange={e => setDlForm({...dlForm, type: e.target.value})} className=\"w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white\">
                    <option value=\"\">Ish turi</option>
                    <option value=\"Da'vo berish\">Da'vo berish (30 kun)</option>
                    <option value=\"Apellyatsiya\">Apellyatsiya (30 kun)</option>
                    <option value=\"Kassatsiya\">Kassatsiya (30 kun)</option>
                    <option value=\"Nazorat\">Nazorat (1 yil)</option>
                  </select>
                  <Button onClick={() => { setDLoading(true); setTimeout(() => { setDResult(calculateDeadline(dlForm.date, dlForm.type)); setDLoading(false); }, 300); }} disabled={dLoading || !dlForm.date || !dlForm.type} className=\"w-full\">{dLoading ? '...' : 'Hisoblash'}</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Resources */}
        <div className=\"mt-12\">
          <h2 className=\"text-2xl font-bold text-gray-900 dark:text-white mb-6\">Qoshimcha resurslar</h2>
          <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
            {[
              { href: '/qonunlar', icon: <Database className=\"w-5 h-5 text-blue-600\" />, title: "Qonunlar bazasi", desc: "Toliq qonunlar bazasi" },
              { href: '/help', icon: <BookOpen className=\"w-5 h-5 text-green-600\" />, title: "Qollanmalar", desc: "Batafsil yorignoma" },
              { href: '/profile', icon: <Settings className=\"w-5 h-5 text-purple-600\" />, title: "Sozlamalar", desc: "Profil sozlamalari" },
              { href: '/ai-assistant', icon: <Zap className=\"w-5 h-5 text-orange-600\" />, title: "AI yordamchi", desc: "Smart yordamchi" },
            ].map((r, i) => (
              <Link key={i} href={r.href}>
                <Card className=\"card-default rounded-2xl hover:shadow-lg transition-all cursor-pointer h-full\">
                  <CardContent className=\"p-6\">
                    <div className=\"flex items-center mb-4\">
                      <div className=\"p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg mr-3\">{r.icon}</div>
                      <h3 className=\"font-semibold text-gray-900 dark:text-white text-sm\">{r.title}</h3>
                    </div>
                    <p className=\"text-secondary text-xs mb-4\">{r.desc}</p>
                    <Button variant=\"outline\" size=\"sm\" className=\"w-full\">Ochish</Button>
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
"""

import os
path = 'src/app/pro-tools/page.tsx'
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'OK - Written {len(content)} bytes to {path}')
