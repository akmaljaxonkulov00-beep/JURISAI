'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Shield, 
  User, 
  Mail, 
  Lock, 
  CheckCircle, 
  ArrowLeft,
  Briefcase,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DemoLawyerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const demoLawyer = {
    email: 'lawyer@demo.com',
    password: 'demo123456',
    name: 'John Doe',
    specialization: ['Jinoyat huquqi', 'Fuqarolik huquqi'],
    experience: '5 yil',
    license: 'DEMO-001'
  };

  const createDemoLawyer = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/create-demo-lawyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Demo advokat muvaffaqiyatli yaratildi! Endi kirishingiz mumkin.');
      } else {
        setError(data.error || 'Demo advokat yaratishda xatolik yuz berdi');
      }
    } catch (error) {
      setError('Server xatosi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage('Nusxa olindi!');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/lawyer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: demoLawyer.email,
          password: demoLawyer.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info
        localStorage.setItem('currentUser', JSON.stringify({
          id: data.lawyer.id,
          email: data.lawyer.email,
          name: `${data.lawyer.firstName} ${data.lawyer.lastName}`,
          role: 'lawyer'
        }));
        
        setMessage('Muvaffaqiyatli kirdingiz! Dashboardga yo\'naltirilmoqda...');
        setTimeout(() => {
          router.push('/lawyer-dashboard');
        }, 1000);
      } else {
        setError(data.error || 'Kirishda xatolik yuz berdi');
      }
    } catch (error) {
      setError('Server xatosi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Asosiy sahifaga qaytish
          </Link>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Demo Advokat</h1>
            <p className="text-gray-600 mt-2">Platformani sinab ko'rish uchun demo advokat akkaunti</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Demo Lawyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Demo Advokat Ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{demoLawyer.name}</h3>
                  <Badge className="bg-green-100 text-green-800">Professional Advokat</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">Email</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{demoLawyer.email}</span>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(demoLawyer.email)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">Parol</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{demoLawyer.password}</span>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(demoLawyer.password)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Ixtisoslik: {demoLawyer.specialization.join(', ')}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Tajriba: {demoLawyer.experience}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-700">Litsenziya: {demoLawyer.license}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Amallar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Demo hisobining imkoniyatlari:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 2 ta demo mijoz</li>
                  <li>• 2 ta faol ish</li>
                  <li>• 2 ta kutilayotgan so'rov</li>
                  <li>• AI hujjatlar tahlili</li>
                  <li>• To'liq statistikalar</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={createDemoLawyer}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Demo advokat yaratilmoqda...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Demo Advokat Yaratish
                    </div>
                  )}
                </Button>

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Kirilmoqda...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Demo Advokat Sifatida Kirish
                    </div>
                  )}
                </Button>
              </div>

              {message && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <p className="text-green-700">{message}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-600">
                <p>Bu demo hisob platformaning barcha imkoniyatlarini ko'rish uchun mo'ljallangan.</p>
                <p className="mt-1">
                  Haqiqiy advokat sifatida ro'yxatdan o'tish uchun{' '}
                  <Link href="/lawyer-register" className="text-blue-600 hover:text-blue-700 font-medium">
                    bu yerni bosing
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
