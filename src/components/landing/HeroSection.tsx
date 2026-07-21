import React from 'react';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  return (
    <section className={cn('relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900', className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-emerald-100 text-emerald-800 px-4 py-2 text-sm font-medium">
              ◎ O'zbekistonning birinchi AI huquqiy platformasi
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="block">Huquqiy ta'limni</span>
            <span className="block text-emerald-400">qayta kashf qiling</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            JurisAI bilan zamonaviy AI texnologiyalari orqali huquqiy tahlil, 
            IRAC metodologiyasi va interaktiv sud simulyatsiyalari orqali 
            professional huquqshunoslik mahoratini rivojlantiring
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">10,000+</div>
              <div className="text-blue-100 text-sm">Faol o'quvchilar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">95%</div>
              <div className="text-blue-100 text-sm">Muvaffaqiyat darajasi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">24/7</div>
              <div className="text-blue-100 text-sm">AI yordami</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Bepul boshlang
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-medium transition-all duration-200"
            >
              Demo tomosha qiling
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-blue-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">O'zbekiston Respublikasi Adliya vazirligi tomonidan tasdiqlangan</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm">4.9/5 foydalanuvchi reytingi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-20 text-blue-50" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
};

export { HeroSection };
