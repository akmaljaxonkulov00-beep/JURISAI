'use client';

import { useState, useEffect } from 'react';
import { tts, stt, isSpeechSupported, testSpeech } from '@/lib/speech';
import { ArrowLeft } from 'lucide-react';

export default function VoiceTestPage() {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textToSpeak, setTextToSpeak] = useState('Assalomu alaykum! Men ovozli xabar yuborish tizimiman. Bu test matn.');
  const [recognizedText, setRecognizedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Check speech support
    const supported = isSpeechSupported();
    setSpeechSupported(supported);
    addLog(`Speech Support: ${supported ? '[OK] YES' : '[X] NO'}`);

    // Run speech test
    testSpeech();

    // Load voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        addLog(`Loaded ${availableVoices.length} voices`);
        
        // Select Russian voice by default
        const russianVoice = availableVoices.find(v => v.lang.includes('ru'));
        if (russianVoice) {
          setSelectedVoice(russianVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const handleSpeak = () => {
    if (!textToSpeak.trim()) {
      alert('Iltimos, matn kiriting');
      return;
    }

    addLog('♪ Speaking: ' + textToSpeak.substring(0, 50) + '...');
    setIsSpeaking(true);

    tts.speak(textToSpeak, {
      lang: 'ru-RU',
      rate,
      pitch,
      volume,
      onStart: () => {
        addLog('[OK] Speech started');
        setIsSpeaking(true);
      },
      onEnd: () => {
        addLog('[OK] Speech ended');
        setIsSpeaking(false);
      },
      onError: (error) => {
        addLog('[X] Speech error: ' + error);
        setIsSpeaking(false);
      }
    });
  };

  const handleStop = () => {
    addLog('■ Stopping speech');
    tts.stop();
    setIsSpeaking(false);
  };

  const handleListen = () => {
    addLog('🎤 Starting to listen...');
    setIsListening(true);
    setRecognizedText('');
    setInterimText('');

    let fullTranscript = '';

    stt.startListening({
      continuous: true,
      onStart: () => {
        addLog('[OK] Listening started');
        setIsListening(true);
      },
      onResult: (text, isFinal) => {
        addLog(`NOTE ${isFinal ? 'Final' : 'Interim'}: ${text}`);
        
        if (isFinal) {
          fullTranscript += text + ' ';
          setRecognizedText(fullTranscript);
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onError: (error) => {
        addLog('[X] Listening error: ' + error);
        setIsListening(false);
      },
      onEnd: () => {
        addLog('● Listening ended');
        setIsListening(false);
      }
    });
  };

  const handleStopListening = () => {
    addLog('■ Stopping listening');
    stt.stopListening();
    setIsListening(false);
  };

  const testPresetPhrases = [
    'Assalomu alaykum! Qalaysiz?',
    'Men huquqiy yordam tizimiman',
    'Sud majlisi boshlandi',
    'Mening mijozim aybsiz',
    'Dalillar etarli emas',
    'E\'tiroz bildiraman',
    'Guvoh ko\'rsatmalari ishonchsiz',
    'Shartnoma shartlari buzilgan',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎤 Voice Features Test</h1>
              <p className="text-sm text-gray-600">Ovozli funksiyalarni test qilish sahifasi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">▤ System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Speech Support</div>
              <div className="text-2xl font-bold text-blue-600">
                {speechSupported ? '[OK] YES' : '[X] NO'}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Voices Available</div>
              <div className="text-2xl font-bold text-green-600">{voices.length}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Speaking</div>
              <div className="text-2xl font-bold text-purple-600">
                {isSpeaking ? '♪ YES' : '♫ NO'}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Listening</div>
              <div className="text-2xl font-bold text-orange-600">
                {isListening ? '🎤 YES' : '● NO'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Text-to-Speech Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">♪ Text-to-Speech (TTS)</h2>
            
            <div className="space-y-4">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gapiriladigan matn:
                </label>
                <textarea
                  value={textToSpeak}
                  onChange={(e) => setTextToSpeak(e.target.value)}
                  className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bu yerga matn yozing..."
                />
              </div>

              {/* Preset Phrases */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tayyor iboralar:
                </label>
                <div className="flex flex-wrap gap-2">
                  {testPresetPhrases.map((phrase, index) => (
                    <button
                      key={index}
                      onClick={() => setTextToSpeak(phrase)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      {phrase.substring(0, 20)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tezlik: {rate}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ohang: {pitch}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ovoz: {volume}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSpeak}
                  disabled={isSpeaking}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    isSpeaking
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSpeaking ? '♪ Gapirmoqda...' : '♪ Gapirish'}
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isSpeaking}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    !isSpeaking
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  ■ To'xtatish
                </button>
              </div>
            </div>
          </div>

          {/* Speech-to-Text Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎤 Speech-to-Text (STT)</h2>
            
            <div className="space-y-4">
              {/* Recognition Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanilgan matn:
                </label>
                <div className="h-32 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
                  {recognizedText || interimText || (
                    <span className="text-gray-400">Bu yerda tanilgan matn ko'rinadi...</span>
                  )}
                  {interimText && (
                    <span className="text-blue-500 italic"> {interimText}</span>
                  )}
                </div>
              </div>

              {/* Status */}
              {isListening && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                    <span className="text-red-700 font-medium">
                      🎤 Tinglanmoqda... Iltimos, gapiring
                    </span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">NOTE Ko'rsatmalar:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mikrofon tugmasini bosing</li>
                  <li>• Browser ruxsat so'rasa, "Allow" bering</li>
                  <li>• Aniq va sekin gapiring</li>
                  <li>• Rus tilida gapirish yaxshiroq taniladi</li>
                  <li>• To'xtatish uchun "Stop" bosing</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleListen}
                  disabled={isListening}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isListening ? '● Tinglanmoqda...' : '🎤 Tinglashni boshlash'}
                </button>
                <button
                  onClick={handleStopListening}
                  disabled={!isListening}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    !isListening
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  ■ To'xtatish
                </button>
              </div>

              {/* Clear Button */}
              <button
                onClick={() => {
                  setRecognizedText('');
                  setInterimText('');
                }}
                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ⊗ Tozalash
              </button>
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">▣ Event Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Logs
            </button>
          </div>
          <div className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Voices Info */}
        {voices.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">♪ Available Voices ({voices.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {voices.map((voice, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{voice.name}</div>
                  <div className="text-sm text-gray-600">{voice.lang}</div>
                  <div className="text-xs text-gray-400">
                    {voice.localService ? 'Local' : 'Remote'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
