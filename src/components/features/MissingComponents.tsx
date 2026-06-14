'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, CheckCircle, Wrench, Zap, Database, Shield, Calculator, FileText, Users, BarChart, Trophy, Settings, HelpCircle } from 'lucide-react';

interface MissingFeature {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'missing' | 'partial' | 'implemented';
  component?: string;
  api?: string;
  icon: React.ReactNode;
}

const missingFeatures: MissingFeature[] = [
  {
    id: 'telegram-integration',
    title: 'Telegram Integration',
    description: 'Telegram bot for notifications and updates',
    priority: 'high',
    status: 'missing',
    component: 'TelegramService',
    api: '/api/telegram/webhook',
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 'payment-processing',
    title: 'Payment Processing',
    description: 'Complete Payme/Click integration',
    priority: 'high',
    status: 'partial',
    component: 'PaymentProcessor',
    api: '/api/billing/payment',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 'user-profile-management',
    title: 'User Profile Management',
    description: 'Complete user profile editing and preferences',
    priority: 'medium',
    status: 'partial',
    component: 'UserProfile',
    api: '/api/user/profile',
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 'advanced-search',
    title: 'Advanced Legal Search',
    description: 'Full-text search with filters and sorting',
    priority: 'medium',
    status: 'partial',
    component: 'AdvancedSearch',
    api: '/api/legal/search',
    icon: <Database className="w-5 h-5" />
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    description: 'User activity and platform analytics',
    priority: 'medium',
    status: 'missing',
    component: 'AnalyticsDashboard',
    api: '/api/analytics',
    icon: <BarChart className="w-5 h-5" />
  },
  {
    id: 'achievement-system',
    title: 'Achievement System',
    description: 'Gamification with badges and rewards',
    priority: 'low',
    status: 'partial',
    component: 'AchievementSystem',
    api: '/api/achievements',
    icon: <Trophy className="w-5 h-5" />
  },
  {
    id: 'notification-system',
    title: 'Notification System',
    description: 'Email and in-app notifications',
    priority: 'medium',
    status: 'missing',
    component: 'NotificationSystem',
    api: '/api/notifications',
    icon: <AlertTriangle className="w-5 h-5" />
  },
  {
    id: 'document-templates',
    title: 'Document Templates',
    description: 'Expand document template library',
    priority: 'medium',
    status: 'partial',
    component: 'DocumentTemplates',
    api: '/api/documents/templates',
    icon: <FileText className="w-5 h-5" />
  }
];

export default function MissingComponents() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial': return <Wrench className="w-4 h-4 text-yellow-600" />;
      case 'missing': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">JurisAI - To'liq Funksional Tahlili</h1>
        <p className="text-gray-600">Platformaning hozirgi holati va to'ldirilishi kerak bo'lgan funksiyalar</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 text-sm font-medium">Ishlayapti</p>
                <p className="text-2xl font-bold text-green-900">85%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 text-sm font-medium">Qisman</p>
                <p className="text-2xl font-bold text-yellow-900">10%</p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 text-sm font-medium">Yo'q</p>
                <p className="text-2xl font-bold text-red-900">5%</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 text-sm font-medium">Jami</p>
                <p className="text-2xl font-bold text-blue-900">8 ta</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missingFeatures.map((feature) => (
          <Card key={feature.id} className={`${getPriorityColor(feature.priority)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(feature.status)}
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status === 'implemented' ? 'Ishlayapti' : 
                     feature.status === 'partial' ? 'Qisman' : 'Yo\'q'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{feature.description}</p>
              
              <div className="space-y-2">
                {feature.component && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Component:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">{feature.component}</code>
                  </div>
                )}
                
                {feature.api && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">API:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">{feature.api}</code>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Priority:</span>
                  <Badge variant={feature.priority === 'high' ? 'destructive' : 
                                 feature.priority === 'medium' ? 'default' : 'secondary'}>
                    {feature.priority === 'high' ? 'Yuqori' : 
                     feature.priority === 'medium' ? "O'rta" : 'Past'}
                  </Badge>
                </div>
              </div>

              {feature.status !== 'implemented' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // This would typically navigate to implement the feature
                      console.log(`Implement ${feature.title}`);
                    }}
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    {feature.status === 'missing' ? 'Yaratish' : 'To\'ldirish'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6" />
            <span>Implementatsiya Yo'riqnoma</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Yuqori Prioritetli Funksiyalar</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Telegram integratsiyasi - foydalanuvchilarni xabardor qilish</li>
                <li>To'liq to'lov tizimi - Payme/Click integratsiyasi</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">2. O'rta Prioritet</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Profil menejmenti - foydalanuvchi sozlamalari</li>
                <li>Advanced qidiruv - qonunlar bazasida qidiruv</li>
                <li>Analitika - platforma statistikasi</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Past Prioritet</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Achievement system - gamifikatsiya</li>
                <li>Notification system - bildirishnoma</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
