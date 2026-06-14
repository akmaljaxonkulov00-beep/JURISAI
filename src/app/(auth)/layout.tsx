import { ReactNode } from 'react'

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding and info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">J</span>
                </div>
                <span className="text-white font-bold text-2xl">JURISAI</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-6">
                Huquqiy AI yordamchi
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                Zamonaviy texnologiyalar yordamida huquqiy masalalaringizni tez va samarali hal qiling. 
                Sun'iy intellekt asosida hujjatlar tayyorlang, masalalarni tahlil qiling va 
                professional yordam oling.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Tezkor yechimlar</h3>
                  <p className="text-blue-100 text-sm">AI yordamida soniyalarda javob oling</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Xavfsizlik</h3>
                  <p className="text-blue-100 text-sm">Ma'lumotlaringiz to'liq himoyalangan</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Samaradorlik</h3>
                  <p className="text-blue-100 text-sm">Vaqtni tejab, ish samaradorligini oshiring</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-blue-100 text-sm">
              © 2024 JURISAI. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
