'use client';

import { ChevronRight } from 'lucide-react';

interface Case {
  id: string;
  title: string;
  description: string;
  difficulty: 'Boshlang\'ich' | 'O\'rta' | 'Yuqori';
  status: 'new' | 'in-progress' | 'completed';
}

export default function RecentCases() {
  const cases: Case[] = [
    {
      id: '1',
      title: 'Jinoyat ishi №245',
      description: 'O\'g\'irlik holati bo\'yicha',
      difficulty: 'O\'rta',
      status: 'in-progress'
    },
    {
      id: '2',
      title: 'Fuqarolik ishi №112',
      description: 'Mulk nizoli',
      difficulty: 'Boshlang\'ich',
      status: 'new'
    },
    {
      id: '3',
      title: 'Ma\'muriy ishi №78',
      description: 'Qoidabuzarlik',
      difficulty: 'Yuqori',
      status: 'in-progress'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Boshlang\'ich';
      case 'in-progress':
        return 'O\'rta';
      case 'completed':
        return 'Yuqori';
      default:
        return status;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Boshlang\'ich':
        return 'bg-green-100 text-green-700';
      case 'O\'rta':
        return 'bg-yellow-100 text-yellow-700';
      case 'Yuqori':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="col-span-3">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">So\'nggi ishlar</h2>
        
        <div className="space-y-4">
          {cases.map((case_) => (
            <div 
              key={case_.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div>
                <h3 className="font-semibold text-gray-800">{case_.title}</h3>
                <p className="text-sm text-gray-600">{case_.description}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(case_.status)}`}>
                  {getStatusText(case_.status)}
                </span>
                
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
        
        {/* View All Button */}
        <div className="mt-6 text-center">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Barcha ishlarni ko'rish →
          </button>
        </div>
      </div>
    </div>
  );
}
