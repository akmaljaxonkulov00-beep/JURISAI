'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Trophy, Star, Lock, Download, Share2, QrCode, TrendingUp, Target, Zap, Users, Calendar, Crown, Medal, Shield, Sword, BookOpen, Clock, CheckCircle, AlertCircle, Search, Filter, Play, Video, FileText, User, Bell, Gavel, MessageCircle, GraduationCap, Database, BarChart3, Settings, Plus, Send, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// ==================== ACHIEVEMENTS PAGE ====================
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

export function AchievementsPage() {
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
    }
  ];

  const globalLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Dilora Nazarova', avatar: '👩‍🏫', level: 18, xp: 8950, badges: 24, weeklyChange: 0, monthlyChange: 2 },
    { rank: 2, name: 'Aziz Karimov', avatar: '👨‍🏫', level: 17, xp: 8230, badges: 22, weeklyChange: 1, monthlyChange: 3 },
    { rank: 3, name: 'Malika Umarova', avatar: '👩‍💼', level: 16, xp: 7650, badges: 19, weeklyChange: -1, monthlyChange: 1 },
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

                  {/* Leaderboard Table */}
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foydalanuvchi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daraja</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nishonlar</th>
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
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ==================== MY COURSES PAGE ====================
interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  mentor: {
    name: string;
    title: string;
    avatar: string;
  };
  totalLessons: number;
  completedLessons: number;
  progress: number;
  status: 'ongoing' | 'completed' | 'enrolled';
  duration: string;
  level: 'Boshlang\'ich' | 'O\'rta' | 'Yuqori';
  certificate?: {
    id: string;
    issuedDate: string;
    qrCode: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'text' | 'interactive';
  completed: boolean;
  materials: {
    type: 'pdf' | 'doc' | 'video' | 'test';
    title: string;
    url: string;
  }[];
}

export function MyCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed' | 'enrolled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  // Mock courses data
  const courses: Course[] = [
    {
      id: '1',
      title: 'Fuqarolik huquqi asoslari',
      description: 'O\'zbekiston Respublikasi Fuqarolik kodeksining asosiy tamoyillari',
      image: '/courses/civil-law.jpg',
      category: 'Fuqarolik huquqi',
      mentor: {
        name: 'Prof. Dilora Nazarova',
        title: 'Huquqshunoslik fanlari doktori',
        avatar: '/mentors/nazarova.jpg'
      },
      totalLessons: 12,
      completedLessons: 8,
      progress: 67,
      status: 'ongoing',
      duration: '6 hafta',
      level: 'Boshlang\'ich'
    },
    {
      id: '2',
      title: 'Jinoyat protsessual huquqi',
      description: 'Jinoyat protsessual huquqining asosiy tushunchalari',
      image: '/courses/criminal-procedure.jpg',
      category: 'Jinoyat huquqi',
      mentor: {
        name: 'Dr. Aziz Karimov',
        title: 'Huquqshunoslik fanlari nomzodi',
        avatar: '/mentors/karimov.jpg'
      },
      totalLessons: 15,
      completedLessons: 15,
      progress: 100,
      status: 'completed',
      duration: '8 hafta',
      level: 'O\'rta',
      certificate: {
        id: 'JURISAI-2024-JP-002',
        issuedDate: '2024-02-15',
        qrCode: 'QR-987654321'
      }
    },
    {
      id: '3',
      title: 'Virtual Sud simulyatsiyasi',
      description: 'Sud jarayonini virtual muhitda o\'rganish',
      image: '/courses/virtual-court.jpg',
      category: 'Amaliyot',
      mentor: {
        name: 'AI Assistent',
        title: 'Virtual Mentor',
        avatar: '/mentors/ai-assistant.jpg'
      },
      totalLessons: 8,
      completedLessons: 0,
      progress: 0,
      status: 'enrolled',
      duration: '4 hafta',
      level: 'Yuqori'
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'enrolled': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Boshlang\'ich': return 'bg-green-100 text-green-700';
      case 'O\'rta': return 'bg-yellow-100 text-yellow-700';
      case 'Yuqori': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Stats Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Kurslar statistikasi</h3>
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jami kurslar:</span>
                  <span className="text-sm font-bold text-gray-800">{courses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bajarilgan:</span>
                  <span className="text-sm font-bold text-green-600">{courses.filter(c => c.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Davom etayotgan:</span>
                  <span className="text-sm font-bold text-blue-600">{courses.filter(c => c.status === 'ongoing').length}</span>
                </div>
              </div>
            </div>
            
            {/* Filter Menu */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <GraduationCap className="w-5 h-5" />
                <span className="font-medium">Mening kurslarim</span>
              </div>
              
              {[
                { id: 'all', label: 'Barchasi', count: courses.length },
                { id: 'ongoing', label: 'Davom etayotgan', count: courses.filter(c => c.status === 'ongoing').length },
                { id: 'completed', label: 'Bajarilgan', count: courses.filter(c => c.status === 'completed').length },
                { id: 'enrolled', label: 'Ro\'yxatdan o\'tilgan', count: courses.filter(c => c.status === 'enrolled').length }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                    filter === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mening kurslarim</h1>
                <p className="text-sm text-gray-600">O\'qish jarayoningiz va yutuqlaringiz</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Kurslarni qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                
                <Button className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>
            </div>
          </header>

          {/* Courses Grid */}
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className={getStatusColor(course.status)}>
                          {course.status === 'ongoing' ? 'Davom etmoqda' :
                           course.status === 'completed' ? 'Bajarildi' : 'Ro\'yxatdan o\'tilgan'}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {course.category}
                          </Badge>
                          <Badge className={getLevelColor(course.level)}>
                            {course.level}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {course.completedLessons}/{course.totalLessons} dars
                        </p>
                      </div>
                      
                      {/* Mentor Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{course.mentor.name}</p>
                          <p className="text-xs text-gray-600">{course.mentor.title}</p>
                        </div>
                      </div>
                      
                      {/* Duration */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => setSelectedCourse(course)}
                        >
                          {course.status === 'completed' ? 'Qayta ko\'rish' : 'Davom ettirish'}
                        </Button>
                        
                        {course.certificate && (
                          <Button 
                            variant="outline"
                            onClick={() => setShowCertificate(true)}
                          >
                            <Award className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ==================== TASKS PAGE ====================
interface Task {
  id: string;
  title: string;
  description: string;
  type: 'case-study' | 'document-prep' | 'research';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'new' | 'in-progress' | 'completed' | 'submitted' | 'graded';
  deadline: string;
  maxScore: number;
  currentScore?: number;
  feedback?: string;
  instructor?: string;
  createdAt: string;
  submittedAt?: string;
  gradedAt?: string;
  canResubmit: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
}

export function TasksPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'new' | 'in-progress' | 'completed'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'case-study' | 'document-prep' | 'research'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');

  // Mock tasks data
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Jinoyat ishi #245 - O\'g\'irlik holati',
      description: 'Berilgan faktlar asosida jinoyat ishini IRAC metodi bilan tahlil qiling. Tuman prokuraturasi tomonidan qo\'yilgan ayblovni o\'rganing.',
      type: 'case-study',
      difficulty: 'medium',
      status: 'new',
      deadline: '2024-03-28',
      maxScore: 100,
      priority: 'high',
      estimatedTime: 3,
      createdAt: '2024-03-20',
      canResubmit: false
    },
    {
      id: '2',
      title: 'Shartnoma tuzish hujjati',
      description: 'Tijorat shartnomasi uchun to\'liq huquqiy hujjat tayyorlang. Shartnoma shartlari, tomonlar majburiyatlari va javobgarligini ko\'rsating.',
      type: 'document-prep',
      difficulty: 'hard',
      status: 'in-progress',
      deadline: '2024-03-30',
      maxScore: 150,
      priority: 'medium',
      estimatedTime: 5,
      createdAt: '2024-03-18',
      canResubmit: true
    },
    {
      id: '3',
      title: 'Fuqarolik kodeksining yangiliklari',
      description: 'O\'zbekiston Respublikasi Fuqarolik kodeksiga kiritilgan so\'nggi o\'zgarishlarni o\'rganing va ularning amaliy ahamiyatini tahlil qiling.',
      type: 'research',
      difficulty: 'easy',
      status: 'completed',
      deadline: '2024-03-25',
      maxScore: 80,
      currentScore: 75,
      feedback: 'A\'lo ish! Yangiliklarni to\'g\'ri tahlil qilganingiz va amaliy misollar keltirganingiz uchun yuqori baholandingiz.',
      instructor: 'Prof. Dilora Nazarova',
      priority: 'medium' as const,
      estimatedTime: 2,
      createdAt: '2024-03-15',
      submittedAt: '2024-03-24',
      gradedAt: '2024-03-25',
      canResubmit: false
    }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = selectedFilter === 'all' || task.status === selectedFilter;
    const matchesType = selectedType === 'all' || task.type === selectedType;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'submitted': return 'bg-purple-100 text-purple-700';
      case 'graded': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'case-study': return <Gavel className="w-4 h-4" />;
      case 'document-prep': return <FileText className="w-4 h-4" />;
      case 'research': return <BookOpen className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'in-progress': return 'Jarayonda';
      case 'completed': return 'Bajarildi';
      case 'submitted': return 'Topshirildi';
      case 'graded': return 'Baholandi';
      default: return status;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Oson';
      case 'medium': return 'O\'rta';
      case 'hard': return 'Qiyin';
      default: return difficulty;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Past';
      case 'medium': return 'O\'rta';
      case 'high': return 'Yuqori';
      default: return priority;
    }
  };

  const handleSubmitTask = () => {
    // Mock submission logic
    setShowSubmissionModal(false);
    setSubmissionContent('');
    alert('Topshiriq muvaffaqiyatli topshirildi!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Stats Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Topshiriqlar statistikasi</h3>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jami topshiriqlar:</span>
                  <span className="text-sm font-bold text-gray-800">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bajarilgan:</span>
                  <span className="text-sm font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Jarayonda:</span>
                  <span className="text-sm font-bold text-blue-600">{tasks.filter(t => t.status === 'in-progress').length}</span>
                </div>
              </div>
            </div>
            
            {/* Filter Menu */}
            <nav className="space-y-4">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Topshiriqlar</span>
              </div>
              
              {/* Status Filter */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Holati bo\'yicha</p>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'Barchasi', count: tasks.length },
                    { id: 'new', label: 'Yangi', count: tasks.filter(t => t.status === 'new').length },
                    { id: 'in-progress', label: 'Jarayonda', count: tasks.filter(t => t.status === 'in-progress').length },
                    { id: 'completed', label: 'Bajarildi', count: tasks.filter(t => t.status === 'completed').length }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFilter(item.id as any)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                        selectedFilter === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">{item.label}</span>
                      <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Type Filter */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Turi bo\'yicha</p>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'Barchasi', count: tasks.length },
                    { id: 'case-study', label: 'Case Study', count: tasks.filter(t => t.type === 'case-study').length },
                    { id: 'document-prep', label: 'Hujjat tayyorlash', count: tasks.filter(t => t.type === 'document-prep').length },
                    { id: 'research', label: 'Tadqiqot', count: tasks.filter(t => t.type === 'research').length }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedType(item.id as any)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                        selectedType === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm flex items-center gap-2">
                        {getTypeIcon(item.id)}
                        {item.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                    </button>
                  ))}
                </div>
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
                <h1 className="text-2xl font-bold text-gray-800">Topshiriqlar</h1>
                <p className="text-sm text-gray-600">O\'qish vazifalari va topshiriqlar</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Topshiriqlarni qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Yangi topshiriq
                </Button>
              </div>
            </div>
          </header>

          {/* Tasks List */}
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-4">
                {filteredTasks.map(task => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusText(task.status)}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityText(task.priority)} prioritet
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{task.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              {getTypeIcon(task.type)}
                              <span>{task.type === 'case-study' ? 'Case Study' :
                                     task.type === 'document-prep' ? 'Hujjat tayyorlash' : 'Tadqiqot'}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>{getDifficultyText(task.difficulty)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{task.estimatedTime} soat</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Muddat: {task.deadline}</span>
                            </div>
                          </div>
                          
                          {/* Score Display */}
                          {task.currentScore !== undefined && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">Ball</span>
                                <span className="font-medium">{task.currentScore}/{task.maxScore}</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${(task.currentScore / task.maxScore) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Feedback */}
                          {task.feedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">{task.instructor}</span>
                              </div>
                              <p className="text-sm text-blue-700">{task.feedback}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            {task.status === 'new' ? 'Boshlash' :
                             task.status === 'in-progress' ? 'Davom ettirish' :
                             task.status === 'completed' ? 'Qayta ko\'rish' :
                             'Ko\'rish'}
                          </Button>
                          
                          {(task.status === 'in-progress' || (task.status === 'graded' && task.canResubmit)) && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowSubmissionModal(true)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Topshirish
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Topshiriqni topshirish</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Javobingiz
              </label>
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Topshiriq javobini bu yerga yozing..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSubmissionModal(false)}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleSubmitTask}>
                Topshirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SIMULATOR PAGE ====================
interface Character {
  id: string;
  name: string;
  role: string;
  avatar: string;
  mood: 'happy' | 'neutral' | 'angry' | 'suspicious';
  personality: string;
}

interface Message {
  id: string;
  character: string;
  text: string;
  timestamp: Date;
  type: 'ai' | 'user';
}

interface SimulationResult {
  legalAccuracy: number;
  ethics: number;
  confidence: number;
  totalScore: number;
  xpEarned: number;
  achievements: string[];
}

export function SimulatorPage() {
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [stressLevel, setStressLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const simulations = [
    {
      id: 'court',
      title: 'Sud jarayoni',
      description: 'Sudya, advokat yoki prokuror rolini o\'ynang',
      icon: <Gavel className="w-6 h-6" />,
      duration: '30 daqiqa',
      difficulty: 'O\'rta',
      participants: 3
    },
    {
      id: 'client',
      title: 'Mijoz maslahati',
      description: 'Mijozga huquqiy maslahat bering',
      icon: <User className="w-6 h-6" />,
      duration: '20 daqiqa',
      difficulty: 'Oson',
      participants: 2
    },
    {
      id: 'negotiation',
      title: 'Muzokaralar',
      description: 'Tomonlar o\'rtasida muzokaralar olib boring',
      icon: <MessageCircle className="w-6 h-6" />,
      duration: '25 daqiqa',
      difficulty: 'Qiyin',
      participants: 4
    }
  ];

  const roles = [
    { id: 'judge', name: 'Sudya', description: 'Adolatli va obyektiv qaror qabul qiling' },
    { id: 'lawyer', name: 'Advokat', description: 'Mijozning huquqlarini himoya qiling' },
    { id: 'prosecutor', name: 'Prokuror', description: 'Davlat manfaatini himoya qiling' },
    { id: 'defendant', name: 'Javobgar', description: 'O\'z pozitsiyangizni himoya qiling' }
  ];

  const characters: Character[] = [
    {
      id: 'judge',
      name: 'Sudya Karimov',
      role: 'Sudya',
      avatar: '👨‍⚖️',
      mood: 'neutral',
      personality: 'Adolatli, qattiqqo\'l, qonunga sod'
    },
    {
      id: 'prosecutor',
      name: 'Prokurora Aliyeva',
      role: 'Prokuror',
      avatar: '👩‍💼',
      mood: 'angry' as const,
      personality: 'Tajribali, ehtiyotkor, dalillarga asoslangan'
    },
    {
      id: 'lawyer',
      name: 'Advokat Toshmatov',
      role: 'Advokat',
      avatar: '👨‍💼',
      mood: 'neutral' as const,
      personality: 'Iste\'dodli, tezkor, mantiqiy'
    }
  ];

  useEffect(() => {
    if (isSimulating && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        setStressLevel(prev => Math.min(prev + 1, 100));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isSimulating) {
      endSimulation();
    }
  }, [isSimulating, timeLeft]);

  const startSimulation = (simulationId: string, roleId: string) => {
    setSelectedSimulation(simulationId);
    setSelectedRole(roleId);
    setIsSimulating(true);
    setTimeLeft(30);
    setStressLevel(0);
    setMessages([]);
    
    // Set initial character
    const initialCharacter = characters.find(c => c.id === 'judge');
    setCurrentCharacter(initialCharacter || null);
    
    // Add initial AI message
    const initialMessage: Message = {
      id: Date.now().toString(),
      character: 'judge',
      text: 'Sud jarayoni boshlandi. Iltimos, ishning mohiyatini bayon qiling.',
      timestamp: new Date(),
      type: 'ai'
    };
    setMessages([initialMessage]);
  };

  const endSimulation = () => {
    setIsSimulating(false);
    
    // Generate mock results
    const mockResults: SimulationResult = {
      legalAccuracy: Math.floor(Math.random() * 30) + 70,
      ethics: Math.floor(Math.random() * 20) + 80,
      confidence: Math.floor(Math.random() * 25) + 75,
      totalScore: 0,
      xpEarned: Math.floor(Math.random() * 50) + 100,
      achievements: ['Birinchi simulyatsiya', 'Mantiqiy javoblar']
    };
    
    mockResults.totalScore = Math.round((mockResults.legalAccuracy + mockResults.ethics + mockResults.confidence) / 3);
    
    setResults(mockResults);
    setShowResults(true);
  };

  const sendMessage = () => {
    if (!userInput.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      character: 'user',
      text: userInput,
      timestamp: new Date(),
      type: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        'Qiziqarli nuqtai nazar. Keling, buni chuqurroq ko\'rib chiqaylik.',
        'Bu dalilni qo\'shimcha izohlashiz mumkinmi?',
        'Qonun to\'g\'risida to\'g\'ri yo\'l tutayapsiz. Davom eting.',
        'Bu muhim jihat. Boshqa dalillaringiz bormi?',
        'Mantiqiy xulosa. Keyingi savolga o\'tamiz.'
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        character: currentCharacter?.id || 'judge',
        text: randomResponse,
        timestamp: new Date(),
        type: 'ai'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Switch character randomly
      const nextCharacter = characters[Math.floor(Math.random() * characters.length)];
      setCurrentCharacter(nextCharacter);
    }, 1000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Oson': return 'bg-green-100 text-green-700';
      case 'O\'rta': return 'bg-yellow-100 text-yellow-700';
      case 'Qiyin': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStressColor = (level: number) => {
    if (level < 30) return 'bg-green-500';
    if (level < 60) return 'bg-yellow-500';
    if (level < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Stats Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Simulyator statistikasi</h3>
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Simulyatsiyalar:</span>
                  <span className="text-sm font-bold text-gray-800">{simulations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">O\'rtacha ball:</span>
                  <span className="text-sm font-bold text-green-600">85%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Yutuqlar:</span>
                  <span className="text-sm font-bold text-blue-600">12</span>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <Play className="w-5 h-5" />
                <span className="font-medium">Simulyator</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {!isSimulating ? (
            <>
              {/* Header */}
              <header className="bg-white px-8 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Virtual Simulyator</h1>
                    <p className="text-sm text-gray-600">Huquqiy vaziyatlarni simulyatsiya qiling</p>
                  </div>
                </div>
              </header>

              {/* Simulations Selection */}
              <main className="p-8">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {simulations.map(simulation => (
                      <Card key={simulation.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                              {simulation.icon}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">{simulation.title}</h3>
                              <p className="text-sm text-gray-600">{simulation.description}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Davomiyligi:</span>
                              <span className="font-medium">{simulation.duration}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Qiyinlik darajasi:</span>
                              <Badge className={getDifficultyColor(simulation.difficulty)}>
                                {simulation.difficulty}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Ishtirokchilar:</span>
                              <span className="font-medium">{simulation.participants} kishi</span>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full"
                            onClick={() => setSelectedSimulation(simulation.id)}
                          >
                            Boshlash
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </main>
            </>
          ) : (
            <>
              {/* Simulation Interface */}
              <div className="h-screen flex flex-col">
                {/* Simulation Header */}
                <header className="bg-white px-8 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsSimulating(false)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Chiqish
                      </Button>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {simulations.find(s => s.id === selectedSimulation)?.title}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Rol: {roles.find(r => r.id === selectedRole)?.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Timer */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="text-lg font-bold text-gray-800">{timeLeft}:00</span>
                      </div>
                      
                      {/* Stress Level */}
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="w-5 h-5 text-gray-600" />
                        <div className="w-32">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getStressColor(stressLevel)}`}
                              style={{ width: `${stressLevel}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{stressLevel}%</span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Chat Interface */}
                <div className="flex-1 flex">
                  {/* Messages Area */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md px-4 py-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {message.type === 'ai' && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">
                                  {characters.find(c => c.id === message.character)?.name}
                                </span>
                                <span className="text-xs opacity-75">
                                  {characters.find(c => c.id === message.character)?.role}
                                </span>
                              </div>
                            )}
                            <p>{message.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Character Info */}
                  <div className="w-80 bg-white border-l border-gray-100 p-6">
                    {currentCharacter && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">
                            {currentCharacter.avatar}
                          </div>
                          <h3 className="font-bold text-gray-800">{currentCharacter.name}</h3>
                          <p className="text-sm text-gray-600">{currentCharacter.role}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Kayfiyat:</p>
                            <Badge className={
                              currentCharacter.mood === 'happy' ? 'bg-green-100 text-green-700' :
                              currentCharacter.mood === 'neutral' ? 'bg-gray-100 text-gray-700' :
                              currentCharacter.mood === 'angry' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {currentCharacter.mood === 'happy' ? 'Xursand' :
                               currentCharacter.mood === 'neutral' ? 'Neytral' :
                               currentCharacter.mood === 'angry' ? 'Jahli' : 'Shubhali'}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-700">Xususiyatlar:</p>
                            <p className="text-sm text-gray-600">{currentCharacter.personality}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-100 p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Javobingizni yozing..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button onClick={sendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {showResults && results && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">Simulyatsiya tugadi!</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Huquqiy aniqlik:</span>
                  <span className="font-bold">{results.legalAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Etika:</span>
                  <span className="font-bold">{results.ethics}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ishhonch:</span>
                  <span className="font-bold">{results.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jami ball:</span>
                  <span className="font-bold text-green-600">{results.totalScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Yutuq XP:</span>
                  <span className="font-bold text-blue-600">+{results.xpEarned} XP</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-gray-700">Yutuqlar:</p>
                {results.achievements.map((achievement, index) => (
                  <Badge key={index} className="bg-yellow-100 text-yellow-700 mr-2">
                    {achievement}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowResults(false)}
                >
                  Yopish
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowResults(false);
                    setIsSimulating(false);
                  }}
                >
                  Yangi simulyatsiya
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {selectedSimulation && !isSimulating && !selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Rolni tanlang</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {roles.map(role => (
                <Card 
                  key={role.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-bold text-gray-800 mb-2">{role.name}</h4>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedSimulation(null)}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== EXPORTS ====================
