'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Trophy, Star, Lock, Unlock, Target, Zap, Award, Crown, Flame, TrendingUp, Calendar, Users, BookOpen, Scale, FileText, Brain, Heart } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'learning' | 'practice' | 'social' | 'milestone' | 'special';
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  requirements: string[];
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };
}

interface UserStats {
  level: number;
  xp: number;
  totalXp: number;
  nextLevelXp: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  streak: number;
  rank: string;
  badges: string[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  achievements: number;
  rank: number;
  trend: 'up' | 'down' | 'same';
}

export default function AchievementSystem() {
  const [activeTab, setActiveTab] = useState<'achievements' | 'progress' | 'leaderboard' | 'rewards'>('achievements');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserStats();
    loadAchievements();
    loadLeaderboard();
  }, []);

  const loadUserStats = async () => {
    try {
      // Mock user stats
      const mockStats: UserStats = {
        level: 12,
        xp: 2450,
        totalXp: 8900,
        nextLevelXp: 3000,
        achievementsUnlocked: 18,
        totalAchievements: 25,
        streak: 7,
        rank: 'Legal Expert',
        badges: ['Fast Learner', 'IRAC Master', 'Dedicated Student']
      };
      setUserStats(mockStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      // Mock achievements data
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          title: 'Birinchi Qadam',
          description: 'Platformaga ro\'yxatdan o\'ting',
          icon: '◈',
          rarity: 'common',
          category: 'milestone',
          points: 10,
          unlocked: true,
          unlockedAt: '2024-01-15',
          progress: 1,
          maxProgress: 1,
          requirements: ['Ro\'yxatdan o\'tish'],
          rewards: { xp: 10, badge: 'Newcomer' }
        },
        {
          id: '2',
          title: 'IRAC Master',
          description: '10 ta IRAC tahlilini 90+ ball bilan bajaring',
          icon: '═',
          rarity: 'rare',
          category: 'practice',
          points: 50,
          unlocked: true,
          unlockedAt: '2024-02-20',
          progress: 10,
          maxProgress: 10,
          requirements: ['10 ta IRAC tahlili', 'Har birida 90+ ball'],
          rewards: { xp: 50, badge: 'IRAC Expert', title: 'Legal Analyst' }
        },
        {
          id: '3',
          title: 'Hujjat Ustasi',
          description: '50 ta huquqiy hujjat yarating',
          icon: '▢',
          rarity: 'epic',
          category: 'practice',
          points: 100,
          unlocked: true,
          unlockedAt: '2024-04-10',
          progress: 50,
          maxProgress: 50,
          requirements: ['50 ta hujjat generatsiyasi'],
          rewards: { xp: 100, badge: 'Document Master' }
        },
        {
          id: '4',
          title: 'AI Power User',
          description: '500 ta AI so\'rov yuboring',
          icon: '⚙',
          rarity: 'legendary',
          category: 'learning',
          points: 200,
          unlocked: true,
          unlockedAt: '2024-05-01',
          progress: 500,
          maxProgress: 500,
          requirements: ['500 ta AI so\'rov'],
          rewards: { xp: 200, badge: 'AI Master', title: 'Tech Savvy Lawyer' }
        },
        {
          id: '5',
          title: 'Kunlik Chempion',
          description: '30 kun ketma-ket platformaga kiring',
          icon: '🔥',
          rarity: 'epic',
          category: 'milestone',
          points: 75,
          unlocked: false,
          progress: 7,
          maxProgress: 30,
          requirements: ['30 kun ketma-ket tashrif'],
          rewards: { xp: 75, badge: 'Dedicated' }
        },
        {
          id: '6',
          title: 'Sud Simulyatori',
          description: '25 ta sud sessiyasini muvaffaqiyatli yakunlang',
          icon: '═',
          rarity: 'rare',
          category: 'practice',
          points: 60,
          unlocked: false,
          progress: 12,
          maxProgress: 25,
          requirements: ['25 ta sud sessiyasi', 'Har birini muvaffaqiyatli yakunlash'],
          rewards: { xp: 60, badge: 'Court Expert' }
        },
        {
          id: '7',
          title: 'Qonun Bilimdoni',
          description: 'Barcha asosiy qonunlarni o\'qing',
          icon: '▣▣',
          rarity: 'rare',
          category: 'learning',
          points: 40,
          unlocked: false,
          progress: 3,
          maxProgress: 5,
          requirements: ['Fuqarolik kodeksi', 'Mehnat kodeksi', 'Jinoyat kodeksi', 'Oilaviy kodeksi', 'Yer kodeksi'],
          rewards: { xp: 40, badge: 'Law Scholar' }
        },
        {
          id: '8',
          title: 'Jamoat Lideri',
          description: '100 ta foydalanuvchiga yordam bering',
          icon: '◉◉',
          rarity: 'epic',
          category: 'social',
          points: 80,
          unlocked: false,
          progress: 23,
          maxProgress: 100,
          requirements: ['100 ta foydalanuvchiga yordam'],
          rewards: { xp: 80, badge: 'Community Leader' }
        }
      ];
      
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Mock leaderboard data
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          avatar: '/api/placeholder/40/40',
          level: 25,
          xp: 15420,
          achievements: 22,
          rank: 1,
          trend: 'up'
        },
        {
          id: '2',
          name: 'Michael Chen',
          avatar: '/api/placeholder/40/40',
          level: 23,
          xp: 12890,
          achievements: 20,
          rank: 2,
          trend: 'same'
        },
        {
          id: '3',
          name: 'Emma Wilson',
          avatar: '/api/placeholder/40/40',
          level: 21,
          xp: 11234,
          achievements: 18,
          rank: 3,
          trend: 'up'
        },
        {
          id: '4',
          name: 'You',
          avatar: '/api/placeholder/40/40',
          level: 12,
          xp: 2450,
          achievements: 18,
          rank: 15,
          trend: 'up'
        }
      ];
      
      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'practice': return <Scale className="w-5 h-5 text-green-600" />;
      case 'social': return <Users className="w-5 h-5 text-purple-600" />;
      case 'milestone': return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'special': return <Star className="w-5 h-5 text-red-600" />;
      default: return <Award className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'same': return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory === 'all') return true;
    return achievement.category === selectedCategory;
  });

  if (loading && !userStats) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yutuqlar Tizimi</h1>
        <p className="text-gray-600">Gamifikatsiya orqali o'qish va rivojlanish</p>
      </div>

      {/* User Stats Overview */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Level</p>
                  <p className="text-2xl font-bold">{userStats.level}</p>
                  <p className="text-blue-100 text-xs">{userStats.rank}</p>
                </div>
                <Trophy className="w-8 h-8 text-blue-200" />
              </div>
              <div className="mt-2">
                <Progress value={(userStats.xp / userStats.nextLevelXp) * 100} className="h-2" />
                <p className="text-xs text-blue-100 mt-1">
                  {userStats.xp} / {userStats.nextLevelXp} XP
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total XP</p>
                  <p className="text-2xl font-bold">{userStats.totalXp.toLocaleString()}</p>
                </div>
                <Star className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Yutuqlar</p>
                  <p className="text-2xl font-bold">{userStats.achievementsUnlocked}/{userStats.totalAchievements}</p>
                </div>
                <Award className="w-8 h-8 text-purple-200" />
              </div>
              <Progress value={(userStats.achievementsUnlocked / userStats.totalAchievements) * 100} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Kunlik Streak</p>
                  <p className="text-2xl font-bold">{userStats.streak} kun</p>
                </div>
                <Flame className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'achievements' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Yutuqlar</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'progress' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Progress</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'leaderboard' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'rewards' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Unvonlar</span>
          </button>
        </div>
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Barchasi ({achievements.length})
            </Button>
            <Button
              variant={selectedCategory === 'learning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('learning')}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              O'qish ({achievements.filter(a => a.category === 'learning').length})
            </Button>
            <Button
              variant={selectedCategory === 'practice' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('practice')}
            >
              <Scale className="w-4 h-4 mr-1" />
              Amaliyot ({achievements.filter(a => a.category === 'practice').length})
            </Button>
            <Button
              variant={selectedCategory === 'social' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('social')}
            >
              <Users className="w-4 h-4 mr-1" />
              Ijtimoiy ({achievements.filter(a => a.category === 'social').length})
            </Button>
            <Button
              variant={selectedCategory === 'milestone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('milestone')}
            >
              <Trophy className="w-4 h-4 mr-1" />
      </Button>
            </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`relative overflow-hidden ${getRarityBorder(achievement.rarity)} ${
                  achievement.unlocked ? '' : 'opacity-75'
                }`}
              >
                {!achievement.unlocked && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
                    <Lock className="w-12 h-12 text-white" />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{achievement.icon}</div>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      {getCategoryIcon(achievement.category)}
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Points</span>
                        <span className="font-semibold text-blue-600">+{achievement.points}</span>
                      </div>
                      
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="text-xs text-gray-500">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString('uz-UZ')}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-700">Requirements:</p>
                        {achievement.requirements.map((req, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              achievement.unlocked ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                      
                      {achievement.rewards.badge && (
                        <div className="text-xs text-purple-600">
                          ★ {achievement.rewards.badge}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && userStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Level Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">Level {userStats.level}</div>
                  <p className="text-gray-600">{userStats.rank}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Current XP</span>
                    <span className="font-semibold">{userStats.xp}</span>
                  </div>
                  <Progress value={(userStats.xp / userStats.nextLevelXp) * 100} className="h-3" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Level {userStats.level}</span>
                    <span className="text-xs text-gray-500">Level {userStats.level + 1}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{userStats.xp} XP</span>
                    <span className="text-xs text-gray-500">{userStats.nextLevelXp} XP</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total XP</span>
                    <span className="font-semibold text-lg">{userStats.totalXp.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">XP to next level</span>
                    <span className="font-semibold">{userStats.nextLevelXp - userStats.xp}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievement Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unlocked Achievements</span>
                  <span className="font-semibold">{userStats.achievementsUnlocked}/{userStats.totalAchievements}</span>
                </div>
                <Progress value={(userStats.achievementsUnlocked / userStats.totalAchievements) * 100} className="h-3" />
                
                <div className="space-y-2">
                  {achievements.filter(a => !a.unlocked).slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span>{achievement.icon}</span>
                        <span>{achievement.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="w-20 h-2"
                        />
                        <span className="text-xs text-gray-500">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle>Global Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    entry.name === 'You' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-sm font-semibold">
                      {entry.rank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{entry.name}</p>
                      <p className="text-sm text-gray-600">Level {entry.level}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-semibold">{entry.xp.toLocaleString()} XP</p>
                      <p className="text-sm text-gray-600">{entry.achievements} achievements</p>
                    </div>
                    {getTrendIcon(entry.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Unvonlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStats.badges.map((badge, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{badge}</p>
                      <p className="text-sm text-gray-600">Yutuq uchun berilgan</p>
                    </div>
                  </div>
                ))}
                
                {userStats.badges.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Hali unvonlar yo'q</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qulayliklar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Crown className="w-6 h-6 text-purple-600" />
                    <h4 className="font-semibold">Premium Features</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Yuqori level foydalanuvchilari uchun qulayliklar
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Cheksiz AI so'rovlar</li>
                    <li>• Advanced qidiruv</li>
                    <li>• Priority support</li>
                    <li>• Exclusive content</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Heart className="w-6 h-6 text-green-600" />
                    <h4 className="font-semibold">Community Recognition</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Jamoat tomonidan e'tirof etilganlik
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
