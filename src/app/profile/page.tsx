'use client';

import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Lock, Globe, Edit3, Award, BookOpen, TrendingUp, Star, FileText, Briefcase, Camera, CheckCircle, Crown, Settings, Target } from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'Talaba' | 'Magistrant' | 'Amaliyotchi yurist' | 'Professional yurist';
  specialization: string;
  avatar: string;
  subscription: 'Free' | 'Pro';
  subscriptionEnd?: string;
  language: 'uz' | 'en' | 'ru';
  xp: number;
  coursesCount: number;
  rating: number;
  certificates: number;
  workSamples: {
    id: string;
    title: string;
    type: 'case' | 'document';
    date: string;
    description: string;
  }[];
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'portfolio'>('overview');
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    firstName: 'Sarvar',
    lastName: 'Karimov',
    email: 'sarvar.karimov@example.com',
    phone: '+998 90 123 45 67',
    status: 'Talaba',
    specialization: 'Jinoyat huquqi',
    avatar: '👨‍💼',
    subscription: 'Pro',
    subscriptionEnd: '2024-12-31',
    language: 'uz',
    xp: 2450,
    coursesCount: 3,
    rating: 156,
    certificates: 12,
    workSamples: [
      {
        id: '1',
        title: 'Jinoyat ishi №245 - Yechimi',
        type: 'case',
        date: '2024-03-15',
        description: 'O\'g\'irlik holati bo\'yicha muvaffaqiyatli yechim'
      },
      {
        id: '2',
        title: 'Shartnoma namunasi',
        type: 'document',
        date: '2024-03-10',
        description: 'Tijorat shartnomasi uchun professional namuna'
      },
      {
        id: '3',
        title: 'Fuqarolik ishi №112',
        type: 'case',
        date: '2024-03-05',
        description: 'Mulk nizoli bo\'yicha to\'g\'ri yondashuv'
      }
    ]
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Talaba': return 'bg-blue-100 text-blue-700';
      case 'Magistrant': return 'bg-purple-100 text-purple-700';
      case 'Amaliyotchi yurist': return 'bg-green-100 text-green-700';
      case 'Professional yurist': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSubscriptionColor = (subscription: string) => {
    return subscription === 'Pro' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'uz': return 'O\'zbekcha';
      case 'en': return 'Inglizcha';
      case 'ru': return 'Ruscha';
      default: return lang;
    }
  };

  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-[#f8faff]">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Sozlamalar</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <header className="bg-white px-8 py-4 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800">Akkaunt sozlamalari</h1>
            </header>

            <main className="p-8">
              <div className="max-w-2xl mx-auto">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Shaxsiy ma\'lumotlar</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ism</label>
                        <input
                          type="text"
                          value={editedProfile.firstName}
                          onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Familiya</label>
                        <input
                          type="text"
                          value={editedProfile.lastName}
                          onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Elektron pochta</label>
                      <input
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefon raqami</label>
                      <input
                        type="tel"
                        value={editedProfile.phone}
                        onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maqomi</label>
                      <select
                        value={editedProfile.status}
                        onChange={(e) => setEditedProfile({...editedProfile, status: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Talaba">Talaba</option>
                        <option value="Magistrant">Magistrant</option>
                        <option value="Amaliyotchi yurist">Amaliyotchi yurist</option>
                        <option value="Professional yurist">Professional yurist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mutaxassislik</label>
                      <input
                        type="text"
                        value={editedProfile.specialization}
                        onChange={(e) => setEditedProfile({...editedProfile, specialization: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Akkaunt sozlamalari</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parol</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Joriy parol"
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                          O\'zgartirish
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Til</label>
                      <select
                        value={editedProfile.language}
                        onChange={(e) => setEditedProfile({...editedProfile, language: e.target.value as any})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="uz">O\'zbekcha</option>
                        <option value="en">Inglizcha</option>
                        <option value="ru">Ruscha</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Obuna ma\'lumotlari</h2>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-800">Pro obuna</p>
                        <p className="text-sm text-gray-600">Tugash muddati: {editedProfile.subscriptionEnd}</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                      Boshqarish
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'portfolio') {
    return (
      <div className="min-h-screen bg-[#f8faff]">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium">Portfolyo</span>
                </div>
              </nav>
            </div>
          </div>

          {/* Portfolio Content */}
          <div className="flex-1">
            <header className="bg-white px-8 py-4 border-b border-gray-100">
              <h1 className="text-2xl font-bold text-gray-800">Professional Portfolyo</h1>
            </header>

            <main className="p-8">
              <div className="max-w-4xl mx-auto">
                {/* Certificates Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Sertifikatlar</h2>
                    <a href="/my-courses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Barchasini ko'rish →
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                          <Award className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-800 mb-1">Sertifikat #{i}</h3>
                        <p className="text-sm text-gray-600 mb-2">Kurs nomi</p>
                        <p className="text-xs text-gray-500">2024-03-{15 - i}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Samples Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Ish namunalari</h2>
                  
                  <div className="space-y-4">
                    {profile.workSamples.map((sample) => (
                      <div key={sample.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {sample.type === 'case' ? (
                                <FileText className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Briefcase className="w-4 h-4 text-green-600" />
                              )}
                              <h3 className="font-medium text-gray-800">{sample.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{sample.description}</p>
                            <p className="text-xs text-gray-500">{sample.date}</p>
                          </div>
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                            Ko'rish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Sample Button */}
                  <button className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span>Yangi namuna qo'shish</span>
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

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Daily Goal Block */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800">Kundalik maqsad</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">2 ta case qolgan</p>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <User className="w-5 h-5" />
                <span className="font-medium">Profil</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Profil</h1>
                <p className="text-sm text-gray-600">Shaxsiy guvohnoma va boshqaruv paneli</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sozlamalar
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Portfolyo
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl">
                      {profile.avatar}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.status)}`}>
                        {profile.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionColor(profile.subscription)}`}>
                        {profile.subscription === 'Pro' && <Crown className="w-3 h-3 inline mr-1" />}
                        {profile.subscription}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{profile.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <span>{getLanguageName(profile.language)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Specialization */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Mutaxassislik</p>
                  <p className="font-medium text-gray-800">{profile.specialization}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{profile.xp.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">XP</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{profile.coursesCount}</p>
                      <p className="text-sm text-gray-600">Kurslar</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">#{profile.rating}</p>
                      <p className="text-sm text-gray-600">Reyting</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{profile.certificates}</p>
                      <p className="text-sm text-gray-600">Sertifikatlar</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">So\'nggi faoliyat</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Case Solver - Jinoyat ishi №245</p>
                      <p className="text-sm text-gray-600">85 ball bilan yakunlandi</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">2 soat oldin</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Sertifikat olindi</p>
                      <p className="text-sm text-gray-600">Jinoyat huquqi asoslari kursi</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">1 kun oldin</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Reyting oshdi</p>
                      <p className="text-sm text-gray-600">156 → 165 o'ringa ko'tarildi</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">3 kun oldin</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
