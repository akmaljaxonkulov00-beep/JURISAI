import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JURISTIV - Huquqiy Ta'lim Platformasi",
    short_name: 'JURISTIV',
    description:
      "O'zbekiston uchun zamonaviy huquqiy ta'lim platformasi. AI-powered legal analysis, document generation, va boshqalar.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['education', 'legal', 'productivity'],
    lang: 'uz',
    dir: 'ltr',
  }
}
