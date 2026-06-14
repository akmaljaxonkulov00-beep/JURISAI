'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface IRACAnalysis {
  issue: string;
  rule: string;
  application: string;
  conclusion: string;
  sources: Array<{
    title: string;
    article: string;
    url: string;
  }>;
  confidence: number;
}

export default function IRACAnalyzer() {
  const [caseText, setCaseText] = useState('');
  const [analysis, setAnalysis] = useState<IRACAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeCase = async () => {
    if (!caseText.trim()) {
      setError('Iltimos, holat matnini kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/irac-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caseText }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Tahlil qilishda xatolik yuz berdi');
      }
    } catch (error) {
      setError('Tahlil qilishda xatolik yuz berdi. Iltimos, qayta urining.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">IRAC Tahlili</CardTitle>
          <p className="text-center text-gray-600">
            Huquqiy holatni IRAC metodikasi bo'yicha tahlil qiling
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="caseText" className="block text-sm font-medium text-gray-700 mb-2">
              Holat matni
            </label>
            <textarea
              id="caseText"
              value={caseText}
              onChange={(e) => setCaseText(e.target.value)}
              placeholder="Holat haqida batafsil ma'lumotni kiriting..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            onClick={analyzeCase}
            loading={loading}
            className="w-full"
            disabled={!caseText.trim()}
          >
            Tahlil qilish
          </Button>

          {analysis && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Tahlil natijalari</h3>
                <Badge className={getConfidenceColor(analysis.confidence)}>
                  Ishonch: {analysis.confidence}%
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">I - Issue (Masala)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.issue}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">R - Rule (Qoida)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.rule}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">A - Application (Qo'llash)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.application}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">C - Conclusion (Xulosa)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.conclusion}</p>
                  </CardContent>
                </Card>
              </div>

              {analysis.sources && analysis.sources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Manbalar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.sources.map((source, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-gray-900">{source.title}</h4>
                          <p className="text-sm text-gray-600">{source.article}</p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500 text-sm"
                          >
                            To'liq matn
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setAnalysis(null)}>
                  Yangi tahlil
                </Button>
                <Button onClick={() => window.print()}>
                  Natijalarni chop etish
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
