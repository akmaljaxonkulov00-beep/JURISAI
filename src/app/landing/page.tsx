'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Shield, 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight,
  Star,
  Award,
  Briefcase,
  BookOpen,
  Gavel,
  Scale,
  Heart,
  BarChart3,
  Clock,
  MapPin,
  Phone,
  Mail,
  Search,
  PlayCircle,
  User
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Shield,
      title: 'Xavfsiz huquqiy yordam',
      description: 'Professional advokatlar tomonidan yuqori sifatli huquqiy xizmatlar'
    },
    {
      icon: Users,
      title: 'Mijozlar bazasi',
      description: 'O\'z mijozlaringizni boshqaring va ular bilan aloqada bo\'ling'
    },
    {
      icon: FileText,
      title: 'AI hujjatlar tahlili',
      description: 'Sun\'iy intellekt yordamida chuqur hujjatlar tahlili'
    },
    {
      icon: MessageSquare,
      title: 'So\'rovlar boshqaruvi',
      description: 'Mijoz so\'rovlarini tez va samarali boshqaring'
    },
    {
      icon: TrendingUp,
      title: 'Statistika va analitika',
      description: 'Biznesingiz o\'sishini kuzatib boring'
    },
    {
      icon: Gavel,
      title: 'Yuridik maslahatlar',
      description: 'O\'zbekiston qonunchiligi bo\'yicha to\'liq maslahatlar'
    }
  ];

  const lawyerBenefits = [
    'Mijozlar bazasini boshqarish',
    'AI yordamida hujjatlar tahlili',
    'So\'rovlar tez qabul qilish',
    'Daromadni kuzatish',
    'Professional tasvir',
    '24/7 kirish imkoniyati'
  ];

  const testimonials = [
    {
      name: 'Ali Karimov',
      role: 'Advokat',
      content: 'JURISAI mening amaliyatimni butunlay o\'zgartirdi. Endi mijozlarim bilan ishlash ancha osonlashdi.',
      rating: 5
    },
    {
      name: 'Dilora Toshmatova',
      role: 'Yuridik maslahatchi',
      content: 'AI hujjatlar tahlili juda foydali. Vaqtimni tejaydi va xatoliklarni kamaytiradi.',
      rating: 5
    },
    {
      name: 'Botir Sobirov',
      role: 'Advokat',
      content: 'Mijozlar so\'rovlarini boshqarish endi juda oson. Platforma juda qulay va professional.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">JURISAI</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Imkoniyatlar</a>
              <a href="#lawyers" className="text-gray-600 hover:text-gray-900">Advokatlar</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Fikrlar</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Narxlar</a>
            </nav>
            <div className="flex space-x-4">
              <Link href="/lawyer-login">
                <Button variant="outline">Kirish</Button>
              </Link>
              <Link href="/lawyer-register">
                <Button>Ro\'yxatdan o\'tish</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              <Gavel className="w-4 h-4 mr-2" />
              Professional Advokatlar Platformasi
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Advokatlik faoliyatingizni
              <span className="text-blue-600"> zamonaviy darajaga olib chiqing</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              JURISAI - bu O\'zbekiston advokatlari uchun mo\'ljallangan zamonaviy platforma. 
              Mijozlar bazasini boshqaring, AI yordamida hujjatlarni tahliling va biznesingizni o\'stiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/lawyer-register">
                <Button size="lg" className="text-lg px-8 py-3">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Bepul boshlang
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Batafsil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nima uchun JURISAI?
            </h2>
            <p className="text-xl text-gray-600">
              Advokatlar uchun yaratilgan to\'liq funksional platforma
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lawyer Benefits Section */}
      <section id="lawyers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Advokatlar uchun imkoniyatlar
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Bizning platforma advokatlar uchun barcha kerakli vositalarni taqdim etadi
              </p>
              
              <div className="space-y-4">
                {lawyerBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8">
                <Link href="/lawyer-register">
                  <Button size="lg">
                    <Award className="w-5 h-5 mr-2" />
                    Advokat sifatida ro\'yxatdan o\'tish
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">
                  Statistikalar va analitika
                </h3>
                <p className="mb-6">
                  O\'z ish faoliyatingizni raqamlarda ko\'ring va 
                  biznes qarorlarini ma\'lumotlar asosida qabul qiling
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-sm opacity-90">Mijozlar qoniqishi</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-sm opacity-90">Kirish imkoniyati</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advokatlarimiz nima deydi
            </h2>
            <p className="text-xl text-gray-600">
              Platformamizdan foydalanayotgan professional advokatlar fikrlari
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Advokatlik faoliyatingizni yangi darajaga olib chiqing
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bugun ro\'yxatdan o\'ting va professional imkoniyatlardan foydalaning
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/lawyer-register">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-white text-blue-600 border-white hover:bg-blue-50">
                <Briefcase className="w-5 h-5 mr-2" />
                Ro\'yxatdan o\'tish
              </Button>
            </Link>
            <Link href="/lawyer-login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-transparent text-white border-white hover:bg-blue-700">
                <ArrowRight className="w-5 h-5 mr-2" />
                Kirish
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-blue-400 mr-3" />
                <span className="text-xl font-bold">JURISAI</span>
              </div>
              <p className="text-gray-400">
                O\'zbekiston advokatlari uchun zamonaviy platforma
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platforma</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Imkoniyatlar</a></li>
                <li><a href="#lawyers" className="hover:text-white">Advokatlar</a></li>
                <li><a href="#pricing" className="hover:text-white">Narxlar</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Huquqiy</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Foydalanish shartlari</a></li>
                <li><a href="#" className="hover:text-white">Maxfiylik siyosati</a></li>
                <li><a href="#" className="hover:text-white">Qonunlar</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Aloqa</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  info@jurisai.uz
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +998 90 123 45 67
                </li>
                <li className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Toshkent, O\'zbekiston
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 JURISAI. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
