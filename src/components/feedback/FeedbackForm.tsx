'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  email: string;
  userAgent: string;
  url: string;
}

export default function FeedbackForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<FeedbackData>>({
    type: 'improvement',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim() || !formData.description?.trim()) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const feedbackData: FeedbackData = {
        type: formData.type || 'improvement',
        title: formData.title.trim(),
        description: formData.description.trim(),
        email: formData.email || user?.email || '',
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          type: 'improvement',
          title: '',
          description: '',
          email: user?.email || '',
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      setError('Xatolik yuz berdi. Iltimos, qayta urining.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800';
      case 'feature': return 'bg-green-100 text-green-800';
      case 'improvement': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug': return 'Xatolik';
      case 'feature': return 'Yangi imkoniyat';
      case 'improvement': return 'Yaxshilash';
      default: return 'Boshqa';
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-center">Rahmat!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-600">
            Fikringiz uchun rahmat! Biz uni tez orada ko'rib chiqamiz va kerakli choralarni ko'ramiz.
          </p>
          <Button
            variant="outline"
            onClick={() => setSubmitted(false)}
            className="w-full"
          >
            Yangi fikr qoldirish
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Takliflar va Fikrlar</CardTitle>
        <p className="text-sm text-gray-600">
          Platformani yaxshilash uchun fikringizni biz bilan ulashing
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taklif turi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['bug', 'feature', 'improvement', 'other'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.type === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Badge className={`mb-1 ${getTypeColor(type)}`}>
                    {getTypeLabel(type)}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Sarlavha
            </label>
            <input
              id="title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Qisqa sarlavha..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Tafsilotlar
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Taklifingiz haqida batafsil ma'lumot..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (javob uchun)
            </label>
            <input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            disabled={!formData.title?.trim() || !formData.description?.trim()}
          >
            Yuborish
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Fikringiz biz uchun juda muhim. Platformani rivojlantirishda yordam bering!
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
