import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Input, Badge, Avatar, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'irac' | 'legal' | 'template';
}

interface ChatInterfaceProps {
  className?: string;
  initialMessages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className, 
  initialMessages = [] 
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'general' | 'irac' | 'legal'>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      let assistantContent = '';
      let messageType: Message['type'] = 'text';

      if (selectedModel === 'irac') {
        messageType = 'irac';
        assistantContent = `IRAC tahlili natijalari:

**Issue (Masala):** Shartnoma majburiyatlarining buzilishi holatida qonuniy mas'ulatni aniqlash

**Rule (Qoida):** O'zbekiston Respublikasi Fuqarolik kodeksining 330-moddasiga ko'ra, shartnoma tomonlari o'z majburiyatlarini bajarishi shart. Majburiyatning bajarilmasligi qonuniy javobgarlikka olib keladi.

**Application (Qo'llash):** Sizning holatingizda, A tomon B tomonga to'lanadigan summani vaqtida to'lamagan. Bu shartnomada belgilangan majburiyatning to'g'ridan-to'g'ri buzilishini tashkil etadi.

**Conclusion (Xulosa):** A tomon shartnoma shartlarini buzganligi uchun qonuniy javobgarlikka tortilishi va B tomonga yetkazilgan zarar uchun tovon puli to'lashi majburiy.`;
      } else if (selectedModel === 'legal') {
        messageType = 'legal';
        assistantContent = `Huquqiy maslahat:

Sizning savolizga ko'ra, quyidagi qonun hujjatlari qo'llaniladi:

1. **Fuqarolik kodeksi** - Shartnoma huquqi bo'yicha asosiy qonun hujjati
2. **Iqtisodiy sudlov to'g'risidagi kodeks** - To'lov majburiyatlari bo'yicha
3. **Bank to'g'risidagi qonun** - Bank operatsiyalari va majburiyatlari

Tavsiya: Shartnomada to'lov muddatlari aniq belgilanganligini tekshiring. Agar muddatlar belgilanmagan bo'lsa, Fuqarolik kodeksining umumiy qoidalari qo'llaniladi.

Qo'shimcha maslahat uchun advokat bilan maslahatlashingni tavsiya etaman.`;
      } else {
        assistantContent = `Sizning savolingizga javoban:

JurisAI platformasi O'zbekiston huquqiy tizimi bo'yicha zamonaviy ta'lim va tahlil vositalarini taklif etadi. Platformamiz orqali quyidagi xizmatlardan foydalanishingiz mumkin:

🔹 **IRAC tahlili** - Huquqiy ishlarni xalqaro standartlar bo'yicha tahlil qiling
🔹 **AI yordamchi** - Huquqiy masalalarda sun'iy intellekt yordamini oling  
🔹 **Qaror daraxti** - Murakkab huquqiy vaziyatlarni vizual tahlil qiling
🔹 **Shablonlar** - Huquqiy hujjatlar shablonlaridan foydalaning

Qo'shimcha savollaringiz bo'lsa, javob berishdan mamnun bo'laman!`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        type: messageType,
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Javob muvaffaqiyatli olindi');

    } catch (error) {
      toast.error('Javob olishda xatolik yuz berdi');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModelBadge = (model: string) => {
    switch (model) {
      case 'irac': return 'success';
      case 'legal': return 'warning';
      default: return 'default';
    }
  };

  const getModelName = (model: string) => {
    switch (model) {
      case 'irac': return 'IRAC Model';
      case 'legal': return 'Legal Model';
      default: return 'General Model';
    }
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Yordamchi</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={getModelBadge(selectedModel)}>
              {getModelName(selectedModel)}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2 mt-2">
          <Button
            variant={selectedModel === 'general' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedModel('general')}
          >
            Umumiy
          </Button>
          <Button
            variant={selectedModel === 'irac' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedModel('irac')}
          >
            IRAC
          </Button>
          <Button
            variant={selectedModel === 'legal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedModel('legal')}
          >
            Huquqiy
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">AI</span>
              </div>
              <p className="text-lg font-medium mb-2">Xush kelibsiz!</p>
              <p className="text-sm">Huquqiy savollaringizni yuboring</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start space-x-3',
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                )}
              >
                <Avatar
                  fallback={message.role === 'user' ? 'Siz' : 'AI'}
                  size="sm"
                  className={cn(
                    'flex-shrink-0',
                    message.role === 'user' ? 'bg-blue-500' : 'bg-emerald-500'
                  )}
                />
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {message.type === 'irac' && (
                    <Badge variant="success" className="mb-2 text-xs">
                      IRAC Tahlili
                    </Badge>
                  )}
                  {message.type === 'legal' && (
                    <Badge variant="warning" className="mb-2 text-xs">
                      Huquqiy Maslahat
                    </Badge>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-1 opacity-70',
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('uz-UZ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <Avatar
                fallback="AI"
                size="sm"
                className="bg-emerald-500 flex-shrink-0"
              />
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <LoadingSpinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Savolingizni kiriting..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Enter - yuborish | Shift+Enter - yangi qator</span>
            <span>{getModelName(selectedModel)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ChatInterface };
