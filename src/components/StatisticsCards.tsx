'use client';

import { TrendingUp, Users, Clock, Award, Trophy } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  progress: number;
  color: string;
  icon: React.ReactNode;
  trend?: string;
}

export default function StatisticsCards() {
  const stats: StatCard[] = [
    {
      title: 'XP',
      value: '2450',
      subtitle: 'XP',
      progress: 75,
      color: 'blue',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      trend: '+12%'
    },
    {
      title: 'To\'g\'ri javoblar',
      value: '87%',
      subtitle: 'To\'g\'ri javoblar',
      progress: 87,
      color: 'green',
      icon: <Users className="w-5 h-5 text-green-600" />,
      trend: '+8%'
    },
    {
      title: 'Ketma-ket kunlar',
      value: '42',
      subtitle: 'Ketma-ket kunlar',
      progress: 60,
      color: 'orange',
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      trend: '15 kun'
    },
    {
      title: 'Sertifikatlar',
      value: '12',
      subtitle: 'Sertifikatlar',
      progress: 40,
      color: 'purple',
      icon: <Award className="w-5 h-5 text-purple-600" />,
      trend: '+3'
    },
    {
      title: 'Reyting',
      value: '156',
      subtitle: 'Reyting',
      progress: 92,
      color: 'pink',
      icon: <Trophy className="w-5 h-5 text-pink-600" />,
      trend: 'Top 5%'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          progress: 'bg-blue-600',
          trend: 'text-green-600'
        };
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          progress: 'bg-green-600',
          trend: 'text-green-600'
        };
      case 'orange':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-600',
          progress: 'bg-orange-600',
          trend: 'text-orange-600'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          progress: 'bg-purple-600',
          trend: 'text-purple-600'
        };
      case 'pink':
        return {
          bg: 'bg-pink-100',
          text: 'text-pink-600',
          progress: 'bg-pink-600',
          trend: 'text-pink-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          progress: 'bg-gray-600',
          trend: 'text-gray-600'
        };
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        
        return (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                {stat.icon}
              </div>
              {stat.trend && (
                <span className={`text-xs font-medium ${colors.trend}`}>{stat.trend}</span>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.subtitle}</p>
            
            <div className="mt-3 bg-gray-200 rounded-full h-1">
              <div 
                className={`${colors.progress} h-1 rounded-full transition-all duration-300`} 
                style={{ width: `${stat.progress}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
