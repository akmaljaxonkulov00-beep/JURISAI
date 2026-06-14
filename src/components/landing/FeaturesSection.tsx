import React from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface FeaturesSectionProps {
  className?: string;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ className }) => {
  const features = [
    {
      id: 'irac-analysis',
      title: 'IRAC Tahlili',
      description: 'Xalqaro standartdagi IRAC metodologiyasi bilan huquqiy ishlarni chuqur tahlil qiling',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-blue-500',
      highlights: ['Issue aniqlash', 'Rule qo\'llash', 'Application tahlil', 'Conclusion chiqarish']
    },
    {
      id: 'ai-assistant',
      title: 'AI Yordamchi',
      description: 'Kuniga 24 soat AI yordamisi bilan huquqiy savollaringizga javob oling',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'bg-emerald-500',
      highlights: ['Instant javoblar', '3 ta AI model', 'Huquqiy ixtisoslas', 'Aniqlik 95%+']
    },
    {
      id: 'court-simulation',
      title: 'Virtual Sud',
      description: 'Real sud jarayonini simulyatsiya qiling va turli rollarda tajriba orting',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6-3 6h-5.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      color: 'bg-purple-500',
      highlights: ['4 ta rol', 'Real-time jarayon', 'AI qarorlar', 'Feedback']
    },
    {
      id: 'legal-database',
      title: 'Huquqiy Ma\'lumotlar Bazasi',
      description: 'O\'zbekiston qonun hujjatlarini qidirib o\'qing va o\'qing',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'bg-orange-500',
      highlights: ['5000+ hujjat', 'Smart qidiruv', 'To\'liq matn', 'Yangilanishlar']
    },
    {
      id: 'decision-tree',
      title: 'Qaror Daraxti',
      description: 'Murakkab huquqiy vaziyatlarda qaror qabul qilish yo\'nalishini aniqlang',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-red-500',
      highlights: ['4 ta senariy', 'AI tahlil', 'Xavf baholash', 'Tavsiyalar']
    },
    {
      id: 'document-generator',
      title: 'Hujjat Generatori',
      description: 'Turli xil huquqiy hujjatlarni avtomatik yarating va shakllantiring',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-indigo-500',
      highlights: ['10+ shablon', 'Field validation', 'Export imkoniyati', 'Customizatsiya']
    }
  ];

  return (
    <section className={cn('py-20 bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Yuqori texnologiyali <span className="text-emerald-600">huquqiy ta'lim</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Zamonaviy AI va interaktiv vositalar bilan huquqiy bilimlaringizni yangi bosqichga ko'taring
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-8">
                {/* Icon */}
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300',
                  feature.color
                )}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Highlights */}
                <div className="space-y-2 mb-6">
                  {feature.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300"
                >
                  Batafsil ma'lumot
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Hoziroq boshlang va 14 kun bepul sinovdan foydalaning
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Barcha funksiyalarni cheklab ko'ring va qanday qilib professional huquqshunosga aylanishingizni ko'ring
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-medium"
              >
                Bepul boshlang
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 font-medium"
              >
                Narxlar bilan tanishish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { FeaturesSection };
