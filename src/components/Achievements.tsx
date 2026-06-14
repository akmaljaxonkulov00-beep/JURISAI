'use client';

import { Trophy, Award, Target, Users } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  progress?: number;
  unlocked?: boolean;
}

export default function Achievements() {
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Birinchi qadam',
      description: 'Dastlabki ish',
      icon: <Trophy className="w-6 h-6 text-white" />,
      color: 'blue',
      unlocked: true
    },
    {
      id: '2',
      title: '10 kun',
      description: 'Faollik',
      icon: <Award className="w-6 h-6 text-white" />,
      color: 'green',
      unlocked: true
    },
    {
      id: '3',
      title: 'Analist',
      description: '100% to\'g\'ri',
      icon: <Target className="w-6 h-6 text-white" />,
      color: 'purple',
      unlocked: true
    },
    {
      id: '4',
      title: 'Mentor',
      description: 'Yordamchi',
      icon: <Users className="w-6 h-6 text-white" />,
      color: 'orange',
      unlocked: false,
      progress: 75
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'from-blue-50 to-blue-100',
          iconBg: 'bg-blue-600',
          border: 'border-blue-200'
        };
      case 'green':
        return {
          bg: 'from-green-50 to-green-100',
          iconBg: 'bg-green-600',
          border: 'border-green-200'
        };
      case 'purple':
        return {
          bg: 'from-purple-50 to-purple-100',
          iconBg: 'bg-purple-600',
          border: 'border-purple-200'
        };
      case 'orange':
        return {
          bg: 'from-orange-50 to-orange-100',
          iconBg: 'bg-orange-600',
          border: 'border-orange-200'
        };
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          iconBg: 'bg-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  return (
    <div className="col-span-2">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Yutuqlar</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const colors = getColorClasses(achievement.color);
            
            return (
              <div
                key={achievement.id}
                className={`bg-gradient-to-br ${colors.bg} p-4 rounded-xl text-center relative ${
                  !achievement.unlocked ? 'opacity-60' : ''
                }`}
              >
                {/* Progress Indicator for Locked Achievements */}
                {!achievement.unlocked && achievement.progress && (
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 relative">
                      <svg className="w-8 h-8 transform -rotate-90">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                          fill="none"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="#f97316"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - achievement.progress / 100)}`}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                        {achievement.progress}%
                      </span>
                    </div>
                  </div>
                )}
                
                <div className={`w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-2 ${
                  !achievement.unlocked ? 'grayscale' : ''
                }`}>
                  {achievement.icon}
                </div>
                
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-gray-600">{achievement.description}</p>
                
                {/* Lock indicator for locked achievements */}
                {!achievement.unlocked && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">🔒 Qulflangan</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Achievement Stats */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Yutuqlar statistikasi</p>
              <p className="text-xs text-gray-600">3/4 ochilgan</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">75%</p>
              <p className="text-xs text-gray-600">Umumiy progress</p>
            </div>
          </div>
          
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: '75%' }}
            ></div>
          </div>
        </div>
        
        {/* View All Button */}
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Barcha yutuqlarni ko'rish →
          </button>
        </div>
      </div>
    </div>
  );
}
