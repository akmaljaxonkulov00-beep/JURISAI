'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Search, FileText, Mic, Send, BookOpen, Scale, HelpCircle, Volume2, Clock, Star, Lightbulb, Copy, Edit3, Loader2, Trash2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/auth-real';
import { chatService, ChatConversation, ChatMessage } from '@/services/chat-service';
import { googleAIService, LegalAnalysisRequest } from '@/lib/google-ai';

interface LegalTerm {
  term: string;
  definition: string;
  article?: string;
}

export default function AIChat() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'chat' | 'case' | 'document'>('chat');
  const [showGlossary, setShowGlossary] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<LegalTerm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
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

  // Load conversations on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  }, [isAuthenticated, user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const loadConversations = async () => {
    if (!user) return;
    
    const userConversations = await chatService.getConversations(user.id);
    setConversations(userConversations);
    
    if (userConversations.length > 0 && !activeConversationId) {
      setActiveConversationId(userConversations[0].id);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const conversationMessages = await chatService.getMessages(conversationId);
    setMessages(conversationMessages);
  };

  const createNewConversation = async () => {
    if (!user || !newConversationTitle.trim()) return;

    const conversation = await chatService.createConversation(user.id, newConversationTitle);
    if (conversation) {
      setConversations(prev => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      setNewConversationTitle('');
      setShowNewConversation(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    await chatService.deleteConversation(conversationId);
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    // Create new conversation if none exists
    let conversationId = activeConversationId;
    if (!conversationId) {
      const conversation = await chatService.createConversation(user.id, 'New Conversation');
      if (conversation) {
        conversationId = conversation.id;
        setActiveConversationId(conversationId);
        setConversations(prev => [conversation, ...prev]);
      }
    }

    if (!conversationId) return;

    // Add user message
    const userMessage = await chatService.addMessage(
      conversationId,
      user.id,
      inputValue,
      'user'
    );

    if (userMessage) {
      setMessages(prev => [...prev, userMessage]);
    }

    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Determine request type based on input
      let requestType: LegalAnalysisRequest['type'] = 'legal-consultation';
      if (userInput.toLowerCase().includes('shartnoma') || userInput.toLowerCase().includes('hujjat')) {
        requestType = 'document-analysis';
      } else if (userInput.toLowerCase().includes('case') || userInput.toLowerCase().includes('tahlil')) {
        requestType = 'irac-analysis';
      }

      // Build legal prompt for Groq AI
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
          setStreamingText(fullResponse);
        }
      );

      // Extract related laws and suggestions from response
      const relatedLaws = extractLawsFromResponse(fullResponse);
      const suggestions = extractSuggestionsFromResponse(fullResponse);
      const category = determineCategory(userInput, fullResponse);

      // Add assistant message
      const assistantMessage = await chatService.addMessage(
        conversationId,
        user.id,
        fullResponse,
        'assistant',
        category,
        relatedLaws,
        suggestions
      );

      if (assistantMessage) {
        setMessages(prev => [...prev, assistantMessage]);
      }

      setStreamingText('');
    } catch (error) {
      console.error('AI Response Error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        conversation_id: conversationId,
        user_id: user.id,
        content: 'Afsuski, javob berishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
        type: 'assistant',
        timestamp: new Date().toISOString(),
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access AI Chat</p>
          <button
            onClick={() => router.push('/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
                onClick={() => setShowNewConversation(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
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
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          {/* New Conversation */}
          {showNewConversation && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <input
                type="text"
                placeholder="Conversation title..."
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createNewConversation();
                  }
                }}
                className="w-full p-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={createNewConversation}
                  className="flex-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <h3 className="font-semibold text-gray-900 mb-4">Conversations</h3>
          <div className="space-y-2 mb-6">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeConversationId === conversation.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{conversation.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(conversation.created_at).toLocaleDateString()} • {conversation.message_count} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          {showSuggestions && (
            <>
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

              {/* Document Templates */}
              <h3 className="font-semibold text-gray-900 mb-4">Hujjat namunalari</h3>
              <div className="space-y-2 mb-6">
                {documentTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleDocumentTemplate(template.id)}
                    className="w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.description}</div>
                  </button>
                ))}
              </div>

              {/* Legal Terms */}
              <h3 className="font-semibold text-gray-900 mb-4">Huquqiy atamlar</h3>
              <div className="space-y-2">
                {legalTerms.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleTermClick(term)}
                    className="w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="font-medium">{term.term}</div>
                    <div className="text-sm text-gray-500">{term.article}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !activeConversationId ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Yordamchiga xush kelibsiz!</h3>
                <p className="text-gray-600 mb-6">Huquqiy savollaringizni bering, professional maslahat oling</p>
                
                {showSuggestions && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        className="p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                      >
                        <div className={`p-3 rounded-lg bg-${action.color}-100 text-${action.color}-600 mb-3 mx-auto w-fit`}>
                          {action.icon}
                        </div>
                        <div className="font-medium">{action.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {message.type === 'assistant' && (
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Related Laws */}
                        {message.related_laws && message.related_laws.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Tegishli qonunlar:</h4>
                            <div className="space-y-1">
                              {message.related_laws.map((law, index) => (
                                <div key={index} className="text-sm text-blue-700">
                                  📜 {law}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Tavsiyalar:</h4>
                            <div className="space-y-1">
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => setInputValue(suggestion)}
                                  className="text-sm text-green-700 hover:text-green-900 text-left"
                                >
                                  💡 {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Category Badge */}
                        {message.category && (
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(message.category)}`}>
                              {message.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Streaming indicator */}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[70%] rounded-lg p-4 bg-white border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{streamingText}</p>
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Huquqiy savolingizni yozing..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleVoiceToggle}
                className={`p-3 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Term Modal */}
      {showGlossary && selectedTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTerm.term}</h3>
              <button
                onClick={() => setShowGlossary(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">{selectedTerm.definition}</p>
              {selectedTerm.article && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Manba: {selectedTerm.article}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
