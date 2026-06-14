'use client';

import { useState } from 'react';
import { ArrowLeft, Award, Trophy, Star, Lock, Download, Share2, QrCode, TrendingUp, Target, Zap, Users, Calendar, Crown, Medal, Shield, Sword, BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'skill' | 'consistency' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rewardXP: number;
}

interface Certificate {
  id: string;
  title: string;
  description: string;
  issuedDate: string;
  course: string;
  instructor: string;
  certificateId: string;
  qrCode: string;
  downloadUrl: string;
  shareUrl: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  badges: number;
  weeklyChange: number;
  monthlyChange: number;
}

interface Level {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: React.ReactNode;
}

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<'badges' | 'certificates' | 'leaderboard' | 'progress'>('badges');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'global' | 'weekly' | 'monthly'>('global');

  // Mock data
  const currentXP = 3450;
  const currentLevel = 13;
  
  const levels: Level[] = [
    { level: 12, title: 'Boshlang\'ich yurist', minXP: 2500, maxXP: 3000, color: 'bg-gray-500', icon: <Shield className="w-6 h-6" /> },
    { level: 13, title: 'Tajribali yurist', minXP: 3000, maxXP: 4000, color: 'bg-blue-500', icon: <Sword className="w-6 h-6" /> },
    { level: 14, title: 'Katta yurist', minXP: 4000, maxXP: 5500, color: 'bg-purple-500', icon: <Crown className="w-6 h-6" /> },
    { level: 15, title: 'Ekspert yurist', minXP: 5500, maxXP: 7500, color: 'bg-orange-500', icon: <Trophy className="w-6 h-6" /> }
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Mantiq ustasi',
      description: '5 ta qiyin keysni xatosiz yeching',
      icon: <Target className="w-8 h-8" />,
      category: 'skill',
      rarity: 'rare',
      unlocked: true,
      unlockedAt: '2024-03-15',
      progress: 5,
      maxProgress: 5,
      rewardXP: 100
    },
    {
      id: '2',
      title: 'Qonun bilimdoni',
      description: 'Testlarda 100% natija ko\'rsating',
      icon: <BookOpen className="w-8 h-8" />,
      category: 'skill',
      rarity: 'epic',
      unlocked: true,
      unlockedAt: '2024-03-10',
      progress: 3,
      maxProgress: 3,
      rewardXP: 150
    },
    {
      id: '3',
      title: 'Tizimli yurist',
      description: 'Platformaga ketma-ket 30 kun kirish',
      icon: <Calendar className="w-8 h-8" />,
      category: 'consistency',
      rarity: 'common',
      unlocked: false,
      progress: 12,
      maxProgress: 30,
      rewardXP: 50
    },
    {
      id: '4',
      title: 'Notiq',
      description: 'Simulyatorda "mijoz" yoki "sudya"ni to\'liq ishontiring',
      icon: <Users className="w-8 h-8" />,
      category: 'social',
      rarity: 'legendary',
      unlocked: false,
      progress: 2,
      maxProgress: 5,
      rewardXP: 200
    },
    {
      id: '5',
      title: 'Birinchi g\'alaba',
      description: 'Birinchi keys muvaffaqiyatli yeching',
      icon: <Trophy className="w-8 h-8" />,
      category: 'milestone',
      rarity: 'common',
      unlocked: true,
      unlockedAt: '2024-02-20',
      progress: 1,
      maxProgress: 1,
      rewardXP: 25
    },
    {
      id: '6',
      title: 'Jamiyat faoli',
      description: 'Jamiyatda 50 ta foydali javob yozing',
      icon: <Star className="w-8 h-8" />,
      category: 'social',
      rarity: 'rare',
      unlocked: false,
      progress: 23,
      maxProgress: 50,
      rewardXP: 75
    },
    {
      id: '7',
      title: 'Pro vositalar mukammoti',
      description: 'Barcha pro vositalardan foydalaning',
      icon: <Zap className="w-8 h-8" />,
      category: 'milestone',
      rarity: 'epic',
      unlocked: false,
      progress: 3,
      maxProgress: 4,
      rewardXP: 125
    },
    {
      id: '8',
      title: 'Qonunlar ustasi',
      description: 'Qonunlar bazasidan 100 marta foydalaning',
      icon: <Shield className="w-8 h-8" />,
      category: 'consistency',
      rarity: 'common',
      unlocked: true,
      unlockedAt: '2024-03-05',
      progress: 100,
      maxProgress: 100,
      rewardXP: 40
    }
  ];

  const certificates: Certificate[] = [
    {
      id: '1',
      title: 'Fuqarolik huquqi asoslari',
      description: 'Fuqarolik huquqining asosiy tamoyillarini o\'zlashtirish bo\'yicha sertifikat',
      issuedDate: '2024-03-01',
      course: 'Fuqarolik huquqi kursi',
      instructor: 'Prof. Dilora Nazarova',
      certificateId: 'JURISAI-2024-FQ-001',
      qrCode: 'QR-123456789',
      downloadUrl: '/certificates/fq-civil-law.pdf',
      shareUrl: 'https://jurisai.ai/cert/fq-civil-law'
    },
    {
      id: '2',
      title: 'Jinoyat protsessual huquqi',
      description: 'Jinoyat protsessual huquqini chuqur o\'rganish bo\'yicha sertifikat',
      issuedDate: '2024-02-15',
      course: 'Jinoyat huquqi kursi',
      instructor: 'Dr. Aziz Karimov',
      certificateId: 'JURISAI-2024-JP-002',
      qrCode: 'QR-987654321',
      downloadUrl: '/certificates/jp-criminal-procedure.pdf',
      shareUrl: 'https://jurisai.ai/cert/jp-criminal-procedure'
    },
    {
      id: '3',
      title: 'Virtual Sud mahorati',
      description: 'Virtual sud simulyatsiyasida mukammallik ko\'rsatgani uchun',
      issuedDate: '2024-01-20',
      course: 'Virtual Sud moduli',
      instructor: 'AI Assistent',
      certificateId: 'JURISAI-2024-VS-003',
      qrCode: 'QR-456789123',
      downloadUrl: '/certificates/vs-virtual-court.pdf',
      shareUrl: 'https://jurisai.ai/cert/vs-virtual-court'
    }
  ];

  const globalLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Dilora Nazarova', avatar: '👩‍🏫', level: 18, xp: 8950, badges: 24, weeklyChange: 0, monthlyChange: 2 },
    { rank: 2, name: 'Aziz Karimov', avatar: '👨‍🏫', level: 17, xp: 8230, badges: 22, weeklyChange: 1, monthlyChange: 3 },
    { rank: 3, name: 'Malika Umarova', avatar: '👩‍💼', level: 16, xp: 7650, badges: 19, weeklyChange: -1, monthlyChange: 1 },
    { rank: 4, name: 'Bahodir Toshmatov', avatar: '👨‍⚖️', level: 15, xp: 6890, badges: 17, weeklyChange: 2, monthlyChange: 4 },
    { rank: 5, name: 'Jamshid Xaydarov', avatar: '👨‍💼', level: 14, xp: 5980, badges: 15, weeklyChange: 0, monthlyChange: -2 },
    { rank: 42, name: 'Siz', avatar: '👤', level: 13, xp: 3450, badges: 8, weeklyChange: 3, monthlyChange: 5 }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-orange-300 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'skill': return 'bg-blue-100 text-blue-700';
      case 'consistency': return 'bg-green-100 text-green-700';
      case 'social': return 'bg-purple-100 text-purple-700';
      case 'milestone': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressPercentage = () => {
    const currentLevelData = levels.find(l => l.level === currentLevel);
    if (!currentLevelData) return 0;
    
    const levelXP = currentXP - currentLevelData.minXP;
    const levelRange = currentLevelData.maxXP - currentLevelData.minXP;
    return (levelXP / levelRange) * 100;
  };

  const getXPToNextLevel = () => {
    const currentLevelData = levels.find(l => l.level === currentLevel);
    if (!currentLevelData) return 0;
    return currentLevelData.maxXP - currentXP;
  };

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
            
            {/* Level Progress */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 ${levels.find(l => l.level === currentLevel)?.color} rounded-full flex items-center justify-center text-white`}>
                    {levels.find(l => l.level === currentLevel)?.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{currentLevel}-daraja</p>
                    <p className="text-xs text-gray-600">{levels.find(l => l.level === currentLevel)?.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{currentXP.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">XP</p>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                Keyingi darajagacha {getXPToNextLevel()} XP
              </p>
            </div>
            
            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <Award className="w-5 h-5" />
                <span className="font-medium">Yutuqlar</span>
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
                <h1 className="text-2xl font-bold text-gray-800">Yutuqlar</h1>
                <p className="text-sm text-gray-600">Motivatsiya markazi - barcha muvaffaqiyatlaringiz</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-orange-600">
                    #{globalLeaderboard.find(e => e.name === 'Siz')?.rank} Global
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex gap-4">
              {[
                { id: 'badges', label: 'Nishonlar', icon: <Award className="w-4 h-4" /> },
                { id: 'certificates', label: 'Sertifikatlar', icon: <Medal className="w-4 h-4" /> },
                { id: 'leaderboard', label: 'Reyting', icon: <TrendingUp className="w-4 h-4" /> },
                { id: 'progress', label: 'Progress', icon: <Target className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{achievements.filter(a => a.unlocked).length}</p>
                          <p className="text-sm text-gray-600">Ochilgan</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Lock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{achievements.filter(a => !a.unlocked).length}</p>
                          <p className="text-sm text-gray-600">Qulflangan</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{achievements.reduce((sum, a) => sum + a.rewardXP, 0)}</p>
                          <p className="text-sm text-gray-600">Jami XP</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{achievements.filter(a => a.rarity === 'legendary').length}</p>
                          <p className="text-sm text-gray-600">Legendary</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {achievements.map(achievement => (
                      <div
                        key={achievement.id}
                        onClick={() => setSelectedAchievement(achievement)}
                        className={`relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer border-2 ${
                          achievement.unlocked ? getRarityColor(achievement.rarity) : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        {!achievement.unlocked && (
                          <div className="absolute inset-0 bg-gray-100 bg-opacity-90 rounded-2xl flex items-center justify-center">
                            <Lock className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="text-center">
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                            achievement.unlocked ? 'bg-white' : 'bg-gray-200'
                          }`}>
                            <div className={achievement.unlocked ? '' : 'grayscale'}>
                              {achievement.icon}
                            </div>
                          </div>
                          
                          <h3 className={`font-bold text-gray-800 mb-2 ${!achievement.unlocked && 'text-gray-500'}`}>
                            {achievement.title}
                          </h3>
                          
                          <p className={`text-sm text-gray-600 mb-3 ${!achievement.unlocked && 'text-gray-400'}`}>
                            {achievement.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(achievement.category)}`}>
                              {achievement.category}
                            </span>
                            <span className={`text-xs font-medium ${getRarityTextColor(achievement.rarity)}`}>
                              {achievement.rarity}
                            </span>
                          </div>
                          
                          {achievement.unlocked ? (
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{achievement.unlockedAt}</span>
                              <span>+{achievement.rewardXP} XP</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500">
                                {achievement.progress}/{achievement.maxProgress}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates Tab */}
              {activeTab === 'certificates' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {certificates.map(certificate => (
                      <div key={certificate.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                              <Medal className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">{certificate.title}</h3>
                              <p className="text-sm text-gray-600">{certificate.course}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Faol
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{certificate.description}</p>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex justify-between">
                            <span>Sertifikat ID:</span>
                            <span className="font-mono text-xs">{certificate.certificateId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ustozi:</span>
                            <span>{certificate.instructor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Berilgan sana:</span>
                            <span>{certificate.issuedDate}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCertificate(certificate)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <QrCode className="w-4 h-4" />
                            QR kod
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <Download className="w-4 h-4" />
                            Yuklab olish
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <Share2 className="w-4 h-4" />
                            Ulashish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                  {/* Period Selector */}
                  <div className="flex justify-center">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {[
                        { value: 'global', label: 'Global' },
                        { value: 'weekly', label: 'Haftalik' },
                        { value: 'monthly', label: 'Oylik' }
                      ].map(period => (
                        <button
                          key={period.value}
                          onClick={() => setLeaderboardPeriod(period.value as any)}
                          className={`px-6 py-2 rounded-md transition-colors ${
                            leaderboardPeriod === period.value
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Top 3 Podium */}
                  <div className="flex justify-center items-end gap-8 mb-8">
                    {globalLeaderboard.slice(0, 3).map((entry, index) => (
                      <div key={entry.rank} className="text-center">
                        <div className={`relative ${
                          index === 0 ? 'w-24 h-24' : index === 1 ? 'w-20 h-20' : 'w-16 h-16'
                        } bg-gradient-to-br ${
                          index === 0 ? 'from-yellow-400 to-yellow-600' : 
                          index === 1 ? 'from-gray-300 to-gray-500' : 
                          'from-orange-300 to-orange-500'
                        } rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2`}>
                          {entry.avatar}
                        </div>
                        <div className={`${
                          index === 0 ? 'h-32' : index === 1 ? 'h-24' : 'h-16'
                        } bg-gradient-to-t ${
                          index === 0 ? 'from-yellow-100 to-yellow-50' : 
                          index === 1 ? 'from-gray-100 to-gray-50' : 
                          'from-orange-100 to-orange-50'
                        } rounded-t-lg flex items-center justify-center`}>
                          <div className="text-center">
                            <p className="font-bold text-gray-800">{entry.name}</p>
                            <p className="text-sm text-gray-600">{entry.level}-daraja</p>
                            <p className="text-lg font-bold text-blue-600">{entry.xp.toLocaleString()} XP</p>
                          </div>
                        </div>
                        <div className={`${
                          index === 0 ? 'w-16 h-8' : index === 1 ? 'w-14 h-6' : 'w-12 h-4'
                        } ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-500' : 
                          'bg-orange-500'
                        } rounded-t-lg flex items-center justify-center text-white font-bold`}>
                          {entry.rank}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Leaderboard List */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foydalanuvchi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daraja</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nishonlar</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">O\'zgarish</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {globalLeaderboard.map((entry) => (
                          <tr key={entry.rank} className={entry.name === 'Siz' ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                entry.rank <= 3 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {entry.rank}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  {entry.avatar}
                                </div>
                                <span className="font-medium text-gray-900">{entry.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                {entry.level}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-bold text-blue-600">{entry.xp.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-gray-600">{entry.badges}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {leaderboardPeriod === 'weekly' && (
                                  <span className={`text-sm ${entry.weeklyChange > 0 ? 'text-green-600' : entry.weeklyChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {entry.weeklyChange > 0 ? '↑' : entry.weeklyChange < 0 ? '↓' : '→'} {Math.abs(entry.weeklyChange)}
                                  </span>
                                )}
                                {leaderboardPeriod === 'monthly' && (
                                  <span className={`text-sm ${entry.monthlyChange > 0 ? 'text-green-600' : entry.monthlyChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {entry.monthlyChange > 0 ? '↑' : entry.monthlyChange < 0 ? '↓' : '→'} {Math.abs(entry.monthlyChange)}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === 'progress' && (
                <div className="space-y-6">
                  {/* Current Level Details */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Daraja progress</h3>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className={`w-20 h-20 ${levels.find(l => l.level === currentLevel)?.color} rounded-full flex items-center justify-center text-white`}>
                        {levels.find(l => l.level === currentLevel)?.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-1">
                          {currentLevel}-daraja: {levels.find(l => l.level === currentLevel)?.title}
                        </h4>
                        <p className="text-gray-600 mb-3">
                          Jami {currentXP.toLocaleString()} XP • {getXPToNextLevel()} XP keyingi darajagacha
                        </p>
                        <div className="bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${getProgressPercentage()}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Upcoming Levels */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Kelajakdagi darajalar</h4>
                      {levels.filter(l => l.level > currentLevel).slice(0, 3).map(level => (
                        <div key={level.level} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 ${level.color} rounded-full flex items-center justify-center text-white opacity-50`}>
                            {level.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{level.level}-daraja: {level.title}</p>
                            <p className="text-sm text-gray-600">{level.minXP.toLocaleString()} - {level.maxXP.toLocaleString()} XP</p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {level.minXP - currentXP > 0 ? `${level.minXP - currentXP} XP qoldi` : 'Ochilgan'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* XP Sources */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">XP manbalari</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-800">Nishonlar</span>
                        </div>
                        <span className="font-bold text-green-600">+{achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.rewardXP, 0)} XP</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-800">Topshiriqlar</span>
                        </div>
                        <span className="font-bold text-blue-600">+1,250 XP</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-gray-800">Jamiyat faolligi</span>
                        </div>
                        <span className="font-bold text-purple-600">+450 XP</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-gray-800">Kunlik kirish</span>
                        </div>
                        <span className="font-bold text-orange-600">+300 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 w-full">
            <div className="text-center mb-4">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                selectedAchievement.unlocked ? 'bg-white' : 'bg-gray-200'
              }`}>
                <div className={selectedAchievement.unlocked ? '' : 'grayscale'}>
                  {selectedAchievement.icon}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedAchievement.title}</h3>
              <p className="text-gray-600 mb-4">{selectedAchievement.description}</p>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedAchievement.category)}`}>
                  {selectedAchievement.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityTextColor(selectedAchievement.rarity)}`}>
                  {selectedAchievement.rarity}
                </span>
              </div>
              
              {selectedAchievement.unlocked ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800 mb-1">Ochilgan!</p>
                    <p className="text-sm text-green-600">{selectedAchievement.unlockedAt}</p>
                  </div>
                  <p className="text-sm text-gray-600">Mukofot: +{selectedAchievement.rewardXP} XP</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-3">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      Bu yutuqni ochish uchun: <strong>{selectedAchievement.maxProgress - selectedAchievement.progress}</strong> ta harakat qiling
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedAchievement(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate QR Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Sertifikat QR kodi</h3>
            
            <div className="text-center mb-4">
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{selectedCertificate.certificateId}</p>
              <p className="text-xs text-gray-500">Bu QR kod orqali sertifikatning haqiqiyligini tekshirishingiz mumkin</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Yopish
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Rasmga saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
