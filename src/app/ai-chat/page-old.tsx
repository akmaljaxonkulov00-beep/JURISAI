'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Search, FileText, Mic, Send, BookOpen, Scale, HelpCircle, Volume2, Clock, Star, Lightbulb, Copy, Edit3, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { googleAIService, LegalAnalysisRequest } from '@/lib/google-ai';

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
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      type: 'user',
      timestamp: new Date(),
      category: selectedCategory === 'all' ? undefined : selectedCategory as any
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Generate AI response using Google Gemini
    await generateAIResponse(inputValue);
  };

  const generateAIResponse = async (userInput: string) => {
    try {
      // Create a streaming message for the AI response
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        text: '',
        type: 'assistant',
        timestamp: new Date(),
        category: 'general',
        relatedLaws: [],
        suggestions: []
      };

      setMessages(prev => [...prev, aiMessage]);

      // Determine the request type based on input
      let requestType: LegalAnalysisRequest['type'] = 'legal-consultation';
      if (userInput.toLowerCase().includes('shartnoma') || userInput.toLowerCase().includes('hujjat')) {
        requestType = 'document-analysis';
      } else if (userInput.toLowerCase().includes('case') || userInput.toLowerCase().includes('tahlil')) {
        requestType = 'irac-analysis';
      }

      // Build the legal prompt for Google Gemini
      const request: LegalAnalysisRequest = {
        type: requestType,
        query: userInput,
        context: 'You are a professional legal assistant for Uzbekistan law. Provide accurate, helpful legal information in Uzbek language. Always cite relevant laws and articles when applicable.',
        jurisdiction: 'uzbekistan',
        language: 'uz'
      };

      // Use streaming response for better UX
      let fullResponse = '';
      await googleAIService.generateStreamingResponse(
        request,
        (chunk: string) => {
          fullResponse += chunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: fullResponse }
                : msg
            )
          );
        }
      );

      // Extract related laws and suggestions from the response
      const relatedLaws = extractLawsFromResponse(fullResponse);
      const suggestions = extractSuggestionsFromResponse(fullResponse);
      const category = determineCategory(userInput, fullResponse);

      // Update the final message with extracted information
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, relatedLaws, suggestions, category }
            : msg
        )
      );

    } catch (error) {
      console.error('AI Response Error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Afsuski, javob berishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
        type: 'assistant',
        timestamp: new Date(),
        category: 'general',
        suggestions: ['Savolni qayta yozish', 'Boshqa savol berish', 'Admin bilan bog\'lanish']
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractLawsFromResponse = (text: string): string[] => {
    const lawPattern = /(?:FK|JK|MK|OK|YK|Konstitutsiya)\s*\d+-modda/gi;
    const matches = text.match(lawPattern);
    return matches || [];
  };

  const extractSuggestionsFromResponse = (text: string): string[] => {
    const suggestions: string[] = [];
    
    // Extract common suggestions based on content
    if (text.includes('shartnoma')) {
      suggestions.push('Shartnoma namunasini ko\'rish', 'Shartnoma tuzish bo\'yicha maslahat');
    }
    if (text.includes('da\'vo') || text.includes('sud')) {
      suggestions.push('Da\'vo arizasi namunasi', 'Sud jarayoni haqida ma\'lumot');
    }
    if (text.includes('modda') || text.includes('qonun')) {
      suggestions.push('Qonun hujjatlarini o\'rganish', 'Huquqiy maslahat olish');
    }
    
    return suggestions.length > 0 ? suggestions : ['Boshqa savol berish', 'Huquqiy maslahat olish'];
  };

  const determineCategory = (input: string, response: string): 'legal' | 'case' | 'document' | 'general' => {
    if (input.includes('shartnoma') || response.includes('shartnoma')) return 'document';
    if (input.includes('case') || input.includes('tahlil') || response.includes('IRAC')) return 'case';
    if (input.includes('modda') || input.includes('qonun') || response.includes('qonun')) return 'legal';
    return 'general';
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
                  disabled={isLoading || !inputValue.trim()}
                  className={`px-6 py-3 rounded-xl transition-colors flex items-center justify-center ${
                    isLoading || !inputValue.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
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
