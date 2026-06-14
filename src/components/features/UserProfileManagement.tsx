'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { User, Mail, Phone, Calendar, Shield, Settings, Camera, Save, Edit2, Check, X, Award, TrendingUp, Clock, Target } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  specialization?: string;
  experience_years?: number;
  education?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  subscription_plan: 'free' | 'pro' | 'premium';
  subscription_expires_at?: string;
  created_at: string;
  last_login: string;
  stats: {
    cases_analyzed: number;
    documents_generated: number;
    ai_requests: number;
    study_hours: number;
  };
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  max_progress?: number;
}

export default function UserProfileManagement() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'achievements' | 'statistics'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Try to load from localStorage first
      const storedProfile = localStorage.getItem('user_profile');
      
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        setFormData(parsedProfile);
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: 'user_' + Date.now(),
          email: 'user@jurisai.uz',
          name: 'Foydalanuvchi',
          phone: '',
          avatar: '',
          bio: '',
          specialization: '',
          experience_years: 0,
          education: '',
          location: 'Toshkent, O\'zbekiston',
          website: '',
          linkedin: '',
          subscription_plan: 'free',
          subscription_expires_at: '',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          stats: {
            cases_analyzed: 0,
            documents_generated: 0,
            ai_requests: 0,
            study_hours: 0
          },
          achievements: []
        };
        
        setProfile(defaultProfile);
        setFormData(defaultProfile);
        localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage
      const updatedProfile = { ...profile, ...formData, last_login: new Date().toISOString() };
      setProfile(updatedProfile as UserProfile);
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      
      setEditing(false);
      alert('Profil muvaffaqiyatli saqlandi!');
      
      console.log('Profile saved:', formData);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Profilni saqlashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
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

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Profil yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil Menejmenti</h1>
        <p className="text-gray-600">Shaxsiy ma'lumotlaringizni boshqarish</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'profile' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil</span>
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
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'achievements' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Yutuqlar</span>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'statistics' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Statistika</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profil Ma'lumotlari</CardTitle>
                  <div className="flex items-center space-x-2">
                    {editing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(false);
                            setFormData(profile);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={loading}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Saqlash
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Tahrirlash
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {avatarPreview || formData.avatar ? (
                        <img 
                          src={avatarPreview || formData.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    {editing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{formData.name}</h3>
                    <p className="text-gray-600">{formData.email}</p>
                    <Badge className={getSubscriptionColor(profile.subscription_plan)}>
                      {profile.subscription_plan.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                    {editing ? (
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    {editing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.phone || 'Ko\'rsatilmagan'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                    {editing ? (
                      <Input
                        value={formData.location || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.location || 'Ko\'rsatilmagan'}</p>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Professional Ma'lumotlar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mutaxassislik</label>
                      {editing ? (
                        <Input
                          value={formData.specialization || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.specialization || 'Ko\'rsatilmagan'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tajriba (yil)</label>
                      {editing ? (
                        <Input
                          type="number"
                          value={formData.experience_years || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.experience_years || '0'} yil</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ta'lim</label>
                      {editing ? (
                        <Input
                          value={formData.education || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.education || 'Ko\'rsatilmagan'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      {editing ? (
                        <Input
                          value={formData.website || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.website || 'Ko\'rsatilmagan'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    {editing ? (
                      <Textarea
                        value={formData.bio || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900">{profile.bio || 'Bio yo\'q'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Obuna Ma'lumotlari</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Joriy reja</p>
                    <Badge className={getSubscriptionColor(profile.subscription_plan)}>
                      {profile.subscription_plan.toUpperCase()}
                    </Badge>
                  </div>
                  {profile.subscription_expires_at && (
                    <div>
                      <p className="text-sm text-gray-600">Tugash sanasi</p>
                      <p className="font-semibold">
                        {new Date(profile.subscription_expires_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  )}
                  <Button className="w-full">
                    Obunani yangilash
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Tezkor Statistika</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tahlil qilingan ishlar</span>
                    <span className="font-semibold">{profile.stats.cases_analyzed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Yaratilgan hujjatlar</span>
                    <span className="font-semibold">{profile.stats.documents_generated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI so'rovlar</span>
                    <span className="font-semibold">{profile.stats.ai_requests}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">O'qish soatlari</span>
                    <span className="font-semibold">{profile.stats.study_hours}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.achievements.map((achievement) => (
            <Card key={achievement.id} className={getRarityColor(achievement.rarity)}>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">{achievement.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(achievement.unlocked_at).toLocaleDateString('uz-UZ')}</span>
                    <Badge variant="outline" className="text-xs">
                      {achievement.rarity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'statistics' && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Faoliyat Statistikasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tahlil qilingan ishlar</span>
                    <span className="font-semibold">{profile.stats.cases_analyzed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((profile.stats.cases_analyzed / 200) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Yaratilgan hujjatlar</span>
                    <span className="font-semibold">{profile.stats.documents_generated}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((profile.stats.documents_generated / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">AI so'rovlar</span>
                    <span className="font-semibold">{profile.stats.ai_requests}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((profile.stats.ai_requests / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>O'qish Faoliyati</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{profile.stats.study_hours}</div>
                  <p className="text-gray-600">Jami o'qish soatlari</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold">{Math.floor(profile.stats.study_hours / 7)}</div>
                    <p className="text-xs text-gray-600">Hafta</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{Math.floor(profile.stats.study_hours / 30)}</div>
                    <p className="text-xs text-gray-600">Oy</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{Math.floor(profile.stats.study_hours / 365)}</div>
                    <p className="text-xs text-gray-600">Yil</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Sozlamalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Bildirishnoma Sozlamalari</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    <span>Email bildirishnomalar</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    <span>Push bildirishnomalar</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span>Marketing xatlari</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Maxfiylik Sozlamalari</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    <span>Profilni jamoatchilikka ko'rsatish</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span>Faoliyatni ko'rsatish</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Xavfsizlik</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Parolni o'zgartirish
                  </Button>
                  <Button variant="outline" className="w-full">
                    Ikki faktorli autentifikatsiya
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Hisobni o'chirish
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
