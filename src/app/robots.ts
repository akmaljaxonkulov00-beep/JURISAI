import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://juristiv.uz'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/_next/',
          '/auth/',
          '/case-solver/',
          '/decision-tree/',
          '/document-generator/',
          '/scenario-generator/',
          '/virtual-court/',
          '/settings/',
          '/profile/',
          '/billing/',
          '/payment-admin/',
          '/manual-payment/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/case-solver/', '/virtual-court/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
