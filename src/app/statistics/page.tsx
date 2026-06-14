'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp, Clock, Target, Award, Calendar, Filter, BarChart3, PieChart, Activity, Zap, BookOpen, Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface StatisticsData {
  totalXP: number;
  solvedCases: number;
  totalCases: number;
  averageAccuracy: number;
  studyTime: number;
  streak: number;
  iracScores: {
    issue: number;
    rule: number;
    application: number;
    conclusion: number;
  };
  skillLevels: {
    civil: number;
    criminal: number;
    labor: number;
    family: number;
    administrative: number;
    international: number;
  };
  dailyActivity: {
    date: string;
    activity: number;
    casesSolved: number;
    studyMinutes: number;
  }[];
  weeklyProgress: {
    week: string;
    xp: number;
    cases: number;
    accuracy: number;
  }[];
}

export default function Statistics() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'skills' | 'activity' | 'irac'>('overview');

  // Mock statistics data
  const statistics: StatisticsData = {
    totalXP: 3450,
    solvedCases: 42,
    totalCases: 100,
    averageAccuracy: 85,
    studyTime: 156, // hours
    streak: 12,
    iracScores: {
      issue: 92,
      rule: 78,
      application: 71,
      conclusion: 88
    },
    skillLevels: {
      civil: 90,
      criminal: 65,
      labor: 40,
      family: 75,
      administrative: 55,
      international: 30
    },
    dailyActivity: generateDailyActivity(),
    weeklyProgress: generateWeeklyProgress()
  };

  function generateDailyActivity() {
    const activity = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const activityLevel = Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : 0;
      const casesSolved = activityLevel > 0 ? Math.floor(Math.random() * 3) + 1 : 0;
      const studyMinutes = activityLevel > 0 ? Math.floor(Math.random() * 120) + 30 : 0;
      
      activity.push({
        date: date.toISOString().split('T')[0],
        activity: activityLevel,
        casesSolved,
        studyMinutes
      });
    }
    
    return activity;
  }

  function generateWeeklyProgress() {
    const weeks = ['1-hafta', '2-hafta', '3-hafta', '4-hafta'];
    return weeks.map(week => ({
      week,
      xp: Math.floor(Math.random() * 500) + 200,
      cases: Math.floor(Math.random() * 15) + 5,
      accuracy: Math.floor(Math.random() * 20) + 75
    }));
  }

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-100';
      case 2: return 'bg-green-200';
      case 3: return 'bg-green-300';
      case 4: return 'bg-green-400';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-100';
    }
  };

  const getSkillColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 60) return 'text-yellow-600';
    if (level >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getIRACColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 75) return 'bg-yellow-100 text-yellow-700';
    if (score >= 60) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getFilteredData = () => {
    switch (timeFilter) {
      case 'week':
        return {
          ...statistics,
          dailyActivity: statistics.dailyActivity.slice(-7),
          weeklyProgress: statistics.weeklyProgress.slice(-1)
        };
      case 'month':
        return {
          ...statistics,
          dailyActivity: statistics.dailyActivity.slice(-30),
          weeklyProgress: statistics.weeklyProgress.slice(-4)
        };
      default:
        return statistics;
    }
  };

  const filteredData = getFilteredData();

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
            
            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Statistika</span>
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
                <h1 className="text-2xl font-bold text-gray-800">Statistika</h1>
                <p className="text-sm text-gray-600">Platformadagi faoliyatingizning to'liq tahlili</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-orange-600">{statistics.streak} kun</span>
                  <span className="text-sm text-gray-600">davomiylik</span>
                </div>
                
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { value: 'week', label: 'Haftalik' },
                    { value: 'month', label: 'Oylik' },
                    { value: 'all', label: 'Barcha vaqt' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setTimeFilter(filter.value as any)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        timeFilter === filter.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-8">
            <div className="max-w-7xl mx-auto">
              {/* View Tabs */}
              <div className="flex gap-4 mb-8">
                {[
                  { id: 'overview', label: 'Umumiy ko\'rish', icon: <BarChart3 className="w-4 h-4" /> },
                  { id: 'skills', label: 'Bilim darajasi', icon: <Target className="w-4 h-4" /> },
                  { id: 'activity', label: 'Faollik', icon: <Activity className="w-4 h-4" /> },
                  { id: 'irac', label: 'IRAC tahlili', icon: <BookOpen className="w-4 h-4" /> }
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedView === view.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {view.icon}
                    {view.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {selectedView === 'overview' && (
                <div className="space-y-6">
                  {/* Progress Cards */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm text-green-600 font-medium">+12%</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{filteredData.totalXP.toLocaleString()}</h3>
                      <p className="text-sm text-gray-600">Umumiy XP</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-sm text-green-600 font-medium">+8%</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{filteredData.solvedCases}/{filteredData.totalCases}</h3>
                      <p className="text-sm text-gray-600">Yechilgan keyslar</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm text-green-600 font-medium">+5%</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{filteredData.averageAccuracy}%</h3>
                      <p className="text-sm text-gray-600">O\'rtacha aniqlik</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-sm text-green-600 font-medium">+15%</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{filteredData.studyTime} soat</h3>
                      <p className="text-sm text-gray-600">O\'quv vaqti</p>
                    </div>
                  </div>

                  {/* Weekly Progress Chart */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Haftalik progress</h3>
                    <div className="space-y-4">
                      {filteredData.weeklyProgress.map((week, index) => (
                        <div key={week.week} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-gray-600">{week.week}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${(week.xp / 700) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 w-16">{week.xp} XP</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{week.cases} keys</span>
                              <span>{week.accuracy}% aniqlik</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {selectedView === 'skills' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Yo\'nalishlar bo\'yicha bilim darajasi</h3>
                    
                    {/* Radar Chart Simulation */}
                    <div className="flex justify-center mb-8">
                      <div className="relative w-80 h-80">
                        <svg viewBox="0 0 320 320" className="w-full h-full">
                          {/* Grid circles */}
                          {[20, 40, 60, 80, 100].map((level, index) => (
                            <circle
                              key={index}
                              cx="160"
                              cy="160"
                              r={level * 1.4}
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="1"
                            />
                          ))}
                          
                          {/* Skill lines */}
                          {Object.entries(filteredData.skillLevels).map(([skill, level], index) => {
                            const angle = (index * 60 - 90) * Math.PI / 180;
                            const x = 160 + Math.cos(angle) * (level * 1.4);
                            const y = 160 + Math.sin(angle) * (level * 1.4);
                            return (
                              <line
                                key={skill}
                                x1="160"
                                y1="160"
                                x2={x}
                                y2={y}
                                stroke="#3b82f6"
                                strokeWidth="2"
                              />
                            );
                          })}
                          
                          {/* Skill points and labels */}
                          {Object.entries(filteredData.skillLevels).map(([skill, level], index) => {
                            const angle = (index * 60 - 90) * Math.PI / 180;
                            const x = 160 + Math.cos(angle) * (level * 1.4);
                            const y = 160 + Math.sin(angle) * (level * 1.4);
                            const labelX = 160 + Math.cos(angle) * 150;
                            const labelY = 160 + Math.sin(angle) * 150;
                            
                            const skillNames: Record<string, string> = {
                              civil: 'Fuqarolik',
                              criminal: 'Jinoyat',
                              labor: 'Mehnat',
                              family: 'Oilaviy',
                              administrative: 'Ma\'muriy',
                              international: 'Xalqaro'
                            };
                            
                            return (
                              <g key={skill}>
                                <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                                <text
                                  x={labelX}
                                  y={labelY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="text-xs fill-gray-700"
                                >
                                  {skillNames[skill]}
                                </text>
                                <text
                                  x={labelX}
                                  y={labelY + 12}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="text-xs font-bold fill-gray-900"
                                >
                                  {level}%
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                    
                    {/* Skill Details */}
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(filteredData.skillLevels).map(([skill, level]) => {
                        const skillNames: Record<string, string> = {
                          civil: 'Fuqarolik huquqi',
                          criminal: 'Jinoyat huquqi',
                          labor: 'Mehnat huquqi',
                          family: 'Oilaviy huquq',
                          administrative: 'Ma\'muriy huquq',
                          international: 'Xalqaro huquq'
                        };
                        
                        return (
                          <div key={skill} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800">{skillNames[skill]}</span>
                              <span className={`text-sm font-bold ${getSkillColor(level)}`}>{level}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  level >= 80 ? 'bg-green-500' :
                                  level >= 60 ? 'bg-yellow-500' :
                                  level >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${level}%` }}
                              ></div>
                            </div>
                            {level < 60 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Ko\'proq o\'rganish kerak</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {selectedView === 'activity' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Faollik grafigi</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-100 rounded"></div>
                          <span>Faollik yo\'q</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Yuqori faollik</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity Heatmap */}
                    <div className="space-y-2">
                      {Array.from({ length: 12 }, (_, weekIndex) => (
                        <div key={weekIndex} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">
                            {12 - weekIndex}-hafta
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: 7 }, (_, dayIndex) => {
                              const dataIndex = weekIndex * 7 + dayIndex;
                              if (dataIndex >= filteredData.dailyActivity.length) {
                                return <div key={dayIndex} className="w-8 h-8 bg-gray-50 rounded"></div>;
                              }
                              
                              const day = filteredData.dailyActivity[dataIndex];
                              return (
                                <div
                                  key={dayIndex}
                                  className={`w-8 h-8 rounded ${getHeatmapColor(day.activity)} border border-gray-200`}
                                  title={`${day.date}: ${day.casesSolved} keys, ${day.studyMinutes} daqiqa`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-600">Oxirgi 90 kun</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          {statistics.streak} kun davomiylik
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IRAC Tab */}
              {selectedView === 'irac' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">IRAC Metodi tahlili</h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {Object.entries(filteredData.iracScores).map(([step, score]) => {
                        const stepNames: Record<string, string> = {
                          issue: 'Issue (Muammo)',
                          rule: 'Rule (Qoida)',
                          application: 'Application (Tatbiq)',
                          conclusion: 'Conclusion (Xulosa)'
                        };
                        
                        const stepDescriptions: Record<string, string> = {
                          issue: 'Muammoni aniqlash mahorati',
                          rule: 'Qonunlarni eslab qolish darajasi',
                          application: 'Qonunni tatbiq etish',
                          conclusion: 'Xulosa chiqarish aniqligi'
                        };
                        
                        return (
                          <div key={step} className="p-6 border border-gray-200 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-gray-800">{stepNames[step]}</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getIRACColor(score)}`}>
                                {score}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{stepDescriptions[step]}</p>
                            <div className="bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  score >= 90 ? 'bg-green-500' :
                                  score >= 75 ? 'bg-yellow-500' :
                                  score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Recommendations */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        Tavsiyalar
                      </h4>
                      <div className="space-y-3">
                        {filteredData.iracScores.application < 75 && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-800">Tatbiq qilishni kuchaytirish</p>
                              <p className="text-sm text-gray-600">Siz qonunlarni yaxshi topasiz, lekin uni tatbiq etishda {100 - filteredData.iracScores.application}% xatolikka yo\'l qo\'yasiz. Ko\'proq amaliy mashqlar qiling.</p>
                            </div>
                          </div>
                        )}
                        
                        {filteredData.iracScores.rule < 80 && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-800">Qoidalarni takrorlang</p>
                              <p className="text-sm text-gray-600">Qonun moddalarini eslab qolishda qiyinchiliklar bor. Kartochka usulidan foydalanib, takrorlang.</p>
                            </div>
                          </div>
                        )}
                        
                        {filteredData.iracScores.issue >= 90 && filteredData.iracScores.conclusion >= 90 && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-800">A\'lo yo\'nalish</p>
                              <p className="text-sm text-gray-600">Muammoni topish va xulosa chiqarishda a\'lo natijalarni ko\'rsatmoqdasiz. Buni saqlab qoling!</p>
                            </div>
                          </div>
                        )}
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
