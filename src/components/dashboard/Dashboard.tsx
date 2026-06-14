import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { StatsCard, ProgressChart, ActivityFeed } from './index';
import { cn } from '@/lib/utils';

interface DashboardProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, className }) => {
  // Mock data for demonstration
  const statsData = [
    {
      title: 'IRAC Tahlillari',
      value: 24,
      change: { value: 12, type: 'increase' as const, period: 'bu hafta' },
      description: 'Jami tahlillar soni',
      variant: 'default' as const
    },
    {
      title: 'Yaratilgan hujjatlar',
      value: 18,
      change: { value: 8, type: 'increase' as const, period: 'bu hafta' },
      description: 'Shablonlar asosida',
      variant: 'success' as const
    },
    {
      title: 'Senariylar',
      value: 7,
      change: { value: -3, type: 'decrease' as const, period: 'bu hafta' },
      description: 'Ta\'lim senariylari',
      variant: 'warning' as const
    },
    {
      title: 'O\'rtacha ball',
      value: '85%',
      change: { value: 5, type: 'increase' as const, period: 'bu hafta' },
      description: 'Barcha tahlillar bo\'yicha',
      variant: 'default' as const
    }
  ];

  const progressData = [
    { name: 'IRAC Issue', value: 85, color: 'success' },
    { name: 'IRAC Rule', value: 78, color: 'info' },
    { name: 'IRAC Application', value: 82, color: 'warning' },
    { name: 'IRAC Conclusion', value: 90, color: 'success' },
    { name: 'Huquqiy bilim', value: 75, color: 'default' },
    { name: 'Mantiqiy tahlil', value: 88, color: 'success' }
  ];

  const activities = [
    {
      id: '1',
      type: 'irac_analysis' as const,
      user: { name: 'Ali Karimov' },
      action: 'IRAC tahlilini yakunladi',
      details: 'Shartnoma buzilishi holati',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      metadata: { score: 85 }
    },
    {
      id: '2',
      type: 'document_generated' as const,
      user: { name: 'Dilora Azizova' },
      action: 'Huquqiy xulosa yaratdi',
      details: 'Mulk nizosi bo\'yicha',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      metadata: { document_type: 'Huquqiy xulosa' }
    },
    {
      id: '3',
      type: 'scenario_created' as const,
      user: { name: 'Bobur Toshmatov' },
      action: 'Ta\'lim senariysini yaratdi',
      details: 'Shartnoma nizolari',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      metadata: { scenario_type: 'Shartnoma nizolari' }
    },
    {
      id: '4',
      type: 'weakness_detected' as const,
      user: { name: 'Malika Rahimova' },
      action: 'Kamchiliklarni aniqladi',
      details: 'Sud argumenti tahlili',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      metadata: { weakness_count: 3 }
    },
    {
      id: '5',
      type: 'irac_analysis' as const,
      user: { name: 'Sardor Qodirov' },
      action: 'IRAC tahlilini boshladi',
      details: 'Jinoyat ishi holati',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    }
  ];

  const courseProgress = [
    { name: 'Fuqarolik huquqi', value: 75, color: 'info' },
    { name: 'Jinoyat huquqi', value: 60, color: 'warning' },
    { name: 'Oila huquqi', value: 85, color: 'success' },
    { name: 'Mehnat huquqi', value: 45, color: 'danger' },
    { name: 'Ma\'muriy huquq', value: 70, color: 'default' }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Xayrli tong';
    if (hour < 18) return 'Xayrli kun';
    return 'Xayrli kech';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {user?.name || 'Foydalanuvchi'}!
        </h1>
        <p className="text-blue-100">
          JurisAI platformasida o\'qish va rivojlanish uchun qaytib keldingiz. Bugungi progressizni ko\'rib chiqing.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            description={stat.description}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="skills" className="space-y-4">
            <TabsList>
              <TabsTrigger value="skills">Ko\'nikmalar</TabsTrigger>
              <TabsTrigger value="courses">Kurslar</TabsTrigger>
              <TabsTrigger value="achievements">Yutuqlar</TabsTrigger>
            </TabsList>

            <TabsContent value="skills">
              <ProgressChart
                title="IRAC Komponentlari Bo'yicha Progress"
                data={progressData}
                maxValue={100}
              />
            </TabsContent>

            <TabsContent value="courses">
              <ProgressChart
                title="Kurslar Bo'yicha Progress"
                data={courseProgress}
                maxValue={100}
              />
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>So'nggi yutuqlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">🏆</span>
                        </div>
                        <div>
                          <p className="font-medium">IRAC Mutaxassisi</p>
                          <p className="text-sm text-gray-600">10 ta IRAC tahlili</p>
                        </div>
                      </div>
                      <Badge variant="warning">Yangi</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">📚</span>
                        </div>
                        <div>
                          <p className="font-medium">Kurs Bitiruvchisi</p>
                          <p className="text-sm text-gray-600">Fuqarolik huquqi kursi</p>
                        </div>
                      </div>
                      <Badge variant="success">To'liq</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">🎯</span>
                        </div>
                        <div>
                          <p className="font-medium">Aniq Tahlilchi</p>
                          <p className="text-sm text-gray-600">90%+ o'rtacha ball</p>
                        </div>
                      </div>
                      <Badge variant="default">Mukofot</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <ActivityFeed activities={activities} maxItems={5} />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tezkor harakatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yangi IRAC tahlili
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Hujjat yaratish
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Senariy yaratish
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  AI yordamchi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Work Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">So'nggi ishlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">IRAC Tahlili</Badge>
                <span className="text-xs text-gray-500">2 soat oldin</span>
              </div>
              <h4 className="font-medium mb-1">Shartnoma buzilishi</h4>
              <p className="text-sm text-gray-600 mb-2">Xizmat shartnomasi bo'yicha da'vo</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-600">85 ball</span>
                <Button variant="outline" size="sm">Ko'rish</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Hujjat</Badge>
                <span className="text-xs text-gray-500">5 soat oldin</span>
              </div>
              <h4 className="font-medium mb-1">Huquqiy xulosa</h4>
              <p className="text-sm text-gray-600 mb-2">Mulk nizosi bo'yicha</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">PDF format</span>
                <Button variant="outline" size="sm">Yuklash</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Senariy</Badge>
                <span className="text-xs text-gray-500">1 kun oldin</span>
              </div>
              <h4 className="font-medium mb-1">Oila huquqi</h4>
              <p className="text-sm text-gray-600 mb-2">Nikoh buzilishi holati</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">O'rtacha qiyinlik</span>
                <Button variant="outline" size="sm">Boshlash</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { Dashboard };
