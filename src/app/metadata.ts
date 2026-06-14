import { Metadata } from 'next';

export const siteConfig = {
  name: 'JURISAI',
  title: 'JURISAI - O\'zbekiston Yuridik AI Platformasi',
  description: 'O\'zbekistonning eng rivojlangan yuridik AI yordamchisi. IRAC tahlili, hujjat generatsiyasi, qonunlar bazasi va professional maslahat.',
  url: 'https://jurisai.uz',
  ogImage: '/og-image.jpg',
  keywords: [
    'yuridik ai',
    'huquqiy yordamchi',
    'o\'zbekiston qonunlari',
    'irac tahlili',
    'huquqiy maslahat',
    'advokat ai',
    'yurist chat',
    'qonun bazasi',
    'huquqiy hujjatlar',
    'lex.uz',
    'o\'zbekiston kodeksi',
    'fuqarolik kodeksi',
    'jinoyat kodeksi',
    'mehnat kodeksi',
    'oilaviy kodeksi',
    'yuridik konsultatsiya',
    'ai advokat',
    'huquqiy texnologiya',
    'legal tech o\'zbekiston',
    'smart lawyer',
    'huquqiy chatbot',
    'qonun tahlili',
    'sud ishlari',
    'da\'vo arizasi',
    'shartnoma generator',
    'vakolatnoma',
    'huquqiy xizmatlar',
    'onlayn advokat',
    'digital huquqshunos',
    'ai yurist',
    'o\'zbekiston advokati',
    'huquqiy portal',
    'yuridik platforma',
    'legal assistant uzbek',
    'o\'zbekiston legal ai',
  ],
  authors: [
    {
      name: 'JURISAI Team',
      url: 'https://jurisai.uz',
    },
  ],
  creator: 'JURISAI',
  publisher: 'JURISAI',
  robots: 'index, follow',
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
}

export function generateSEOMetadata({
  title,
  description,
  keywords,
  image,
  noIndex = false,
}: SEOProps = {}): Metadata {
  const metaTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const metaDescription = description || siteConfig.description;
  const metaKeywords = keywords ? [...keywords, ...siteConfig.keywords].join(', ') : siteConfig.keywords.join(', ');
  const metaImage = image || siteConfig.ogImage;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    robots: noIndex ? 'noindex, nofollow' : siteConfig.robots,
    openGraph: {
      type: 'website',
      locale: 'uz_UZ',
      url: siteConfig.url,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      creator: '@jurisai_uz',
    },
    verification: siteConfig.verification,
    alternates: {
      canonical: siteConfig.url,
      languages: {
        'uz-UZ': '/uz',
        'ru-RU': '/ru',
        'en-US': '/en',
      },
    },
    other: {
      'og:site_name': siteConfig.name,
      'og:locale': 'uz_UZ',
      'og:type': 'website',
      'article:author': siteConfig.authors[0].name,
      'article:section': 'Technology',
      'article:tag': metaKeywords,
      'twitter:site': '@jurisai_uz',
      'twitter:creator': '@jurisai_uz',
      'geo.region': 'UZ',
      'geo.placename': 'Uzbekistan',
      'geo.position': '41.3775;64.8912',
      'ICBM': '41.3775,64.8912',
    },
  };
}

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: 'Bosh Sahifa',
    description: 'JURISAI - O\'zbekistonning yetakchi yuridik AI platformasi. IRAC tahlili, hujjat generatsiyasi, qonunlar bazasi va professional maslahat.',
    keywords: ['yuridik ai', 'huquqiy yordamchi', 'o\'zbekiston qonunlari', 'irac tahlili'],
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Shaxsiy kabinet - IRAC tahlili, AI yordamchi, hujjat generatsiyasi va boshqa yuridik xizmatlar.',
    keywords: ['shaxsiy kabinet', 'yuridik dashboard', 'ai yordamchi', 'irac tahlili'],
  },
  billing: {
    title: 'To\'lovlar',
    description: 'Obuna rejalari va to\'lov tizimi. Basic, Standard, Pro rejalari bilan tanishing.',
    keywords: ['obuna rejalari', 'to\'lovlar', 'pricing', 'subscription plans'],
  },
  signup: {
    title: 'Ro\'yxatdan o\'tish',
    description: 'JURISAI platformasiga ro\'yxatdan o\'ting. 7 kun bepul sinov.',
    keywords: ['ro\'yxatdan o\'tish', 'registratsiya', 'bepul sinov', 'account'],
  },
  signin: {
    title: 'Kirish',
    description: 'JURISAI platformasiga kirish. Shaxsiy kabinetga kirish.',
    keywords: ['kirish', 'login', 'auth', 'authentication'],
  },
  irac: {
    title: 'IRAC Tahlili',
    description: 'Professional IRAC metodikasi bo\'yicha huquqiy holatlarni tahlil qiling. AI yordamida.',
    keywords: ['irac tahlili', 'issue rule application conclusion', 'yuridik tahlil', 'ai yordamchi'],
  },
  'legal-chat': {
    title: 'Yuridik Chat',
    description: 'AI yordamchi bilan yuridik savollaringizni javob oling. O\'zbekiston qonunlari asosida.',
    keywords: ['yuridik chat', 'ai advokat', 'huquqiy maslahat', 'qonun savollari'],
  },
  'document-generator': {
    title: 'Hujjat Generator',
    description: 'Avtomatik ravishda yuridik hujjatlar yarating. Shartnoma, da\'vo arizasi, vakolatnoma va boshqalar.',
    keywords: ['hujjat generator', 'shartnoma', 'da\'vo arizasi', 'vakolatnoma', 'legal documents'],
  },
  admin: {
    title: 'Admin Panel',
    description: 'Admin panel - foydalanuvchilar boshqaruvi, analitika, statistika.',
    keywords: ['admin panel', 'user management', 'analytics', 'dashboard admin'],
  },
};
