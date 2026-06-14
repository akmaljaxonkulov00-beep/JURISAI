'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useAuth } from '@/services/auth';
import { api } from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  FileText,
  Users,
  Settings,
  HelpCircle,
  LogOut,
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
  Users2
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

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  useEffect(() => {
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

      // Mock data
      const mockStats: UserStats = {
        xp: 2450,
        level: 12,
        completedCases: 38,
        totalCases: 42,
        weeklyProgress: 78,
        rank: "Legal Expert",
        achievements: [
          {
            id: '1',
            title: 'First Case',
            description: 'Complete your first legal case analysis',
            icon: '🎯',
            unlockedAt: '2024-01-15',
            rarity: 'common'
          },
          {
            id: '2',
            title: 'IRAC Master',
            description: 'Score 90+ on 5 IRAC analyses',
            icon: '⚖️',
            unlockedAt: '2024-01-20',
            rarity: 'rare'
          },
          {
            id: '3',
            title: 'Quick Thinker',
            description: 'Complete 10 cases under 5 minutes',
            icon: '⚡',
            unlockedAt: '2024-01-25',
            rarity: 'epic'
          },
          {
            id: '4',
            title: 'Legal Scholar',
            description: 'Reach level 10',
            icon: '🎓',
            unlockedAt: '2024-02-01',
            rarity: 'legendary'
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'case_completed',
            title: 'Contract Dispute Analysis',
            description: 'Completed IRAC analysis with score 92',
            timestamp: '2024-02-10T14:30:00Z',
            xp: 150
          },
          {
            id: '2',
            type: 'achievement_unlocked',
            title: 'IRAC Master',
            description: 'Unlocked rare achievement',
            timestamp: '2024-02-10T13:15:00Z',
            xp: 100
          },
          {
            id: '3',
            type: 'case_completed',
            title: 'Criminal Law Scenario',
            description: 'Completed scenario analysis',
            timestamp: '2024-02-09T16:45:00Z',
            xp: 120
          },
          {
            id: '4',
            type: 'daily_streak',
            title: '7 Day Streak',
            description: 'Maintained daily activity for 7 days',
            timestamp: '2024-02-09T09:00:00Z',
            xp: 50
          }
        ]
      };

      setUserStats(mockStats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      id: 'home',
      label: 'Bosh sahifa',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'courses',
      label: 'Mening kurslarim',
      icon: BookOpen,
      href: '/courses'
    },
    {
      id: 'assignments',
      label: 'Topshiriqlar',
      icon: Trophy,
      href: '/assignments'
    },
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
    },
    {
      id: 'test-quiz',
      label: 'Test & Quiz',
      icon: Award,
      href: '/test-quiz'
    },
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
    },
    {
      id: 'achievements',
      label: 'Yutuqlar',
      icon: Trophy,
      href: '/achievements'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      href: '/profile'
    },
    {
      id: 'settings',
      label: 'Sozlamalar',
      icon: Settings,
      href: '/settings'
    },
    {
      id: 'help',
      label: 'Yordam',
      icon: HelpCircle,
      href: '/help'
    },
    {
      id: 'premium',
      label: 'Premiumga o\'tish',
      icon: Crown,
      href: '/premium'
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
      case 'case_completed': return '✅';
      case 'achievement_unlocked': return '🏆';
      case 'daily_streak': return '🔥';
      default: return '📋';
    }
  };

  const renderSidebar = () => (
    <div className="w-80 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">12</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{user?.name || 'User'}</h3>
            <p className="text-sm text-gray-600">{userStats?.rank || 'Legal Practitioner'}</p>
            <div className="flex items-center mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  style={{ width: `${((userStats?.level || 1) % 20) * 5}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-gray-600">Level {userStats?.level || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* XP and Stats */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userStats?.xp || 0}</div>
            <div className="text-xs text-gray-600">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userStats?.weeklyProgress || 0}%</div>
            <div className="text-xs text-gray-600">Weekly Progress</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Link key={item.id} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-blue-100 text-lg">Ready to continue your legal journey?</p>
            <div className="mt-6 flex items-center space-x-6">
              <div>
                <div className="text-3xl font-bold">{userStats?.completedCases || 0}</div>
                <div className="text-blue-100">Cases Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{userStats?.xp || 0}</div>
                <div className="text-blue-100">Total XP</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{userStats?.weeklyProgress || 0}%</div>
                <div className="text-blue-100">Weekly Goal</div>
              </div>
            </div>
          </div>
          <div className="text-6xl opacity-20">⚖️</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Level</p>
                <p className="text-3xl font-bold text-blue-600">{userStats?.level || 1}</p>
                <p className="text-xs text-gray-500 mt-1">{userStats?.rank || 'Beginner'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total XP</p>
                <p className="text-3xl font-bold text-purple-600">{userStats?.xp || 0}</p>
                <p className="text-xs text-gray-500 mt-1">+250 this week</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(((userStats?.completedCases || 0) / (userStats?.totalCases || 1)) * 100)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Above average</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Study Streak</p>
                <p className="text-3xl font-bold text-orange-600">7</p>
                <p className="text-xs text-gray-500 mt-1">Days in a row</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userStats?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </span>
                      <Badge className="bg-green-100 text-green-800">+{activity.xp} XP</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats?.achievements?.map((achievement) => (
                <div key={achievement.id} className={`p-3 rounded-xl border ${getRarityColor(achievement.rarity)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <p className="text-xs mt-1 opacity-80">{achievement.description}</p>
                      <div className="mt-2">
                        <Badge className="text-xs" variant="outline">
                          {achievement.rarity}
                        </Badge>
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
      <Card className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => handleNavigation('/irac')}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-400 transition-all cursor-pointer group"
            >
              <Scale className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-blue-900">Start IRAC Analysis</h3>
              <p className="text-sm text-blue-700 mt-1">Practice legal case analysis</p>
            </div>
            <div
              onClick={() => handleNavigation('/legal-database-new')}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:border-green-400 transition-all cursor-pointer group"
            >
              <Database className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-green-900">Browse Legal Database</h3>
              <p className="text-sm text-green-700 mt-1">Search laws and regulations</p>
            </div>
            <div
              onClick={() => handleNavigation('/court-simulator')}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:border-purple-400 transition-all cursor-pointer group"
            >
              <Gavel className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-purple-900">Court Simulator</h3>
              <p className="text-sm text-purple-700 mt-1">Practice in virtual court</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-full mx-auto">
        <div className="flex gap-6">
          {renderSidebar()}

          <div className="flex-1">
            {renderOverview()}
          </div>
        </div>
      </div>
    </div>
  );
}
