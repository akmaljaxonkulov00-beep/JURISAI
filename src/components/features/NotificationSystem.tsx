'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Bell, BellOff, Check, X, Settings, Mail, MessageSquare, AlertTriangle, Info, CheckCircle, Shield } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'system' | 'payment' | 'legal' | 'profile' | 'ai';
  actionUrl?: string;
  actionText?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  system: boolean;
  payment: boolean;
  legal: boolean;
  profile: boolean;
  ai: boolean;
}

export default function NotificationSystem() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    system: true,
    payment: true,
    legal: true,
    profile: false,
    ai: true
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('notification_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Load from localStorage
      const stored = localStorage.getItem('user_notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
      } else {
        // Create initial welcome notification
        const welcomeNotification: Notification = {
          id: 'welcome_' + Date.now(),
          type: 'success',
          title: 'Xush kelibsiz!',
          message: 'JurisAI platformasiga xush kelibsiz. Bu yerda sizning barcha bildirishnomalaringiz ko\'rsatiladi.',
          timestamp: new Date().toISOString(),
          read: false,
          category: 'system'
        };
        setNotifications([welcomeNotification]);
        localStorage.setItem('user_notifications', JSON.stringify([welcomeNotification]));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = async () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
  };

  const deleteNotification = async (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    localStorage.setItem('user_notifications', JSON.stringify(updatedNotifications));
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      setSettings(newSettings);
      // Save to localStorage
      localStorage.setItem('notification_settings', JSON.stringify(newSettings));
      console.log('Notification settings saved:', newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <X className="w-5 h-5 text-red-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return <Shield className="w-4 h-4" />;
      case 'legal': return <Mail className="w-4 h-4" />;
      case 'profile': return <Settings className="w-4 h-4" />;
      case 'ai': return <MessageSquare className="w-4 h-4" />;
      case 'system': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return n.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bildirishnomalar</h1>
        <p className="text-gray-600">Platforma yangiliklari va bildirishnomalarni boshqarish</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'notifications' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Bildirishnomalar</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'settings' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Sozlamalar</span>
          </button>
        </div>
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filter and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Barchasi ({notifications.length})</option>
                <option value="unread">O'qilmagan ({unreadCount})</option>
                <option value="read">O'qilgan ({notifications.length - unreadCount})</option>
                <option value="payment">To'lov</option>
                <option value="legal">Qonun</option>
                <option value="profile">Profil</option>
                <option value="ai">AI</option>
                <option value="system">Tizim</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="w-4 h-4 mr-1" />
                Barchasini o'qildi deb belgilash
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Yuklanmoqda...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Bildirishnoma topilmadi</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${getTypeColor(notification.type)} ${!notification.read ? 'border-l-4' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                Yangi
                              </Badge>
                            )}
                            <div className="flex items-center space-x-1 text-gray-500">
                              {getCategoryIcon(notification.category)}
                              <span className="text-xs">
                                {new Date(notification.timestamp).toLocaleDateString('uz-UZ')}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          {notification.actionUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Navigate to action URL
                                console.log('Navigate to:', notification.actionUrl);
                              }}
                            >
                              {notification.actionText}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Bildirishnoma Sozlamalari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Bildirishnomalar</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => updateSettings({ ...settings, email: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Email bildirishnomalarni yoqish</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Push Bildirishnomalar</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => updateSettings({ ...settings, push: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Push bildirishnomalarni yoqish</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Bildirishnoma Turlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'system', label: 'Tizim xabarlari', icon: <AlertTriangle className="w-4 h-4" /> },
                  { key: 'payment', label: 'To\'lov bildirishnomalari', icon: <Shield className="w-4 h-4" /> },
                  { key: 'legal', label: 'Qonun yangiliklari', icon: <Mail className="w-4 h-4" /> },
                  { key: 'profile', label: 'Profil o\'zgarishlari', icon: <Settings className="w-4 h-4" /> },
                  { key: 'ai', label: 'AI xizmatlari', icon: <MessageSquare className="w-4 h-4" /> },
                ].map(({ key, label, icon }) => (
                  <label key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="text-gray-600">{icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-gray-500">
                        {settings[key as keyof NotificationSettings] ? 'Yoqilgan' : 'O\'chirilgan'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[key as keyof NotificationSettings]}
                      onChange={(e) => updateSettings({ ...settings, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => updateSettings(settings)}>
                Sozlamalarni saqlash
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
