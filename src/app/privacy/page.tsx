import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maxfiylik Siyosati - JURISAI',
  description: 'JURISAI platformasi maxfiylik siyosati',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Maxfiylik Siyosati
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                Oxirgi yangilanish: {new Date().toLocaleDateString('uz-UZ')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Ma'lumotlar to'plami
              </h2>
              <p className="text-gray-600 mb-4">
                JURISAI platformasi foydalanuvchilardan quyidagi ma'lumotlarni to'playdi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Ism va familya</li>
                <li>Email manzil</li>
                <li>Telefon raqam (ixtiyoriy)</li>
                <li>Tug'ilgan sana (ixtiyoriy)</li>
                <li>Foydalanuvchi faoliyati ma'lumotlari</li>
                <li>IP manzil va qurilma ma'lumotlari</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Ma'lumotlardan foydalanish
              </h2>
              <p className="text-gray-600 mb-4">
                Biz to'plagan ma'lumotlarni quyidagi maqsadlarda foydalanamiz:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Xizmatlarni taqdim etish</li>
                <li>Foydalanuvchi tajribasini yaxshilash</li>
                <li>Xavfsizlikni ta'minlash</li>
                <li>Qonuniy talablarga rioya qilish</li>
                <li>Marketing va reklama (ixtiyoriy)</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Ma'lumotlarni saqlash
              </h2>
              <p className="text-gray-600 mb-4">
                Foydalanuvchi ma'lumotlari xavfsiz serverlarda saqlanadi va faqat ruxsat etilgan xodimlar tomonidan kirish mumkin.
              </p>
              <p className="text-gray-600 mb-6">
                Ma'lumotlar saqlash muddati:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Hisob ma'lumotlari - hisob faol bo'lgunga qadar</li>
                <li>Tranzaksiya ma'lumotlari - 7 yil</li>
                <li>Foydalanuvchi faoliyati - 2 yil</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Ma'lumotlarni ulashish
              </h2>
              <p className="text-gray-600 mb-4">
                Biz foydalanuvchi ma'lumotlarini quyidagi hollarda ulashamiz:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Foydalanuvchi roziligi bilan</li>
                <li>Qonuniy talablarga asosan</li>
                <li>Xizmat provayderlari bilan (faqat kerakli ma'lumotlar)</li>
                <li>Xavfsizlikni ta'minlash maqsadida</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Foydalanuvchi huquqlari
              </h2>
              <p className="text-gray-600 mb-4">
                Har bir foydalanuvchi quyidagi huquqlarga ega:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>O'z ma'lumotlarini ko'rish</li>
                <li>Ma'lumotlarni tuzatishni so'rash</li>
                <li>Ma'lumotlarni o'chirishni so'rash</li>
                <li>Ma'lumotlarni eksport qilish</li>
                <li>Ma'lumotlarni qayta ishlashga qarshi bo'lish</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Cookie fayllari
              </h2>
              <p className="text-gray-600 mb-4">
                Platforma cookie fayllaridan foydalanadi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Sessiyani saqlash uchun</li>
                <li>Foydalanuvchi imtiyozlarini eslab qolish uchun</li>
                <li>Tahlil va statistika uchun</li>
                <li>Reklama uchun (ixtiyoriy)</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Xavfsizlik choralar
              </h2>
              <p className="text-gray-600 mb-4">
                Ma'lumotlarni himoya qilish uchun quyidagi choralar qo'llaniladi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>SSL/TLS shifrlash</li>
                <li>Ikki faktorli autentifikatsiya</li>
                <li>Muntazam xavfsizlik tekshiruvi</li>
                <li>Xodimlarni o'qitish</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Bolalar maxfiyligi
              </h2>
              <p className="text-gray-600 mb-6">
                Platforma 18 yoshdan kichik foydalanuvchilardan hech qanday ma'lumot to'plamaydi. Agar 18 yoshdan kichik foydalanuvchi ma'lumot to'plangan bo'lsa, ota-onalari biz bilan bog'lanishlari mumkin.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Xalqaro ma'lumotlarni uzatish
              </h2>
              <p className="text-gray-600 mb-6">
                Ma'lumotlar O'zbekiston hududidan tashqariga qonuniy asosda va zarur choralar ko'rilgan holdagina uzatiladi.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Siyosatni o'zgartirish
              </h2>
              <p className="text-gray-600 mb-6">
                Ushbu siyosat o'zgartirilishi mumkin. O'zgarishlar platforma orqali e'lon qilinadi. Muhim o'zgarishlar foydalanuvchilarga email orqali ham xabardor qilinadi.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                11. Bog'lanish
              </h2>
              <p className="text-gray-600 mb-4">
                Maxfiylik siyosati bo'yicha savollaringiz bo'lsa, biz bilan bog'laning:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-600">
                  <strong>Email:</strong> privacy@jurisai.uz<br />
                  <strong>Telefon:</strong> +998 90 123 45 67<br />
                  <strong>Manzil:</strong> Toshkent shahri, Yunusobod tumani
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                12. Qonunlar
              </h2>
              <p className="text-gray-600 mb-6">
                Ushbu siyosat O'zbekiston Respublikasining "Shaxsiy ma'lumotlar to'g'risida" qonuni va boshqa tegishli qonun hujjatlariga muvofiq tuzilgan.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                © {new Date().getFullYear()} JURISAI. Barcha huquqlar himoyalangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
