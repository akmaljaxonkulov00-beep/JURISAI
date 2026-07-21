import { ReactNode, Suspense } from 'react'

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding and info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
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
                Sun&apos;iy intellekt asosida hujjatlar tayyorlang, masalalarni tahlil qiling va professional yordam oling.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Suspense fallback={<div>Yuklanmoqda...</div>}>
              {children}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
