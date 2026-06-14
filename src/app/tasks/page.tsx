'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, FileText, Search, Filter, Plus, Calendar, User, Target, BookOpen, Award, RefreshCw, Bell, Edit3, Send } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'case-study' | 'document-prep' | 'research';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'new' | 'in-progress' | 'completed' | 'submitted' | 'graded';
  deadline: string;
  maxScore: number;
  currentScore?: number;
  feedback?: string;
  instructor?: string;
  createdAt: string;
  submittedAt?: string;
  gradedAt?: string;
  canResubmit: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in hours
}

export default function Tasks() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'new' | 'in-progress' | 'completed'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'case-study' | 'document-prep' | 'research'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');

  // Mock tasks data
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Jinoyat ishi #245 - O\'g\'irlik holati',
      description: 'Berilgan faktlar asosida jinoyat ishini IRAC metodi bilan tahlil qiling. Tuman prokuraturasi tomonidan qo\'yilgan ayblovni o\'rganing.',
      type: 'case-study',
      difficulty: 'medium',
      status: 'new',
      deadline: '2024-03-28',
      maxScore: 100,
      priority: 'high',
      estimatedTime: 3,
      createdAt: '2024-03-20',
      canResubmit: false
    },
    {
      id: '2',
      title: 'Da\'vo arizasi loyihasi',
      description: 'Tijorat shartnomasining buzilishi holati uchun da\'vo arizasi loyihasini tayyorlang. Ariza Fuqarolik protsessual kodeksiga muvofiq bo\'lishi kerak.',
      type: 'document-prep',
      difficulty: 'hard',
      status: 'in-progress',
      deadline: '2024-03-30',
      maxScore: 100,
      priority: 'high',
      estimatedTime: 4,
      createdAt: '2024-03-18',
      canResubmit: false
    },
    {
      id: '3',
      title: 'Mehnat kodeksidagi o\'zgarishlar',
      description: '2024-yilda Mehnat kodeksiga kiritilgan 3 ta asosiy o\'zgarishni toping, ularning mohiyatini izohlang va amaliy ahamiyatini tahlil qiling.',
      type: 'research',
      difficulty: 'medium',
      status: 'submitted',
      deadline: '2024-03-25',
      maxScore: 100,
      currentScore: 75,
      feedback: 'Yaxshi tadqiqot, lekin amaliy misollar ko\'proq bo\'lishi kerak edi. Qayta topshirish imkoniyati bor.',
      instructor: 'Prof. Dilora Nazarova',
      createdAt: '2024-03-15',
      submittedAt: '2024-03-24',
      gradedAt: '2024-03-25',
      canResubmit: true,
      priority: 'medium',
      estimatedTime: 2
    },
    {
      id: '4',
      title: 'Oilaviy nizo - Aliment to\'lovi',
      description: 'Oila kodeksiga muvofiq ravishda, aliment to\'lovi bo\'yicha da\'vo arizasi tayyorlang. Bolaning yoshi va ota-onaning daromadini hisobga oling.',
      type: 'document-prep',
      difficulty: 'easy',
      status: 'graded',
      deadline: '2024-03-22',
      maxScore: 100,
      currentScore: 92,
      feedback: 'A\'lo ish! Ariza to\'liq, qonunga muvofiq va barcha talablarni qondirdi.',
      instructor: 'Dr. Aziz Karimov',
      createdAt: '2024-03-10',
      submittedAt: '2024-03-21',
      gradedAt: '2024-03-22',
      canResubmit: false,
      priority: 'low',
      estimatedTime: 2
    },
    {
      id: '5',
      title: 'Xalqaro arbitraj qarori tahlili',
      description: 'Berilgan xalqaro arbitraj qarorini tahlil qiling. Qarorning qonuniy asoslari, qo\'llanilgan xalqaro konvensiyalar va amaliy ahamiyatini izohlang.',
      type: 'case-study',
      difficulty: 'hard',
      status: 'new',
      deadline: '2024-04-02',
      maxScore: 100,
      priority: 'medium',
      estimatedTime: 5,
      createdAt: '2024-03-22',
      canResubmit: false
    }
  ];

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(task => {
        if (selectedFilter === 'new') return task.status === 'new';
        if (selectedFilter === 'in-progress') return task.status === 'in-progress';
        if (selectedFilter === 'completed') return ['completed', 'submitted', 'graded'].includes(task.status);
        return true;
      });
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(task => task.type === selectedType);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'case-study': return <FileText className="w-5 h-5" />;
      case 'document-prep': return <Edit3 className="w-5 h-5" />;
      case 'research': return <BookOpen className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTaskTypeText = (type: string) => {
    switch (type) {
      case 'case-study': return 'Keys tahlili';
      case 'document-prep': return 'Hujjat tayyorlash';
      case 'research': return 'Tadqiqot vazifasi';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'submitted': return 'bg-purple-100 text-purple-700';
      case 'graded': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'in-progress': return 'Jarayonda';
      case 'submitted': return 'Topshirilgan';
      case 'graded': return 'Baholangan';
      default: return status;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Oson';
      case 'medium': return 'O\'rta';
      case 'hard': return 'Qiyin';
      default: return difficulty;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline);
    if (days <= 1) return 'text-red-600';
    if (days <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getNewTasksCount = () => {
    return tasks.filter(task => task.status === 'new').length;
  };

  const handleTaskStart = (taskId: string) => {
    // In a real app, this would update the task status
    console.log('Starting task:', taskId);
  };

  const handleTaskSubmit = () => {
    if (!selectedTask || !submissionContent.trim()) return;
    
    // In a real app, this would submit the task
    console.log('Submitting task:', selectedTask.id, submissionContent);
    setShowSubmissionModal(false);
    setSubmissionContent('');
    setSelectedTask(null);
  };

  const filteredTasks = getFilteredTasks();

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-[#f8faff]">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Task Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">{selectedTask.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getTaskTypeIcon(selectedTask.type)}
                    <span className="text-gray-600">{getTaskTypeText(selectedTask.type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(selectedTask.difficulty)}`}>
                      {getDifficultyText(selectedTask.difficulty)}
                    </span>
                    <span className="text-gray-600">{selectedTask.estimatedTime} soat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className={`font-medium ${getDeadlineColor(selectedTask.deadline)}`}>
                      {selectedTask.deadline}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                  <span>Topshirish</span>
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <RefreshCw className="w-4 h-4" />
                  <span>Qayta boshlash</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <header className="bg-white px-8 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{selectedTask.title}</h1>
                  <p className="text-sm text-gray-600">{getTaskTypeText(selectedTask.type)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                    {getStatusText(selectedTask.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedTask.difficulty)}`}>
                    {getDifficultyText(selectedTask.difficulty)}
                  </span>
                </div>
              </div>
            </header>

            <main className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Topshiriq tavsifi</h2>
                    <p className="text-gray-700 leading-relaxed">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-800">Maksimal ball</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{selectedTask.maxScore}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-gray-800">Tugash muddati</span>
                      </div>
                      <p className={`text-lg font-bold ${getDeadlineColor(selectedTask.deadline)}`}>
                        {selectedTask.deadline}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-800">Ustoz</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        {selectedTask.instructor || 'AI Assistent'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedTask.feedback && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-2">Oldingi feedback</h3>
                      <p className="text-gray-700">{selectedTask.feedback}</p>
                      {selectedTask.instructor && (
                        <p className="text-sm text-gray-600 mt-2">- {selectedTask.instructor}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
        
        {/* Submission Modal */}
        {showSubmissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl mx-4 w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Topshiriqni topshirish</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Javobingiz</label>
                <textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Topshiriq bo'yicha javobingizni bu yerga yozing..."
                  className="w-full h-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleTaskSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Topshirish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Topshiriqlar</span>
                {getNewTasksCount() > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    {getNewTasksCount()}
                  </span>
                )}
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
                <h1 className="text-2xl font-bold text-gray-800">Topshiriqlar</h1>
                <p className="text-sm text-gray-600">Nazorat punkti - barcha amaliy vazifalar</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>
          </header>

          {/* Filter Tabs */}
          <div className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Barchasi ({tasks.length})
              </button>
              <button
                onClick={() => setSelectedFilter('new')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFilter === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Yangi ({tasks.filter(t => t.status === 'new').length})
              </button>
              <button
                onClick={() => setSelectedFilter('in-progress')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFilter === 'in-progress'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Jarayonda ({tasks.filter(t => t.status === 'in-progress').length})
              </button>
              <button
                onClick={() => setSelectedFilter('completed')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedFilter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Bajarilgan ({tasks.filter(t => ['completed', 'submitted', 'graded'].includes(t.status)).length})
              </button>
            </div>
          </div>

          {/* Type Filter */}
          <div className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Barcha turlar
              </button>
              <button
                onClick={() => setSelectedType('case-study')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedType === 'case-study'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Keys tahlili
              </button>
              <button
                onClick={() => setSelectedType('document-prep')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedType === 'document-prep'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hujjat tayyorlash
              </button>
              <button
                onClick={() => setSelectedType('research')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedType === 'research'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tadqiqot
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="space-y-4">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(task.status)}`}>
                            {getTaskTypeIcon(task.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                            <p className="text-sm text-gray-600">{getTaskTypeText(task.type)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                            {getDifficultyText(task.difficulty)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{task.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className={getDeadlineColor(task.deadline)}>
                            {getDaysUntilDeadline(task.deadline) > 0 
                              ? `${getDaysUntilDeadline(task.deadline)} kun qoldi`
                              : 'Muddati o\'tgan'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{task.estimatedTime} soat</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{task.maxScore} ball</span>
                        </div>
                      </div>
                      
                      {task.status === 'new' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskStart(task.id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Boshlash
                        </button>
                      )}
                      
                      {task.status === 'in-progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                          Davom ettirish
                        </button>
                      )}
                      
                      {(task.status === 'submitted' || task.status === 'graded') && (
                        <div className="flex items-center gap-2">
                          {task.currentScore && (
                            <span className="font-bold text-lg">
                              {task.currentScore}/{task.maxScore}
                            </span>
                          )}
                          {task.canResubmit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                              }}
                              className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                            >
                              Qayta topshirish
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {task.feedback && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Feedback</span>
                        </div>
                        <p className="text-sm text-gray-700">{task.feedback}</p>
                        {task.instructor && (
                          <p className="text-xs text-gray-600 mt-1">- {task.instructor}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Topshiriqlar topilmadi</h3>
                  <p className="text-gray-600">Tanlangan filtrga mos topshiriqlar mavjud emas</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
