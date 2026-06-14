'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Play, CheckCircle, Clock, User, Download, Award, Filter, Search, Video, FileText, Target, Star } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  mentor: {
    name: string;
    title: string;
    avatar: string;
  };
  totalLessons: number;
  completedLessons: number;
  progress: number;
  status: 'ongoing' | 'completed' | 'enrolled';
  duration: string;
  level: 'Boshlangich' | 'Orta' | 'Yuqori';
  certificate?: {
    id: string;
    issuedDate: string;
    qrCode: string;
  };
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'text' | 'interactive';
  completed: boolean;
  materials: {
    type: 'pdf' | 'doc' | 'video' | 'test';
    title: string;
    url: string;
  }[];
}

export default function MyCourses() {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed' | 'enrolled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const courses: Course[] = [
    {
      id: '1',
      title: 'Fuqarolik huquqi: Professional kurs',
      description: 'Fuqarolik huquqining asosiy tamoyillari va amaliy qo\'llanilishi',
      image: '📚',
      category: 'Fuqarolik huquqi',
      mentor: {
        name: 'Dr. Aziz Karimov',
        title: 'Huquqshunoslik fanlari doktori',
        avatar: '👨‍🏫'
      },
      totalLessons: 30,
      completedLessons: 12,
      progress: 40,
      status: 'ongoing',
      duration: '8 hafta',
      level: 'Orta',
      lessons: [
        {
          id: '1-1',
          title: 'Fuqarolik huquqining predmeti',
          description: 'Fuqarolik huquqi nima va u qanday munosabatlarni tartibga soladi',
          duration: '45 daqiqa',
          type: 'video',
          completed: true,
          materials: [
            { type: 'video', title: 'Dars videosi', url: '#' },
            { type: 'pdf', title: 'Dars konspekti', url: '#' },
            { type: 'test', title: 'Kichik test', url: '#' }
          ]
        },
        {
          id: '1-2',
          title: 'Fuqarolik huquqiy subyektlari',
          description: 'Fuqarolik huquqiy munosabatlarda ishtirok etuvchi shaxslar',
          duration: '50 daqiqa',
          type: 'video',
          completed: true,
          materials: [
            { type: 'video', title: 'Dars videosi', url: '#' },
            { type: 'doc', title: 'Qonun matnlari', url: '#' },
            { type: 'test', title: 'Amaliy vazifa', url: '#' }
          ]
        },
        {
          id: '1-3',
          title: 'Shartnomalar huquqi',
          description: 'Shartnomalar tuzish va ularning huquqiy ahamiyati',
          duration: '60 daqiqa',
          type: 'interactive',
          completed: false,
          materials: [
            { type: 'video', title: 'Interaktiv dars', url: '#' },
            { type: 'pdf', title: 'Shartnoma namunalari', url: '#' },
            { type: 'test', title: 'Case Solver mashqi', url: '#' }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Jinoyat huquqi asoslari',
      description: 'Jinoyat huquqi va jinoyat tarkibi tushunchalari',
      image: '⚖️',
      category: 'Jinoyat huquqi',
      mentor: {
        name: 'Prof. Dilora Nazarova',
        title: 'Jinoyat huquqi professori',
        avatar: '👩‍🏫'
      },
      totalLessons: 25,
      completedLessons: 25,
      progress: 100,
      status: 'completed',
      duration: '6 hafta',
      level: 'Yuqori',
      certificate: {
        id: 'CERT-2024-001',
        issuedDate: '2024-03-15',
        qrCode: 'QR-12345'
      },
      lessons: []
    },
    {
      id: '3',
      title: 'Mehnat huquqi va amaliyoti',
      description: 'Ishchi va ish beruvchi o\'rtasidagi huquqiy munosabatlar',
      image: '💼',
      category: 'Mehnat huquqi',
      mentor: {
        name: 'Bahodir Toshmatov',
        title: 'Mehnat huquqi eksperti',
        avatar: '👨‍💼'
      },
      totalLessons: 20,
      completedLessons: 0,
      progress: 0,
      status: 'enrolled',
      duration: '5 hafta',
      level: 'Boshlangich',
      lessons: []
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'enrolled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'enrolled': return <BookOpen className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing': return 'Davom etmoqda';
      case 'completed': return 'Yakunlangan';
      case 'enrolled': return 'Sotib olingan';
      default: return status;
    }
  };

  const handleCertificateDownload = (course: Course) => {
    if (course.certificate) {
      setShowCertificate(true);
      setSelectedCourse(course);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    // In a real app, this would navigate to the lesson page
    console.log('Opening lesson:', lesson.title);
  };

  if (selectedCourse && !showCertificate) {
    return (
      <div className="min-h-screen bg-[#f8faff]">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Course Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{selectedCourse.image}</div>
                  <h3 className="font-semibold text-gray-800">{selectedCourse.title}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{selectedCourse.progress}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Darslar:</span>
                    <span className="font-medium">{selectedCourse.completedLessons}/{selectedCourse.totalLessons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mentor:</span>
                    <span className="font-medium">{selectedCourse.mentor.name}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Button */}
              {selectedCourse.certificate && (
                <button
                  onClick={() => handleCertificateDownload(selectedCourse)}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Sertifikatni yuklab olish
                </button>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="flex-1">
            {/* Header */}
            <header className="bg-white px-8 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{selectedCourse.title}</h1>
                  <p className="text-sm text-gray-600">{selectedCourse.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCourse.status)}`}>
                    {getStatusText(selectedCourse.status)}
                  </span>
                </div>
              </div>
            </header>

            {/* Lessons */}
            <main className="p-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Darslar ({selectedCourse.lessons.length})</h2>
                
                <div className="space-y-4">
                  {selectedCourse.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              lesson.completed 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {lesson.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{lesson.title}</h3>
                              <p className="text-sm text-gray-600">{lesson.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              {lesson.type === 'video' && <Video className="w-4 h-4" />}
                              {lesson.type === 'text' && <FileText className="w-4 h-4" />}
                              {lesson.type === 'interactive' && <Target className="w-4 h-4" />}
                              <span>{lesson.duration}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleLessonClick(lesson)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            lesson.completed
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {lesson.completed ? 'Qayta ko\'rish' : 'Boshlash'}
                        </button>
                      </div>
                      
                      {/* Lesson Materials */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Materiallar:</h4>
                        <div className="flex flex-wrap gap-2">
                          {lesson.materials.map((material, idx) => (
                            <button
                              key={idx}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                                material.type === 'video' ? 'bg-blue-50 text-blue-700' :
                                material.type === 'pdf' ? 'bg-red-50 text-red-700' :
                                material.type === 'doc' ? 'bg-green-50 text-green-700' :
                                'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {material.type === 'video' && <Video className="w-3 h-3" />}
                              {material.type === 'pdf' && <FileText className="w-3 h-3" />}
                              {material.type === 'doc' && <FileText className="w-3 h-3" />}
                              {material.type === 'test' && <Target className="w-3 h-3" />}
                              {material.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (showCertificate && selectedCourse) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-4 overflow-hidden">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <Award className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sertifikat</h1>
            <p className="text-blue-100">Ushbu sertifikat bilan tasdiqlanadi</p>
          </div>
          
          {/* Certificate Body */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{selectedCourse.title}</h2>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-lg text-gray-700 mb-4">
                  <strong>Sarvar Karimov</strong> ushbu kursni muvaffaqiyatli tamomladi
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-600">Kurs davomiyligi:</p>
                    <p className="font-medium">{selectedCourse.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Darslar soni:</p>
                    <p className="font-medium">{selectedCourse.totalLessons} ta</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Berilgan sana:</p>
                    <p className="font-medium">{selectedCourse.certificate?.issuedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sertifikat raqami:</p>
                    <p className="font-medium">{selectedCourse.certificate?.id}</p>
                  </div>
                </div>
              </div>
              
              {/* QR Code Placeholder */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📱</div>
                    <p className="text-xs text-gray-600">QR Kod</p>
                    <p className="text-xs text-gray-500">{selectedCourse.certificate?.qrCode}</p>
                  </div>
                </div>
              </div>
              
              {/* Mentor Signature */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedCourse.mentor.avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{selectedCourse.mentor.name}</p>
                    <p className="text-sm text-gray-600">{selectedCourse.mentor.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Certificate Actions */}
          <div className="bg-gray-50 px-8 py-4 flex justify-between">
            <button
              onClick={() => setShowCertificate(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Orqaga
            </button>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Yuklab olish
              </button>
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Award className="w-4 h-4" />
                Yutuqlarga qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </button>
            
            {/* Daily Goal Block */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800">Kundalik maqsad</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">2 ta dars qolgan</p>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Mening kurslarim</span>
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
                <h1 className="text-2xl font-bold text-gray-800">Mening kurslarim</h1>
                <p className="text-sm text-gray-600">Barcha o\'quv kontentingiz markaziy kutubxonasi</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Kurslarni qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Barchasi ({courses.length})
                </button>
                <button
                  onClick={() => setFilter('ongoing')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'ongoing' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Davom etayotgan ({courses.filter(c => c.status === 'ongoing').length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'completed' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Yakunlangan ({courses.filter(c => c.status === 'completed').length})
                </button>
                <button
                  onClick={() => setFilter('enrolled')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'enrolled' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sotib olingan ({courses.filter(c => c.status === 'enrolled').length})
                </button>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <main className="p-8">
            <div className="grid grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Course Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-6xl">{course.image}</div>
                  </div>
                  
                  {/* Course Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(course.status)}`}>
                        {getStatusIcon(course.status)}
                        {getStatusText(course.status)}
                      </span>
                      <span className="text-xs text-gray-500">{course.level}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                    
                    {/* Progress Bar */}
                    {course.status === 'ongoing' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-xs font-medium text-gray-800">{course.progress}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Course Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.completedLessons}/{course.totalLessons} dars</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    
                    {/* Mentor Info */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {course.mentor.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{course.mentor.name}</p>
                        <p className="text-xs text-gray-600">{course.mentor.title}</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        {course.status === 'enrolled' ? 'Boshlash' : 'Davom ettirish'}
                      </button>
                      
                      {course.certificate && (
                        <button
                          onClick={() => handleCertificateDownload(course)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Kurslar topilmadi</h3>
                <p className="text-gray-600">Qidiruv shartlarini o\'zgartirib ko\'ring</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
