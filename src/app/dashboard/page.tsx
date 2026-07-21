'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useAuth } from '@/app/providers';
import { api } from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  FileText,
  Users,
  TrendingUp,
  Award,
  Clock,
  Target,
  Zap,
  Shield,
  Brain,
  Scale,
  Database,
  Gavel,
  MessageSquare,
  BarChart3,
  Trophy,
  User,
  Crown,
  Wrench,
  Users2,
  CheckCircle
} from 'lucide-react';

interface UserStats {
  xp: number;
  level: number;
  completedCases: number;
  totalCases: number;
  achievements: Achievement[];
  recentActivity: Activity[];
  weeklyProgress: number;
  rank: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  xp: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  useEffect(() => {
    setProfileImage(localStorage.getItem('profile_image'));
    console.log('Dashboard useEffect - user:', user);
    console.log('Environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    });

    if (user) {
      loadUserStats();
    } else {
      // If no user, stop loading
      setLoading(false);
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);

      // Load stats from localStorage or use default empty values
      const storedStats = localStorage.getItem('user_stats');
      if (storedStats) {
        setUserStats(JSON.parse(storedStats));
      } else {
        // Default empty stats for new users
        const defaultStats: UserStats = {
          xp: 0,
          level: 1,
          completedCases: 0,
          totalCases: 0,
          weeklyProgress: 0,
          rank: 'Yangi boshlovchi',
          achievements: [],
          recentActivity: []
        };
        setUserStats(defaultStats);
        localStorage.setItem('user_stats', JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationGroups = [
    {
      title: 'Asosiy',
      items: [
        {
          id: 'home',
          label: 'Bosh sahifa',
          icon: Home,
          href: '/dashboard'
        }
      ]
    },
    {
      title: 'Amaliyot',
      items: [
        {
          id: 'case-solver',
          label: 'Case Solver',
          icon: Scale,
          href: '/irac'
        },
        {
          id: 'decision-tree',
          label: 'Decision Tree',
          icon: Brain,
          href: '/decision-tree'
        },
        {
          id: 'simulator',
          label: 'Simulyator',
          icon: Target,
          href: '/simulator'
        },
        {
          id: 'virtual-court',
          label: 'Virtual Sud',
          icon: Gavel,
          href: '/court-simulator'
        }
      ]
    },
    {
      title: 'Resurslar',
      items: [
        {
          id: 'legal-database',
          label: 'Qonunlar bazasi',
          icon: Database,
          href: '/legal-database-new'
        },
        {
          id: 'pro-tools',
          label: 'Pro Tools',
          icon: Wrench,
          href: '/pro-tools'
        },
        {
          id: 'ai-chat',
          label: 'AI Chat Assistant',
          icon: MessageSquare,
          href: '/ai-chat'
        },
        {
          id: 'community',
          label: 'Jamiyat',
          icon: Users2,
          href: '/community'
        },
        {
          id: 'statistics',
          label: 'Statistika',
          icon: BarChart3,
          href: '/statistics'
        }
      ]
    },
    {
      title: 'Shaxsiy',
      items: [
        {
          id: 'profile',
          label: 'Profil',
          icon: User,
          href: '/profile'
        }
      ]
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_completed': return <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div>;
      case 'achievement_unlocked': return <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"><Award className="w-3 h-3 text-white" /></div>;
      case 'daily_streak': return <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>;
      default: return <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><FileText className="w-3 h-3 text-white" /></div>;
    }
  };

  const renderSidebar = () => (
    <div className="w-80 glass-strong rounded-2xl shadow-2xl overflow-hidden">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-100/50">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-lg" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-105 duration-200">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">{userStats?.level || 1}</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{user?.name || 'User'}</h3>
            <p className="text-sm text-gray-500">{userStats?.rank || 'Legal Practitioner'}</p>
            <div className="flex items-center mt-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((userStats?.level || 1) % 20) * 5}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-gray-500 font-medium">Lv.{userStats?.level || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP and Stats */}
      <div className="px-6 py-4 border-b border-gray-100/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{userStats?.xp || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Total XP</div>
          </div>
          <div className="text-center p-3 bg-emerald-50/50 rounded-xl hover:bg-emerald-50 transition-colors">
            <div className="text-2xl font-bold text-emerald-600">{userStats?.weeklyProgress || 0}%</div>
            <div className="text-xs text-gray-500 mt-1">Weekly Goal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-5">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h3 className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <Link key={item.id} href={item.href}>
                      <div
                        className={`nav-item flex items-center space-x-3 px-4 py-2.5 rounded-xl cursor-pointer ${
                          isActive
                            ? 'nav-item-active'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? '' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 page-enter">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Xush kelibsiz, {user?.name || 'Foydalanuvchi'}!</h1>
            <p className="text-blue-100/80 text-lg">Huquqiy bilimlaringizni rivojlantirishni davom ettiring</p>
            <div className="mt-6 flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{userStats?.completedCases || 0}</div>
                <div className="text-blue-100/70 text-sm mt-1">Yechilgan ishlar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{userStats?.xp || 0}</div>
                <div className="text-blue-100/70 text-sm mt-1">Umumiy XP</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{userStats?.weeklyProgress || 0}%</div>
                <div className="text-blue-100/70 text-sm mt-1">Haftalik maqsad</div>
              </div>
            </div>
          </div>
          <Scale className="w-20 h-20 opacity-10 text-white" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="glass card-hover rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Current Level</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{userStats?.level || 1}</p>
                <p className="text-xs text-gray-400 mt-1">{userStats?.rank || 'Beginner'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center glow-blue">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Total XP</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{userStats?.xp || 0}</p>
                <p className="text-xs text-gray-400 mt-1">+250 this week</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center glow-purple">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {Math.round(((userStats?.completedCases || 0) / (userStats?.totalCases || 1)) * 100)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Above average</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover rounded-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Study Streak</p>
                <p className="text-3xl font-bold text-orange-600">7</p>
                <p className="text-xs text-gray-400 mt-1">Days in a row</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 glass rounded-2xl border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100/50 pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-lg">So'nggi faoliyat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {userStats?.recentActivity?.map((activity, idx) => (
                <div key={activity.id} className="stagger-enter flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50/80 transition-all duration-200 card-hover" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-lg font-medium text-blue-600">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{activity.title}</h4>
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs font-medium ml-2 flex-shrink-0">+{activity.xp} XP</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {new Date(activity.timestamp).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="glass rounded-2xl border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100/50 pb-4">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-lg">Yutuqlar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-3">
              {userStats?.achievements?.map((achievement) => (
                <div key={achievement.id} className={`p-3.5 rounded-xl border transition-all hover:shadow-sm ${getRarityColor(achievement.rarity)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center text-lg">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900">{achievement.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{achievement.description}</p>
                      <div className="mt-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                          achievement.rarity === 'common' ? 'bg-gray-200 text-gray-600' :
                          achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                          achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                          'bg-amber-200 text-amber-700'
                        }`}>
                          {achievement.rarity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass rounded-2xl border-0 overflow-hidden">
        <CardHeader className="border-b border-gray-100/50 pb-4">
          <CardTitle className="text-gray-800 text-lg">Tezkor amallar</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => handleNavigation('/irac')}
              className="relative overflow-hidden group p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-100/50 hover:border-blue-200/80 transition-all duration-300 cursor-pointer hover-lift"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-200/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              <Scale className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-semibold text-blue-900">IRAC Tahlil</h3>
              <p className="text-sm text-blue-600/70 mt-1">Huquqiy keyslarni tahlil qiling</p>
            </div>
            <div
              onClick={() => handleNavigation('/legal-database-new')}
              className="relative overflow-hidden group p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 rounded-xl border border-emerald-100/50 hover:border-emerald-200/80 transition-all duration-300 cursor-pointer hover-lift"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              <Database className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-semibold text-emerald-900">Qonunlar bazasi</h3>
              <p className="text-sm text-emerald-600/70 mt-1">Qonun va kodifikatsiyalarni qidiring</p>
            </div>
            <div
              onClick={() => handleNavigation('/court-simulator')}
              className="relative overflow-hidden group p-6 bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-xl border border-purple-100/50 hover:border-purple-200/80 transition-all duration-300 cursor-pointer hover-lift"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-200/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              <Gavel className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="font-semibold text-purple-900">Sud Simulyatori</h3>
              <p className="text-sm text-purple-600/70 mt-1">Virtual sud jarayonida qatnashing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 md:p-6">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="desktop-sidebar">
            {renderSidebar()}
          </div>

          <div className="flex-1">
            {renderOverview()}
          </div>
        </div>
      </div>
    </div>
  );
}
