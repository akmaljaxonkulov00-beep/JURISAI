'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Award, 
  FileText, 
  Shield, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Upload,
  MapPin,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LawyerRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: string[];
  experience: number;
  officeAddress: string;
  education: string;
  barAssociation: string;
  bio: string;
  website?: string;
  linkedin?: string;
}

export default function LawyerRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);
  
  const [formData, setFormData] = useState<LawyerRegistration>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialization: [],
    experience: 0,
    officeAddress: '',
    education: '',
    barAssociation: '',
    bio: '',
    website: '',
    linkedin: ''
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const specializations = [
    'Jinoyat huquqi',
    'Fuqarolik huquqi',
    'Oilaviy huquq',
    'Mehnat huquqi',
    'Soliq huquqi',
    'Tijorat huquqi',
    'Mulk huquqi',
    'Intellektual mulk huquqi',
    'Xalqaro huquq',
    'Bankrotlik huquqi'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Ism kiritilishi shart';
      if (!formData.lastName.trim()) newErrors.lastName = 'Familiya kiritilishi shart';
      if (!formData.email.trim()) newErrors.email = 'Email kiritilishi shart';
      if (!formData.phone.trim()) newErrors.phone = 'Telefon raqami kiritilishi shart';
    }

    if (step === 2) {
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'Litsenziya raqami kiritilishi shart';
      if (formData.specialization.length === 0) newErrors.specialization = 'Kamida bitta ixtisoslik tanlanishi shart';
      if (!formData.education.trim()) newErrors.education = 'Ma\'lumot kiritilishi shart';
      if (!formData.barAssociation.trim()) newErrors.barAssociation = 'Advokatlar palatasi kiritilishi shart';
    }

    if (step === 3) {
      if (!formData.officeAddress.trim()) newErrors.officeAddress = 'Ofis manzili kiritilishi shart';
      if (!formData.bio.trim()) newErrors.bio = 'Bio kiritilishi shart';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSpecializationToggle = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter(s => s !== spec)
        : [...prev.specialization, spec]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/lawyer-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to lawyer dashboard
        router.push('/lawyer-dashboard');
      } else {
        setErrors({ submit: data.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi' });
      }
    } catch (error) {
      setErrors({ submit: 'Server xatosi. Iltimos, qayta urinib ko\'ring.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Shaxsiy ma\'lumotlar</h2>
        <p className="text-gray-600">Asosiy shaxsiy ma\'lumotlaringizni kiriting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ism</label>
          <Input
            placeholder="Ismingiz"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Familiya</label>
          <Input
            placeholder="Familiyangiz"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
          <Input
            placeholder="+998 XX XXX XX XX"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Kasbiy ma\'lumotlar</h2>
        <p className="text-gray-600">Advokatlik faoliyati haqida ma\'lumot</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Litsenziya raqami</label>
          <Input
            placeholder="Advokat litsenziyasi raqami"
            value={formData.licenseNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
            className={errors.licenseNumber ? 'border-red-500' : ''}
          />
          {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ixtisosliklar</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => handleSpecializationToggle(spec)}
                className={`p-2 text-sm rounded-lg border transition-all ${
                  formData.specialization.includes(spec)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
          {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tajriba (yil)</label>
            <Input
              type="number"
              placeholder="Tajriba yillari"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Advokatlar palatasi</label>
            <Input
              placeholder="Qaysi palataga a\'zo"
              value={formData.barAssociation}
              onChange={(e) => setFormData(prev => ({ ...prev, barAssociation: e.target.value }))}
              className={errors.barAssociation ? 'border-red-500' : ''}
            />
            {errors.barAssociation && <p className="text-red-500 text-sm mt-1">{errors.barAssociation}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ma\'lumot</label>
          <Input
            placeholder="Oliy ma\'lumot, universitet"
            value={formData.education}
            onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
            className={errors.education ? 'border-red-500' : ''}
          />
          {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ish faoliyati</h2>
        <p className="text-gray-600">Ofis va qo\'shimcha ma\'lumotlar</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ofis manzili</label>
          <Input
            placeholder="To\'liq ofis manzili"
            value={formData.officeAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, officeAddress: e.target.value }))}
            className={errors.officeAddress ? 'border-red-500' : ''}
          />
          {errors.officeAddress && <p className="text-red-500 text-sm mt-1">{errors.officeAddress}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            placeholder="O\'zingiz haqingizda qisqacha ma\'lumot..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          />
          {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Veb-sayt (ixtiyoriy)</label>
            <Input
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn (ixtiyoriy)</label>
            <Input
              placeholder="LinkedIn profil"
              value={formData.linkedin}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Asosiy sahifaga qaytish
          </Link>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Advokat ro\'yxatdan o\'tishi</h1>
            <p className="text-gray-600 mt-2">JURISAI platformasiga professional advokat sifatida qo\'shiling</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-full h-1 mx-2 ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {errors.submit && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Orqaga
                </Button>

                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Keyingi
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Yuborilmoqda...' : 'Ro\'yxatdan o\'tish'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-gray-600">
          <p>Avval ro\'yxatdan o\'tganmisiz? <Link href="/lawyer-login" className="text-blue-600 hover:text-blue-700">Kirish</Link></p>
        </div>
      </div>
    </div>
  );
}
