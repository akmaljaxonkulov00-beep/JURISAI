import React from 'react';
import { Card, CardContent, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization: string;
  avatar: string;
  content: string;
  rating: number;
  achievement?: string;
}

interface TestimonialsSectionProps {
  className?: string;
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ className }) => {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Dilora Azizova',
      role: 'Huquqshunoslik talabasi',
      organization: 'Toshkent Davlat Universiteti',
      avatar: 'DA',
      content: 'JurisAI o\'qish jarayonimni butunlay o\'zgartirdi. IRAC tahlili va virtual sud simulyatsiyalari orqali nazariy bilimlarni amaliyotga tatbiq qildim. AI yordamchisi esa murakkab masalalarda instant yordam beradi.',
      rating: 5,
      achievement: '95% ball bilan kursni tugatdi'
    },
    {
      id: '2',
      name: 'Bobur Toshmatov',
      role: 'Yosh advokat',
      organization: 'Advokatlar palatasi',
      avatar: 'BT',
      content: 'Kundalik ishlarimda JurisAI dan foydalanaman. Huquqiy ma\'lumotlar bazasi va hujjat generatori vaqtni juda qisqartirdi. Qaror daraxti esa murakkab ishlarda to\'g\'ri yo\'nalishni tanlashga yordam beradi.',
      rating: 5,
      achievement: 'Ish samaradorligi 40% oshdi'
    },
    {
      id: '3',
      name: 'Malika Rahimova',
      role: 'Mehnat huquqi bo\'yicha mutaxassis',
      organization: 'Adliya vazirligi',
      avatar: 'MR',
      content: 'Davlat organi sifatida JurisAI ning qonun hujjatlari bazasi ayniqsa foydali. Yangi qonunlar va o\'zgarishlarni tez kuzatib borish mumkin. Senariy generatori esa yangi xodimlarni o\'qitishda yordam beradi.',
      rating: 5,
      achievement: '500+ ishda foydalanildi'
    },
    {
      id: '4',
      name: 'Sardor Qodirov',
      role: 'Biznes huquqi advokati',
      organization: 'Legal Partners',
      avatar: 'SQ',
      content: 'Shartnoma shakllari va hujjat generatori mijozlarimga tez va sifatli xizmat ko\'rsatish imkonini berdi. AI tahlili esa shartnomalardagi potensial xavflarni aniqlashga yordam beradi.',
      rating: 5,
      achievement: '200+ shartnoma tuzildi'
    },
    {
      id: '5',
      name: 'Nigora Karimova',
      role: 'Jinoyat huquqi professori',
      organization: 'O\'zbekiston Milliy Universiteti',
      avatar: 'NK',
      content: 'Talabalarni o\'qitishda JurisAI juda qulay. Virtual sud simulyatsiyalari talabalarni sud jarayonini tushunishga yordam beradi. IRAC tahlili esa xalqaro standartlarni o\'rgatishda asosiy vositaga aylandi.',
      rating: 5,
      achievement: '1000+ talaba o\'qitildi'
    },
    {
      id: '6',
      name: 'Jamshid Umarov',
      role: 'Korporativ huquqshunos',
      organization: 'Tech Solutions LLC',
      avatar: 'JU',
      content: 'Korporativ huquqiy masalalarda JurisAI ning AI yordamchisi juda foydali. Murakkab shartnomalarni tahlil qilish va xavflarni aniqlash vaqtini sezilarli qisqartirdi. Platform doimiy yangilanib turadi.',
      rating: 5,
      achievement: '50+ korporativ ish'
    }
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, index) => (
          <svg
            key={index}
            className={cn(
              'w-5 h-5',
              index < rating ? 'text-yellow-400' : 'text-gray-300'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className={cn('py-20 bg-white', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Foydalanuvchilar <span className="text-emerald-600">fikrlari</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            10,000+ dan ortiq professional foydalanuvchilar JurisAI ning samaradorligini tasdiqladilar
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">4.9/5</div>
            <div className="text-gray-600">O\'rtacha reyting</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">10,000+</div>
            <div className="text-gray-600">Faol foydalanuvchilar</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">95%</div>
            <div className="text-gray-600">Tavsiya etish darajasi</div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Content */}
                <blockquote className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <Avatar
                    fallback={testimonial.avatar}
                    size="lg"
                    className="bg-emerald-500 text-white"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.organization}</div>
                  </div>
                </div>

                {/* Achievement */}
                {testimonial.achievement && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-600 font-medium">{testimonial.achievement}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ularning qatoriga qo\'shiling
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Minglabar professional huquqshunoslar kabi JurisAI dan foydalanib o\'z karerasini yangi bosqichga ko\'tardilar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Bepul boshlash
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Muvaffaqiyat hikoyalari
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { TestimonialsSection };
