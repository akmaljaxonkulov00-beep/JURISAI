'use client';

import { useState } from 'react';
import { ArrowLeft, Users, MessageCircle, ThumbsUp, ThumbsDown, TrendingUp, Calendar, Star, Verified, Hash, Search, Plus, Filter, Award, Video, BookOpen, Briefcase, UserCircle, Clock, Eye, Globe, Gavel } from 'lucide-react';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    verified: boolean;
    reputation: number;
  };
  content: string;
  category: 'question' | 'discussion' | 'case' | 'news';
  tags: string[];
  likes: number;
  dislikes: number;
  comments: number;
  views: number;
  timestamp: string;
  isPinned?: boolean;
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    verified: boolean;
  };
  content: string;
  likes: number;
  timestamp: string;
  replies?: Comment[];
}

interface Group {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  members: number;
  category: string;
  isJoined?: boolean;
}

interface Expert {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specialization: string;
  verified: boolean;
  reputation: number;
  mentorship: boolean;
  webinars: number;
}

interface Webinar {
  id: string;
  title: string;
  host: string;
  date: string;
  duration: string;
  participants: number;
  category: string;
  isLive?: boolean;
}

export default function Community() {
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const posts: Post[] = [
    {
      id: '1',
      author: {
        name: 'Aziz Karimov',
        avatar: 'user',
        role: 'Advokat',
        verified: true,
        reputation: 1250
      },
      content: 'Yangi Fuqarolik kodeksining 45-moddasida keltirilgan "shartnoma majburiyatlarining bajarilishi" tushunchasini qanday tushunishimiz kerak? Bu yerda "bajarilishi" deganda nima nazarda tutilgan? #fuqarolik_huquqi #shartnoma',
      category: 'question',
      tags: ['fuqarolik_huquqi', 'shartnoma'],
      likes: 24,
      dislikes: 2,
      comments: 8,
      views: 156,
      timestamp: '2 soat oldin'
    },
    {
      id: '2',
      author: {
        name: 'Dilora Nazarova',
        avatar: 'user',
        role: 'Professor',
        verified: true,
        reputation: 2100
      },
      content: 'Bugun Toshkent shahar iqtisodiy sudida qiziqarli qaror chiqarildi. Ishda kompaniya xodimi tomonidan mijozning shaxsiy ma\'lumotlarini noqonuniy tarqatish holati ko\'riladi. Sud qarori muhim ahamiyatga ega, chunki shaxsiy ma\'lumotlarni himoya qilish bo\'yicha yangi yondashuvni belgilab berdi. #sud_qarori #shaxsiy_ma_lumotlar',
      category: 'case',
      tags: ['sud_qarori', 'shaxsiy_ma_lumotlar'],
      likes: 45,
      dislikes: 3,
      comments: 12,
      views: 289,
      timestamp: '4 soat oldin',
      isPinned: true
    },
    {
      id: '3',
      author: {
        name: 'Bahodir Toshmatov',
        avatar: 'user',
        role: 'Prokuror',
        verified: true,
        reputation: 890
      },
      content: 'O\'zbekiston Jinoyat kodeksiga 2024-yilda kiritilgan o\'zgarishlar haqida muhokama. Ayniqsa, kiberjinoyatlarga oid yangi moddalar va ularning qo\'llanilish amaliyati. #jinoyat_huquqi #kiberjinoyat #2024_yangiliklari',
      category: 'discussion',
      tags: ['jinoyat_huquqi', 'kiberjinoyat', '2024_yangiliklari'],
      likes: 67,
      dislikes: 5,
      comments: 23,
      views: 412,
      timestamp: '6 soat oldin'
    },
    {
      id: '4',
      author: {
        name: 'Gulnora Saidova',
        avatar: 'user',
        role: 'Talaba',
        verified: false,
        reputation: 156
      },
      content: 'Assalomu alaykum! Stajirovkaga tayyorlanayotgan talabaman. Qanday sohalarda staj qilishni maslahat berasizlar? Xususan, korporativ huquq yoki sud amaliyoti qaysi yaxshi? #stajirovka #talaba_yordam',
      category: 'question',
      tags: ['stajirovka', 'talaba_yordam'],
      likes: 18,
      dislikes: 1,
      comments: 15,
      views: 98,
      timestamp: '8 soat oldin'
    }
  ];

  const groups: Group[] = [
    {
      id: '1',
      name: 'Xalqaro huquq ixlosmandlari',
      description: 'Xalqaro huquq va konvensiyalar bo\'yicha muhokamalar',
      icon: <Globe className="w-6 h-6" />,
      members: 234,
      category: 'Xalqaro huquq',
      isJoined: true
    },
    {
      id: '2',
      name: 'Bo\'lajak advokatlar klubi',
      description: 'Yosh advokatlar uchun qo\'llab-quvvatlash guruhi',
      icon: <Briefcase className="w-6 h-6" />,
      members: 456,
      category: 'Kasbiy rivojlanish',
      isJoined: false
    },
    {
      id: '3',
      name: 'Sud ekspertizasi guruhi',
      description: 'Sud ekspertizasi va sud-tibbiyot masalalari',
      icon: <Users className="w-6 h-6" />,
      members: 189,
      category: 'Ekspertiza',
      isJoined: false
    },
    {
      id: '4',
      name: 'Mehnat huquqi mutaxassislari',
      description: 'Mehnat huquqi va ishchi-huquqiy munosabatlar',
      icon: <BookOpen className="w-6 h-6" />,
      members: 321,
      category: 'Mehnat huquqi',
      isJoined: true
    }
  ];

  const experts: Expert[] = [
    {
      id: '1',
      name: 'Dr. Aziz Karimov',
      avatar: 'user',
      title: 'Huquqshunoslik fanlari doktori',
      specialization: 'Fuqarolik va tijorat huquqi',
      verified: true,
      reputation: 2850,
      mentorship: true,
      webinars: 12
    },
    {
      id: '2',
      name: 'Prof. Dilora Nazarova',
      avatar: 'user',
      title: 'Jinoyat huquqi professori',
      specialization: 'Jinoyat huquqi va kriminologiya',
      verified: true,
      reputation: 3200,
      mentorship: true,
      webinars: 18
    },
    {
      id: '3',
      name: 'Bahodir Toshmatov',
      avatar: 'user',
      title: 'Prokuratura boshlig\'i',
      specialization: 'Jinoyat protsessi',
      verified: true,
      reputation: 1950,
      mentorship: false,
      webinars: 6
    },
    {
      id: '4',
      name: 'Malika Umarova',
      avatar: 'user',
      title: 'Advokat',
      specialization: 'Xalqaro arbitraj',
      verified: true,
      reputation: 1670,
      mentorship: true,
      webinars: 8
    }
  ];

  const webinars: Webinar[] = [
    {
      id: '1',
      title: 'Kiberjinoyatlar: Yangi qonunchilik va amaliyot',
      host: 'Prof. Dilora Nazarova',
      date: '2024-03-25',
      duration: '1.5 soat',
      participants: 156,
      category: 'Jinoyat huquqi',
      isLive: false
    },
    {
      id: '2',
      title: 'Sud amaliyotida dalillarni yig\'ish usullari',
      host: 'Dr. Aziz Karimov',
      date: '2024-03-28',
      duration: '2 soat',
      participants: 89,
      category: 'Sud amaliyoti',
      isLive: true
    },
    {
      id: '3',
      title: 'Tijorat nizolari: Xalqaro tajriba',
      host: 'Malika Umarova',
      date: '2024-04-01',
      duration: '1 soat',
      participants: 234,
      category: 'Tijorat huquqi',
      isLive: false
    }
  ];

  const trendingTopics = [
    { tag: '#fuqarolik_huquqi', count: 156 },
    { tag: '#jinoyat_huquqi', count: 142 },
    { tag: '#sud_qarori', count: 98 },
    { tag: '#stajirovka', count: 87 },
    { tag: '#shartnoma', count: 76 },
    { tag: '#2024_yangiliklari', count: 65 }
  ];

  const topUsers = [
    { name: 'Dr. Aziz Karimov', reputation: 2850, role: 'Professor', avatar: 'user' },
    { name: 'Prof. Dilora Nazarova', reputation: 3200, role: 'Professor', avatar: 'user' },
    { name: 'Bahodir Toshmatov', reputation: 1950, role: 'Prokuror', avatar: 'user' },
    { name: 'Malika Umarova', reputation: 1670, role: 'Advokat', avatar: 'user' },
    { name: 'Jamshid Xaydarov', reputation: 1340, role: 'Notarius', avatar: 'user' }
  ];

  const availableTags = [
    'fuqarolik_huquqi', 'jinoyat_huquqi', 'mehnat_huquqi', 'oilaviy_kodeks',
    'sud_qarori', 'shartnoma', 'aliment', 'stajirovka',
    'kiberjinoyat', '2024_yangiliklari', 'xalqaro_huquq', 'korporativ_huquq'
  ];

  const handlePostSubmit = () => {
    // Simulate post submission
    setShowNewPost(false);
    setPostContent('');
    setSelectedTags([]);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'question': return 'bg-blue-100 text-blue-700';
      case 'discussion': return 'bg-green-100 text-green-700';
      case 'case': return 'bg-purple-100 text-purple-700';
      case 'news': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'question': return <MessageCircle className="w-4 h-4" />;
      case 'discussion': return <Users className="w-4 h-4" />;
      case 'case': return <Gavel className="w-4 h-4" />;
      case 'news': return <TrendingUp className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'question': return 'Savol';
      case 'discussion': return 'Muhokama';
      case 'case': return 'Keys';
      case 'news': return 'Yangilik';
      default: return category;
    }
  };

  if (activeTab === 'experts') {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 dark:bg-gray-950">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setActiveTab('feed')}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Ekspertlar</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Ekspertlar va Mentorlar</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Tasdiqlangan yuristlar va o\'qituvchilar bilan aloqa</p>
            </header>

            <main className="p-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  {experts.map(expert => (
                    <div key={expert.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <UserCircle className="w-10 h-10 text-white" />
                          </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800 dark:text-zinc-100">{expert.name}</h3>
                            {expert.verified && (
                              <Verified className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-zinc-300 mb-2">{expert.title}</p>
                          <p className="text-sm text-gray-700 mb-3">
                            <span className="font-medium">Mutaxassislik:</span> {expert.specialization}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-300 mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              <span>{expert.reputation} rep</span>
                            </div>
                            {expert.mentorship && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>Mentor</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              <span>{expert.webinars} vebinar</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              Maslahat so\'rash
                            </button>
                            {expert.mentorship && (
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Mentorlik
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'groups') {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 dark:bg-gray-950">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setActiveTab('feed')}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Guruhlar</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Guruhlar va Klublar</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Qiziqishingiz bo\'yicha professional guruhlarga qo\'shiling</p>
            </header>

            <main className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  {groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                          {group.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-1">{group.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-zinc-300 mb-3">{group.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-300">
                              <Users className="w-4 h-4" />
                              <span>{group.members} a\'zo</span>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {group.category}
                            </span>
                          </div>
                          
                          <button
                            className={`w-full mt-4 px-4 py-2 rounded-lg transition-colors ${
                              group.isJoined
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {group.isJoined ? 'A\'zo bo\'lgan' : 'Qo\'shilish'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Create New Group */}
                <div className="mt-6">
                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />
                      <span>Yangi guruh yaratish</span>
                    </div>
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'webinars') {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 dark:bg-gray-950">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setActiveTab('feed')}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Vebinarnlar</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Vebinarnlar</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Jonli darslar va professional uchrashuvlar</p>
            </header>

            <main className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="space-y-4">
                  {webinars.map(webinar => (
                    <div key={webinar.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-800 dark:text-zinc-100">{webinar.title}</h3>
                            {webinar.isLive && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-zinc-300 mb-3">
                            <span className="font-medium">O'tkazuvchi:</span> {webinar.host}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{webinar.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{webinar.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{webinar.participants} ishtirokchi</span>
                            </div>
                          </div>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs mt-2">
                            {webinar.category}
                          </span>
                        </div>
                        
                        <div className="ml-4">
                          <button
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              webinar.isLive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {webinar.isLive ? 'Qo\'shilish' : 'Ro\'yxatdan o\'tish'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 dark:bg-gray-950">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* New Post Button */}
            <button
              onClick={() => setShowNewPost(true)}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors mb-6 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yangi post
            </button>
            
            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
                <span className="font-medium">Jamiyat</span>
              </div>
              <button
                onClick={() => setActiveTab('feed')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'feed' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Lenta</span>
              </button>
              <button
                onClick={() => setActiveTab('experts')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'experts' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Star className="w-5 h-5" />
                <span>Ekspertlar</span>
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'groups' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Guruhlar</span>
              </button>
              <button
                onClick={() => setActiveTab('webinars')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'webinars' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>Vebinarnlar</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Jamiyat</h1>
                <p className="text-sm text-gray-600 dark:text-zinc-300">Professional forum va aloqalar markazi</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-3 gap-6">
                {/* Main Feed */}
                <div className="col-span-2 space-y-4">
                  {posts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-800 dark:text-zinc-100">{post.author.name}</h3>
                              {post.author.verified && (
                                <Verified className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-zinc-300">{post.author.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {post.isPinned && (
                            <div className="p-1 bg-orange-100 rounded">
                              <Award className="w-4 h-4 text-orange-600" />
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCategoryColor(post.category)}`}>
                            {getCategoryIcon(post.category)}
                            {getCategoryText(post.category)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Post Content */}
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">{post.content}</p>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs cursor-pointer hover:bg-blue-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-gray-600 dark:text-zinc-300 hover:text-blue-600">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 dark:text-zinc-300 hover:text-red-600">
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-sm">{post.dislikes}</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 dark:text-zinc-300 hover:text-blue-600">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 dark:text-zinc-300 hover:text-green-600">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">{post.views}</span>
                          </button>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-zinc-400">{post.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Top Users */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-600" />
                      Top foydalanuvchilar
                    </h3>
                    <div className="space-y-3">
                      {topUsers.map((user, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <UserCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-zinc-100 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-600 dark:text-zinc-300">{user.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-600">{user.reputation}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">rep</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trending Topics */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Trending mavzular
                    </h3>
                    <div className="space-y-2">
                      {trendingTopics.map((topic, index) => (
                        <button
                          key={index}
                          className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg"
                        >
                          <span className="text-sm text-blue-600 font-medium">{topic.tag}</span>
                          <span className="text-xs text-gray-500 dark:text-zinc-400">{topic.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Webinars */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-purple-600" />
                      Kelayotgan vebinarnlar
                    </h3>
                    <div className="space-y-3">
                      {webinars.slice(0, 2).map(webinar => (
                        <div key={webinar.id} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-800 dark:text-zinc-100 text-sm mb-1">{webinar.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-zinc-300 mb-2">{webinar.host}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-zinc-400">{webinar.date}</span>
                            <button className="text-xs text-blue-600 hover:text-blue-700">
                              Ro\'yxatdan o\'tish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-2xl mx-4 w-full">
            <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">Yangi post yaratish</h3>
            
            <div className="mb-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="O'z fikringizni bu yerga yozing..."
                className="w-full h-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Teglar</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagToggle(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 dark:text-zinc-300 hover:bg-gray-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewPost(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Bekor qilish
              </button>
              <button
                onClick={handlePostSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Yuborish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
