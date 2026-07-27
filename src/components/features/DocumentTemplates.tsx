'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Download, FileText, X, Printer, Copy, CheckCircle,
  FileSignature, Scale, Heart, UserCheck, Briefcase, Users, Mail, DollarSign,
  FileSpreadsheet, ArrowLeft, Upload, Eye, Edit3, Zap, Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DocumentTemplate, TEMPLATE_CATEGORIES, DOCUMENT_TEMPLATES as FALLBACK_TEMPLATES } from '@/data/document-templates';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'sud': <Scale className="w-4 h-4" />,
  'da\'vo': <FileText className="w-4 h-4" />,
  'shartnoma': <FileSignature className="w-4 h-4" />,
  'mehnat': <Briefcase className="w-4 h-4" />,
  'vakolat': <UserCheck className="w-4 h-4" />,
  'majlis': <Users className="w-4 h-4" />,
  'xat': <Mail className="w-4 h-4" />,
  'moliya': <DollarSign className="w-4 h-4" />,
};

function getCategoryName(cat: string): string {
  const found = TEMPLATE_CATEGORIES.find(c => c.id === cat);
  return found ? found.name : cat;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

export default function DocumentTemplates() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'TXT' | 'DOCX' | 'PDF'>('TXT');
  const [allTemplates, setAllTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [aiEditing, setAiEditing] = useState(false);
  const [aiEditContent, setAiEditContent] = useState('');
  const aiPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load templates from API with fallback to hardcoded data
  const loadTemplates = () => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.templates && data.templates.length > 0) {
          setAllTemplates(data.templates);
        } else {
          setAllTemplates(FALLBACK_TEMPLATES);
        }
      })
      .catch(() => {
        // API unavailable — use hardcoded fallback
        setAllTemplates(FALLBACK_TEMPLATES);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
    // Poll every 30s for updates (admin changes)
    aiPollRef.current = setInterval(loadTemplates, 30_000);
    return () => {
      if (aiPollRef.current) clearInterval(aiPollRef.current);
    };
  }, []);

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    const source = allTemplates.length > 0 ? allTemplates : [];
    let list = activeCategory === 'all'
      ? source
      : source.filter(t => t.category === activeCategory);

    // Apply format filter
    if (formatFilter !== 'all') {
      list = list.filter(t => t.format === formatFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.includes(q))
      );
    }
    return list;
  }, [query, activeCategory, formatFilter]);

  // Group filtered templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, DocumentTemplate[]> = {};
    filteredTemplates.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  // Count templates per category
  const categoryCounts = useMemo(() => {
    const source = allTemplates.length > 0 ? allTemplates : [];
    const counts: Record<string, number> = { all: source.length };
    source.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [allTemplates]);

  // Download template
  const downloadTemplate = (template: DocumentTemplate, format: 'TXT' | 'DOCX' | 'PDF' = 'TXT') => {
    let content = template.content;
    let mimeType = 'text/plain;charset=utf-8';
    let extension = 'txt';

    if (format === 'DOCX') {
      // For DOCX, create a simple XML-based document
      const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:h-ansi="Times New Roman"/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(template.name)}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:h-ansi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(template.description)}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:h-ansi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>Qonuniy asos: ${escapeXml(template.lawRef || '—')}</w:t></w:r></w:p>
    <w:p/>
    ${content.split('\n').filter(l => l.trim()).map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('---')) return '';
      return `<w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:h-ansi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(trimmed)}</w:t></w:r></w:p>`;
    }).join('\n')}
  </w:body>
</w:wordDocument>`;
      content = docxContent;
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    } else if (format === 'PDF') {
      // Simple text PDF
      const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 44>>stream
BT /F1 12 Tf 50 750 Td (PDF versiyasi) Tj ET
endstream
endobj
xref
0 6
...
trailer<</Size 6/Root 1 0 R>>
startxref
179
%%EOF`;
      content = pdfContent;
      mimeType = 'application/pdf';
      extension = 'pdf';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Print template
  const printTemplate = (template: DocumentTemplate) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${template.name}</title>
      <style>body{font-family:'Times New Roman',serif;padding:40px;line-height:1.6;font-size:14px}
      h1{text-align:center;margin-bottom:20px}
      .meta{color:#666;font-size:12px;margin-bottom:30px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6}</style>
      </head><body>
      <h1>${template.name}</h1>
      <div class="meta">${template.description} | ${template.lawRef || ''}</div>
      <pre>${template.content}</pre>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── AI Edit Modal ──
  if (aiEditing && selectedTemplate) {
    const t = selectedTemplate;
    return (
      <div className="space-y-6">
        <button
          onClick={() => { setAiEditing(false); setAiEditContent(''); }}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Tahrirni bekor qilish
        </button>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI yordamida tahrirlash</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Quyidagi matnni o'z ehtiyojingizga qarab tahrir qiling. Matnni o'zgartirish, qo'shimchalar kiritish yoki formatlash mumkin. 
                Tugatgach "Yuklab olish" tugmasini bosing.
              </p>
            </div>
          </div>
          <div className="p-6">
            <textarea
              value={aiEditContent}
              onChange={(e) => setAiEditContent(e.target.value)}
              className="w-full h-[500px] p-4 text-sm font-mono leading-relaxed border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
              spellCheck={true}
            />
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Yuklab olish formati:</span>
              <div className="flex gap-1">
                {(['TXT', 'DOCX', 'PDF'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setDownloadFormat(fmt)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      downloadFormat === fmt
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => copyContent(aiEditContent)} className="flex items-center gap-1">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Nusxalandi' : 'Nusxa olish'}
              </Button>
              <Button size="sm" onClick={() => {
                const blob = new Blob([aiEditContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${t.id}_tahrirlangan.${downloadFormat === 'DOCX' ? 'docx' : downloadFormat === 'PDF' ? 'pdf' : 'txt'}`;
                a.click();
                URL.revokeObjectURL(url);
              }} className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                <Download className="w-3.5 h-3.5" /> Tahrirlanganni yuklab olish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Detail/Preview View ──
  if (selectedTemplate) {
    const t = selectedTemplate;
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedTemplate(null)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Namunalar ro'yxatiga qaytish
        </button>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {getCategoryName(t.category)}
                  </Badge>
                  <Badge variant="outline">{t.format}</Badge>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">{t.size}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.name}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t.description}</p>
                {t.lawRef && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    <span className="font-medium">Qonuniy asos:</span> {t.lawRef}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-zinc-500">
                  <span>{t.downloads.toLocaleString()} ta yuklab olingan</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => copyContent(t.content)} className="flex items-center gap-1">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Nusxalandi' : 'Nusxa olish'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => printTemplate(t)} className="flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Chop etish
                </Button>
                <Button size="sm" onClick={() => {
                  setAiEditContent(t.content);
                  setAiEditing(true);
                }} className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md">
                  <Edit3 className="w-3.5 h-3.5" /> Matnni tahrirlash
                </Button>
              </div>
            </div>
          </div>

          {/* Format selector + download */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">Yuklab olish formati:</span>
              <div className="flex gap-1">
                {(['TXT', 'DOCX', 'PDF'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setDownloadFormat(fmt)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      downloadFormat === fmt
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={() => downloadTemplate(t, downloadFormat)} className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> {downloadFormat} yuklab olish
            </Button>
          </div>

          {/* Content preview */}
          <div className="p-6">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 overflow-x-auto">
              <div className="max-w-none">
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-zinc-700">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white text-center">{t.name.toUpperCase()}</h4>
                </div>
                <pre className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif">
                  {t.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">Hujjatlar yuklanmoqda...</p>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Hujjat nomi, tavsifi yoki teg bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-zinc-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Barchasi ({categoryCounts['all'] || 0})
        </button>
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            {CATEGORY_ICONS[cat.id] || <FileText className="w-3.5 h-3.5" />}
            {cat.name} ({categoryCounts[cat.id] || 0})
          </button>
        ))}
      </div>

      {/* Format filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFormatFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
            formatFilter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Barcha formatlar
        </button>
        {['TXT', 'DOCX', 'PDF'].map(fmt => (
          <button
            key={fmt}
            onClick={() => setFormatFilter(fmt)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
              formatFilter === fmt
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Results */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium">Hujjat topilmadi</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Boshqa kalit so'z bilan urinib ko'ring</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {filteredTemplates.length} ta hujjat topildi
          </p>

          {/* Grouped by category */}
          {Object.entries(groupedTemplates).map(([cat, templates]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  {CATEGORY_ICONS[cat] || <FileText className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{getCategoryName(cat)}</h3>
                <span className="text-xs text-gray-400 dark:text-zinc-500">({templates.length} ta)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {templates.map(t => (
                  <Card
                    key={t.id}
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:shadow-lg transition-all hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer group"
                    onClick={() => setSelectedTemplate(t)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2">
                            {t.name}
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{t.format}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3">{t.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-zinc-500">
                          <span>{t.size}</span>
                          <span>•</span>
                          <span>{t.downloads} yuklama</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadTemplate(t, 'TXT'); }}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            title="Yuklab olish"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t); }}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                            title="Ko'rish"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
