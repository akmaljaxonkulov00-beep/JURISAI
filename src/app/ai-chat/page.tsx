'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Search, FileText, Mic, Send, BookOpen, Scale, HelpCircle, Volume2, Clock, Star, Lightbulb, Copy, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  category?: 'legal' | 'case' | 'document' | 'general';
  relatedLaws?: string[];
  suggestions?: string[];
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface LegalTerm {
  term: string;
  definition: string;
  article?: string;
}

export default function AIChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMode, setActiveMode] = useState<'chat' | 'case' | 'document'>('chat');
  const [showGlossary, setShowGlossary] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<LegalTerm | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const legalTerms: LegalTerm[] = [
    { term: 'Jinoyat tarkibi', definition: 'Jinoyatni tashkil etuvchi obyektiv va subyektiv belgilarning majmuasi', article: 'JK 3-modda' },
    { term: 'Majburiy qonun', definition: 'Davlat tomonidan qabul qilingan, barcha uchun majburiy bo\'lgan qoidalar to\'plami', article: '' },
    { term: 'Huquqiy subyekt', definition: 'Huquq va majburiyatlarga ega bo\'lishi mumkin bo\'lgan shaxs yoki tashkilot', article: 'FK 8-modda' },
    { term: 'Da\'vo muddati', definition: 'Sudga murojaat qilish uchun belgilangan vaqt', article: 'GPK 77-modda' },
    { term: 'Shartnoma', definition: 'Tomonlar o\'rtasidagi o\'zaro kelishuv asosida huquqiy munosabatlarni belgilovchi hujjat', article: 'FK 342-modda' }
  ];

  const quickActions = [
    { id: 'find-law', label: 'Qonunni top', icon: <BookOpen className="w-4 h-4" />, color: 'blue' },
    { id: 'case-analysis', label: 'Keys tahlili', icon: <Scale className="w-4 h-4" />, color: 'green' },
    { id: 'document', label: 'Hujjat yaratish', icon: <FileText className="w-4 h-4" />, color: 'purple' }
  ];

  const documentTemplates = [
    { id: 'contract', name: 'Shartnoma', description: 'Tijorat shartnomasi namunasi' },
    { id: 'complaint', name: 'Da\'vo arizasi', description: 'Sudga da\'vo arizasi' },
    { id: 'warning', name: 'Ogohlantirish xati', description: 'Qonun buzilishi to\'g\'risida ogohlantirish' },
    { id: 'power-of-attorney', name: 'Vakolatnoma', description: 'Vakolat berish hujjati' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      type: 'user',
      timestamp: new Date(),
      category: selectedCategory === 'all' ? undefined : selectedCategory as any
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Generate AI response
    setTimeout(() => {
      generateAIResponse(inputValue);
    }, 1000);
  };

  const generateAIResponse = async (userInput: string) => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
      });

      if (!response.ok) {
        throw new Error('AI javob berishda xatolik');
      }

      const data = await response.json();
      
      let category: 'legal' | 'case' | 'document' | 'general' = 'general';
      let relatedLaws: string[] = [];
      let suggestions: string[] = [];

      // Detect category from input
      if (userInput.toLowerCase().includes('modda') || userInput.toLowerCase().includes('qonun')) {
        category = 'legal';
        relatedLaws = ['O\'zbekiston Konstitutsiyasi', 'Fuqarolik kodeksi'];
      } else if (userInput.toLowerCase().includes('shartnoma')) {
        category = 'document';
        relatedLaws = ['FK 342-modda', 'FK 343-modda'];
      } else if (userInput.toLowerCase().includes('sud') || userInput.toLowerCase().includes('da\'vo')) {
        category = 'case';
        relatedLaws = ['GPK 91-modda', 'GPK 92-modda'];
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Javob olishda xatolik yuz berdi',
        type: 'assistant',
        timestamp: new Date(),
        category,
        relatedLaws,
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Uzr, javob berishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
        type: 'assistant',
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'find-law':
        setInputValue('O\'zbekiston qonunlarini topishim kerak');
        break;
      case 'case-analysis':
        setInputValue('Case tahlili qilishim kerak');
        break;
      case 'document':
        setInputValue('Hujjat yaratishim kerak');
        break;
    }
    inputRef.current?.focus();
  };

  const handleDocumentTemplate = (templateId: string) => {
    const template = documentTemplates.find(t => t.id === templateId);
    if (template) {
      setInputValue(`${template.name} yaratishim kerak. ${template.description}`);
      setActiveMode('document');
    }
  };

  const handleTermClick = (term: LegalTerm) => {
    setSelectedTerm(term);
    setShowGlossary(true);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'legal': return 'bg-blue-100 text-blue-800';
      case 'case': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">AI Yordamchi</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Lightbulb className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Star className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        {showSuggestions && (
          <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Tezkor harakatlar</h3>
            <div className="space-y-2 mb-6">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className={`w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left flex items-center gap-3`}
                >
                  <div className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600`}>
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900 mb-4">Hujjat namunalari</h3>
            <div className="space-y-2">
              {documentTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleDocumentTemplate(template.id)}
                  className="w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                </button>
              ))}
            </div>

            <h3 className="font-semibold text-gray-900 mb-4 mt-6">Huquqiy lug'at</h3>
            <div className="space-y-2">
              {legalTerms.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleTermClick(term)}
                  className="w-full p-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{term.term}</div>
                  {term.article && (
                    <div className="text-sm text-gray-600">{term.article}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Yordamchiga xush kelibsiz!</h3>
                <p className="text-gray-600 mb-6">Huquqiy savollaringizni bering, men yordam beraman</p>
                <div className="flex justify-center gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className={`p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors`}
                    >
                      <div className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600`}>
                        {action.icon}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-lg rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.category && (
                    <div className="mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(message.category)}`}>
                        {message.category === 'legal' ? 'Huquqiy' : 
                         message.category === 'case' ? 'Case' : 
                         message.category === 'document' ? 'Hujjat' : 'Umumiy'}
                      </span>
                    </div>
                  )}
                  <p className={message.type === 'user' ? 'text-white' : 'text-gray-900'}>
                    {message.text}
                  </p>
                  {message.relatedLaws && message.relatedLaws.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Tegishli qonunlar:</div>
                      <div className="space-y-1">
                        {message.relatedLaws.map((law, index) => (
                          <div key={index} className="text-sm text-gray-600">• {law}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setInputValue(suggestion)}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Huquqiy savolingizni yozing..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={handleVoiceToggle}
                  className={`p-3 rounded-xl transition-colors ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Ovozli kiritish"
                >
                  {isRecording ? <Volume2 className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-gray-600">Kategoriya:</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Barchasi
                </button>
                <button
                  onClick={() => setSelectedCategory('legal')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === 'legal' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Huquqiy
                </button>
                <button
                  onClick={() => setSelectedCategory('case')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === 'case' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Keys
                </button>
                <button
                  onClick={() => setSelectedCategory('document')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === 'document' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Hujjat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glossary Tooltip Modal */}
      {showGlossary && selectedTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{selectedTerm.term}</h3>
              <button
                onClick={() => setShowGlossary(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-3">{selectedTerm.definition}</p>
            {selectedTerm.article && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Manba:</strong> {selectedTerm.article}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
