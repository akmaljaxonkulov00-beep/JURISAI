'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Clock, Award, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  category: string;
}

const mockQuestions: Question[] = [
  {
    id: 1,
    question: "O'zbekiston Konstitutsiyasiga ko'ra, fuqarolik yoshi nechadan boshlanadi?",
    options: [
      "14 yoshdan",
      "16 yoshdan", 
      "18 yoshdan",
      "21 yoshdan"
    ],
    correctAnswer: 2,
    explanation: "O'zbekiston Konstitutsiyasining 17-moddasiga ko'ra, fuqarolik yoshi 18 yoshdan boshlanadi.",
    category: "Konstitutsiyaviy huquq",
    difficulty: 'easy'
  },
  {
    id: 2,
    question: "Jinoyat kodeksiga ko'ra, qaysi xatti-harakat jinoyat hisoblanmaydi?",
    options: [
      "O'g'irlik",
      "Talonchilik",
      "O'zini o'zi himoya qilish",
      "Makon buzish"
    ],
    correctAnswer: 2,
    explanation: "O'zini o'zi himoya qilish qonuniy harakat bo'lib, jinoyat tarkibiga to'g'ri kelmaydi.",
    category: "Jinoyat huquqi",
    difficulty: 'medium'
  },
  {
    id: 3,
    question: "Fuqarolik kodeksiga ko'ra, shartnoma tuzish uchun tomonlar nechta bo'lishi kerak?",
    options: [
      "1 ta",
      "2 ta",
      "3 ta",
      "Cheksiz ko'p"
    ],
    correctAnswer: 1,
    explanation: "Shartnoma kamida 2 tomon o'rtasida tuziladi.",
    category: "Fuqarolik huquqi",
    difficulty: 'easy'
  },
  {
    id: 4,
    question: "Ish haqi to'lanmagan holda ishlagan kunlar uchun tovon puli qanday hisoblanadi?",
    options: [
      "O'rtacha ish haqining 1 barobari",
      "O'rtacha ish haqining 2 barobari",
      "O'rtacha ish haqining 3 barobari",
      "To'lanmaydi"
    ],
    correctAnswer: 1,
    explanation: "Mehnat kodeksiga ko'ra, ish haqi to'lanmagan holda ishlagan kunlar uchun o'rtacha ish haqining kamida 2 barobari miqdorida tovon puli to'lanadi.",
    category: "Mehnat huquqi",
    difficulty: 'hard'
  },
  {
    id: 5,
    question: "Da'vo muddati qancha vaqt davom etadi?",
    options: [
      "1 yil",
      "3 yil",
      "5 yil",
      "10 yil"
    ],
    correctAnswer: 1,
    explanation: "Fuqarolik kodeksiga ko'ra, umumiy da'vo muddati 3 yilni tashkil etadi.",
    category: "Fuqarolik huquqi",
    difficulty: 'medium'
  }
];

export default function TestQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const question = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers, selectedAnswer];
      setAnswers(newAnswers);

      if (currentQuestion < mockQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz completed
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const correctCount = newAnswers.filter((answer, index) => 
          answer === mockQuestions[index].correctAnswer
        ).length;

        const quizResult: QuizResult = {
          score: Math.round((correctCount / mockQuestions.length) * 100),
          totalQuestions: mockQuestions.length,
          correctAnswers: correctCount,
          timeSpent,
          category: "Huquqiy test"
        };

        setResult(quizResult);
        setQuizCompleted(true);
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setStartTime(Date.now());
    setQuizCompleted(false);
    setResult(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (quizCompleted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test yakunlandi!</h1>
              <p className="text-gray-600">Huquqiy bilimlaringizni tekshirdingiz</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(result.score)}`}>
                      {result.score}%
                    </div>
                    <p className="text-gray-600">To'g'ri javoblar</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {result.correctAnswers}/{result.totalQuestions}
                    </div>
                    <p className="text-gray-600">Javoblar nisbati</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-gray-600">Sarflangan vaqt</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {result.score >= 80 ? 'A\'lo' : result.score >= 60 ? 'Yaxshi' : 'Qoniqarli'}
                    </div>
                    <p className="text-gray-600">Baho</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Javoblarni ko'rib chiqish:</h3>
              {mockQuestions.map((q, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                
                return (
                  <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">Savol {index + 1}:</span>
                            <Badge className={getDifficultyColor(q.difficulty)}>
                              {q.difficulty === 'easy' ? 'Oson' : q.difficulty === 'medium' ? 'O\'rta' : 'Qiyin'}
                            </Badge>
                            <Badge variant="outline">{q.category}</Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{q.question}</p>
                          <div className="space-y-1">
                            {q.options.map((option, optIndex) => (
                              <div 
                                key={optIndex}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  optIndex === q.correctAnswer 
                                    ? 'bg-green-50 text-green-700' 
                                    : optIndex === userAnswer && !isCorrect
                                    ? 'bg-red-50 text-red-700'
                                    : 'text-gray-600'
                                }`}
                              >
                                {optIndex === q.correctAnswer && <CheckCircle className="w-4 h-4" />}
                                {optIndex === userAnswer && !isCorrect && <XCircle className="w-4 h-4" />}
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Izoh:</strong> {q.explanation}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={handleRestart} className="px-8">
                Testni qayta boshlash
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Orqaga qaytish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Huquqiy test</h1>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">
                  {Math.floor((Date.now() - startTime) / 1000)}s
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Savol {currentQuestion + 1} / {mockQuestions.length}</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% tugallangan</span>
            </div>
          </div>

          {/* Question */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty === 'easy' ? 'Oson' : question.difficulty === 'medium' ? 'O\'rta' : 'Qiyin'}
                </Badge>
                <Badge variant="outline">{question.category}</Badge>
              </div>
              <CardTitle className="text-xl">{question.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                        )}
                      </div>
                      <span className="text-gray-700">{option}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestion > 0) {
                  setCurrentQuestion(currentQuestion - 1);
                  setSelectedAnswer(answers[currentQuestion - 1] || null);
                }
              }}
              disabled={currentQuestion === 0}
            >
              Oldingi savol
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="px-8"
            >
              {currentQuestion === mockQuestions.length - 1 ? 'Testni yakunlash' : 'Keyingi savol'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
