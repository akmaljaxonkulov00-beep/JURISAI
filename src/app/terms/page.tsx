import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foydalanish Shartlari - JURISAI',
  description: 'JURISAI platformasi foydalanish shartlari',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Foydalanish Shartlari
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                Oxirgi yangilanish: {new Date().toLocaleDateString('uz-UZ')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Umumiy qoidalar
              </h2>
              <p className="text-gray-600 mb-4">
                JURISAI platformasidan foydalanish ushbu shartlarga muvofiq amalga oshiriladi. Platformadan foydalanish orqali siz ushbu shartlarni qabul qilasiz.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Xizmatlar
              </h2>
              <p className="text-gray-600 mb-4">
                JURISAI quyidagi xizmatlarni taqdim etadi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Yuridik maslahatlar</li>
                <li>Hujjatlar tayyorlash</li>
                <li>Qonun hujjatlari bazasi</li>
                <li>IRAC analiz tizimi</li>
                <li>Virtual sud simulyatori</li>
                <li>AI yordamchi xizmatlari</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Ro'yxatdan o'tish
              </h2>
              <p className="text-gray-600 mb-4">
                Platformadan to'liq foydalanish uchun ro'yxatdan o'tish talab qilinadi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>To'g'ri ma'lumotlarni kiritish majburiy</li>
                <li>18 yoshdan kichik bo'lish taqiqlanadi</li>
                <li>Bitta foydalanuvchi bitta hisobga ega bo'lishi mumkin</li>
                <li>Parol xavfsizligi foydalanuvchi zimmasida</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. To'lovlar
              </h2>
              <p className="text-gray-600 mb-4">
                Platforma pullik va bepul xizmatlarni taklif etadi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Bepul reja - asosiy imkoniyatlar</li>
                <li>Premium reja - to'liq imkoniyatlar</li>
                <li>To'lovlar xavfsiz tizimlar orqali amalga oshiriladi</li>
                <li>To'lovlar qaytarilmaydi</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Foydalanuvchi majburiyatlari
              </h2>
              <p className="text-gray-600 mb-4">
                Foydalanuvchi quyidagilarga majbur:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>To'g'ri ma'lumotlarni taqdim etish</li>
                <li>Qonunlarga rioya qilish</li>
                <li>Boshqa foydalanuvchilarni hurmat qilish</li>
                <li>Platformani noto'g'ri maqsadlarda ishlatmaslik</li>
                <li>Avtorlik huquqlariga rioya qilish</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Taqiqlangan harakatlar
              </h2>
              <p className="text-gray-600 mb-4">
                Quyidagi harakatlar qat'iy taqiqlanadi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Platformani xakerlik hujumlariga uchratish</li>
                <li>Virus va zararli kodlarni yuborish</li>
                <li>Spam yuborish</li>
                <li>Soxta ma'lumotlarni tarqatish</li>
                <li>Boshqa foydalanuvchilarni ta'qib qilish</li>
                <li>Noqonuniy faoliyat bilan shug'ullanish</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Intellektual mulk
              </h2>
              <p className="text-gray-600 mb-4">
                Platforma kontenti va dasturiy ta'minot muhofaza ostida:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Barcha materiallar avtorlik huquqi bilan himoyalangan</li>
                <li>Ruxsatsiz nusxa ko'chirish taqiqlanadi</li>
                <li>Foydalanuvchi yaratgan kontent foydalanuvchiga tegishli</li>
                <li>Platforma kontentidan foydalanish uchun ruxsat kerak</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Mas'uliyat chegaralari
              </h2>
              <p className="text-gray-600 mb-4">
                JURISAI quyidagilar uchun mas'uliyatni o'z zimmasiga olmaydi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Foydalanuvchilar tomonidan kiritilgan ma'lumotlar uchun</li>
                <li>Texnik nosozliklar natijasida kelib chiqqan zararlar uchun</li>
                <li>Uchinchi tomon xizmatlarining ishlamashi uchun</li>
                <li>Internet aloqasining uzilishi uchun</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Xizmatni to'xtatish
              </h2>
              <p className="text-gray-600 mb-4">
                Biz quyidagi hollarda xizmatni to'xtatish huquqini saqlaymiz:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Texnik ishlarga bog'liq</li>
                <li>Foydalanuvchi shartlarni buzganda</li>
                <li>Noqonuniy faoliyat aniqlanganda</li>
                <li>Davlat organlari talabi bilan</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Hisobni bekor qilish
              </h2>
              <p className="text-gray-600 mb-4">
                Hisob quyidagi hollarda bekor qilinishi mumkin:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Foydalanuvchi iltimosiga ko'ra</li>
                <li>Shartlarni buzganda</li>
                <li>Uzoq vaqt faol bo'lmaganda (6 oy)</li>
                <li>Noqonuniy faoliyat uchun</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                11. Shartlarni o'zgartirish
              </h2>
              <p className="text-gray-600 mb-6">
                Biz ushbu shartlarni istalgan vaqtda o'zgartirish huquqini saqlaymiz. O'zgarishlar platforma orqali e'lon qilinadi. Muhim o'zgarishlar foydalanuvchilarga email orqali ham xabardor qilinadi.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                12. Nizolar
              </h2>
              <p className="text-gray-600 mb-4">
                Nizolar quyidagi tartibda hal qilinadi:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-6">
                <li>Avval muzokara yo'li bilan hal qilinadi</li>
                <li>Muzokara natija bermasa - Toshkent shahar sudiga murojaat qilinadi</li>
                <li>O'zbekiston Respublikasi qonunlari asosida hal qilinadi</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                13. Bog'lanish
              </h2>
              <p className="text-gray-600 mb-4">
                Foydalanish shartlari bo'yicha savollaringiz bo'lsa, biz bilan bog'laning:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-600">
                  <strong>Email:</strong> legal@jurisai.uz<br />
                  <strong>Telefon:</strong> +998 90 123 45 67<br />
                  <strong>Manzil:</strong> Toshkent shahri, Yunusobod tumani
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                14. Qo'shimcha ma'lumot
              </h2>
              <p className="text-gray-600 mb-6">
                Ushbu shartlar O'zbekiston Respublikasining qonunlariga muvofiq tuzilgan. Platformadan foydalanish orqali siz O'zbekiston Respublikasi qonunlariga rioya qilishga rozilik bildirasiz.
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
