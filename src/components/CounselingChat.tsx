import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Heart,
  Smile,
  Coffee,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import { ChatMessage, Persona, PersonaId } from '../types';
import {
  getChatSessionFromStorage,
  saveChatSessionToStorage,
  clearChatSessionInStorage,
} from '../services/storageService';

interface CounselingChatProps {
  user: User | null;
  onOpenGoogleChat: (message: string, title: string) => void;
  onSaveQuote: (title: string, quote: string) => void;
}

const PERSONAS: Persona[] = [
  {
    id: 'ruda',
    name: '루다 (다정한 랜선 베프)',
    tagline: '일상 수다와 포근한 감정 공감',
    avatar: '🧸',
    badge: '친근한 친구',
    color: 'from-amber-400 to-rose-400',
    accentBg: 'bg-amber-50 text-amber-800 border-amber-200',
    description: '오늘 하루 어땠어? 사소한 이야기부터 속마음까지 다 털어놔도 돼.',
  },
  {
    id: 'sori',
    name: '소리 (온화한 심리 상담가)',
    tagline: '깊은 감정 치유와 자존감 회복',
    avatar: '🌸',
    badge: '마음 닥터',
    color: 'from-rose-400 to-pink-500',
    accentBg: 'bg-rose-50 text-rose-800 border-rose-200',
    description: '혼자 있는 시간은 부족한 게 아니에요. 스스로를 채워가는 소중한 여정이죠.',
  },
  {
    id: 'hajin',
    name: '하진 (솔직 라이프 멘토)',
    tagline: '솔로 갓생 라이프 & 현실 연애 코칭',
    avatar: '⚡️',
    badge: '현실 조언자',
    color: 'from-indigo-500 to-sky-500',
    accentBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    description: '혼자서도 멋지게 빛나는 법, 그리고 다음 사랑을 준비하는 현실적인 팁을 알려줄게요.',
  },
];

const QUICK_PROMPTS = [
  '퇴근길인데 문득 혼자라는 생각에 쓸쓸해 🌙',
  '다들 연애하는데 나만 뒤처진 걸까? 💭',
  '이번 주말, 혼자서도 진짜 행복하게 보내는 법 알려줘 ✨',
  '호감 가는 사람이 생겼는데 어떻게 먼저 다가갈까? 💌',
];

const MOOD_OPTIONS = ['외로움', '지침/피곤', '설렘/기대', '차분함', '심심함', '불안/고민'];

export const CounselingChat: React.FC<CounselingChatProps> = ({
  user,
  onOpenGoogleChat,
  onSaveQuote,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('ruda');
  const [currentMood, setCurrentMood] = useState<string>('외로움');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emotionalTemperature, setEmotionalTemperature] = useState<number>(65);
  const [detectedEmotion, setDetectedEmotion] = useState<string>('따뜻한 시작');
  const [latestComfortQuote, setLatestComfortQuote] = useState<string>(
    '혼자 보내는 시간은 외로움의 방이 아니라, 나를 더 깊이 알아가는 정원이에요.'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `반가워요! 저는 솔로분들의 따뜻한 말동무가 되어주는 솔로메이트입니다. 
오늘 어떤 하루를 보내셨나요? 혼자 삭히기 힘든 외로움이나 작은 고민이 있다면 편하게 털어놓아 보세요. 마음을 다해 들어드릴게요.`,
      timestamp: '방금 전',
      comfortQuote: '혼자 보내는 시간은 외로움의 방이 아니라, 나를 더 깊이 알아가는 정원이에요.',
      emotionalTemperature: 65,
      detectedEmotion: '다정한 환영',
      followUpQuestions: [
        '오늘 기분은 어떠신가요?',
        '요즘 혼자 있을 때 가장 많이 하는 생각은 무엇인가요?',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePersonaObj = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];

  // Load chat session from browser localStorage
  useEffect(() => {
    const session = getChatSessionFromStorage(user, selectedPersona);
    if (session && session.messages && session.messages.length > 0) {
      setMessages(session.messages);
      if (session.emotionalTemperature !== undefined) {
        setEmotionalTemperature(session.emotionalTemperature);
      }
      if (session.detectedEmotion) {
        setDetectedEmotion(session.detectedEmotion);
      }
    } else {
      setMessages([
        {
          id: 'welcome-' + selectedPersona,
          role: 'model',
          text: `안녕하세요! ${activePersonaObj.name}입니다.\n${activePersonaObj.description}`,
          timestamp: '방금 전',
          emotionalTemperature: 65,
          detectedEmotion: '환영 대화',
          comfortQuote: '오늘 하루도 당신은 그 자체로 충분히 아름답습니다.',
          followUpQuestions: [
            '오늘 있었던 일 중 가장 기억에 남는 순간은 무엇인가요?',
            '지금 마음 상태를 자유롭게 이야기해주세요.',
          ],
        },
      ]);
    }
  }, [selectedPersona, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Calls Vercel Serverless API /api/chat/counsel
      const response = await fetch('/api/chat/counsel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          persona: selectedPersona,
          userMood: currentMood,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `상담 응답 생성 실패 (${response.status})`);
      }

      const data = await response.json();
      const modelMsg: ChatMessage = {
        id: 'model-' + Date.now(),
        role: 'model',
        text: data.reply || '답변을 생성하지 못했습니다.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotionalTemperature: data.emotionalTemperature ?? 60,
        detectedEmotion: data.detectedEmotion ?? '공감과 경청',
        comfortQuote: data.comfortQuote,
        followUpQuestions: data.followUpQuestions,
      };

      const updatedHistory = [...newHistory, modelMsg];
      setMessages(updatedHistory);

      const newTemp = data.emotionalTemperature ?? emotionalTemperature;
      const newEmotion = data.detectedEmotion ?? detectedEmotion;

      if (data.emotionalTemperature !== undefined) {
        setEmotionalTemperature(newTemp);
      }
      if (data.detectedEmotion) {
        setDetectedEmotion(newEmotion);
      }
      if (data.comfortQuote) {
        setLatestComfortQuote(data.comfortQuote);
      }

      // Save to browser localStorage
      saveChatSessionToStorage(user, selectedPersona, updatedHistory, newTemp, newEmotion);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'model',
        text: '죄송해요, 잠시 생각의 연결이 끊어졌어요. 다시 한번 말씀해주시겠어요?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('사용하시는 브라우저에서는 음성 읽기(TTS) 기능을 지원하지 않습니다.');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if (window.confirm('이 페르소나와의 대화 기록을 초기화하시겠습니까?')) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      clearChatSessionInStorage(user, selectedPersona);

      const resetMsg: ChatMessage = {
        id: 'welcome-msg-' + Date.now(),
        role: 'model',
        text: `안녕하세요! ${activePersonaObj.name}입니다. 새로운 마음으로 어떤 이야기든 들려주세요.`,
        timestamp: '방금 전',
        emotionalTemperature: 60,
        detectedEmotion: '새로운 시작',
        comfortQuote: '가장 좋은 이야기는 아직 쓰여지지 않은 오늘부터 시작됩니다.',
      };

      setMessages([resetMsg]);
      setEmotionalTemperature(60);
      setDetectedEmotion('새로운 시작');
      saveChatSessionToStorage(user, selectedPersona, [resetMsg], 60, '새로운 시작');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar: Persona & Emotion Dashboard */}
      <div className="lg:col-span-4 space-y-5">
        {/* Persona Selector Card */}
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>상담 페르소나 선택</span>
            </h2>
            <button
              onClick={handleResetChat}
              title="대화 초기화"
              className="text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {PERSONAS.map((p) => {
              const isSelected = p.id === selectedPersona;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-rose-400 bg-rose-50/70 shadow-xs ring-1 ring-rose-300'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-2xl p-1 bg-white rounded-lg shadow-2xs shrink-0">
                    {p.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-neutral-900 truncate">
                        {p.name.split(' (')[0]}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 font-semibold text-neutral-600 shrink-0">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{p.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emotional Temperature & Mood State Card */}
        <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 rounded-2xl p-5 border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>현재 감정 온도계</span>
            </span>
            <span className="text-base font-extrabold text-rose-600">
              {emotionalTemperature}°C
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden p-0.5 border border-rose-200 mb-3 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-pink-400 to-rose-500 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(10, emotionalTemperature))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 mb-4">
            <span>❄️ 쓸쓸함 (20°C)</span>
            <span>🌿 평온 (50°C)</span>
            <span>🔥 따스함 (80°C)</span>
          </div>

          {/* Detected Emotion Tag */}
          <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3 border border-rose-200/60 mb-4">
            <span className="text-[10px] font-semibold text-rose-500 block mb-1 uppercase tracking-wider">
              감지된 마음 상태
            </span>
            <p className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <span>💬</span>
              <span>{detectedEmotion}</span>
            </p>
          </div>

          {/* Today's Comfort Quote Card */}
          <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <span>💌</span>
                <span>오늘의 토닥토닥 카드</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSaveQuote('토닥토닥 위로글', latestComfortQuote)}
                  title="보관함에 저장"
                  className="p-1 rounded-md text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onOpenGoogleChat(
                      `[SoloMate 오늘의 토닥토닥 카드]\n\n"${latestComfortQuote}"\n\n- 솔로메이트 감성 상담소에서`,
                      '토닥토닥 위로글'
                    )
                  }
                  title="Google Chat으로 전송"
                  className="p-1 rounded-md text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs font-medium text-neutral-700 leading-relaxed italic">
              "{latestComfortQuote}"
            </p>
          </div>
        </div>

        {/* Current Mood Chip selector */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs">
          <label className="block text-xs font-bold text-neutral-700 mb-2">
            오늘 나의 솔직한 기분 태그
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood}
                onClick={() => setCurrentMood(mood)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  currentMood === mood
                    ? 'bg-rose-500 text-white font-semibold shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Chat Stream */}
      <div className="lg:col-span-8 flex flex-col h-[700px] bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1 bg-white rounded-xl shadow-2xs">
              {activePersonaObj.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-900">{activePersonaObj.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  온라인 대화 중
                </span>
              </div>
              <p className="text-xs text-neutral-500">{activePersonaObj.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg">
              <HardDrive className="w-3 h-3 text-neutral-500" />
              <span>기록 자동 보관</span>
            </div>
            <Coffee className="w-3.5 h-3.5 text-amber-500 hidden sm:block" />
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-neutral-50/40 via-white to-rose-50/20">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isModel ? 'justify-start' : 'justify-end'} animate-in fade-in`}
              >
                {isModel && (
                  <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-base shadow-2xs shrink-0 mt-0.5">
                    {activePersonaObj.avatar}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  {/* Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                      isModel
                        ? 'bg-white text-neutral-800 border border-neutral-200/90 rounded-tl-xs'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-tr-xs font-medium'
                    }`}
                  >
                    {msg.text}

                    {/* Comfort Quote Box inside message if present */}
                    {isModel && msg.comfortQuote && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-100 bg-amber-50/60 -mx-1 px-3 py-2 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <Smile className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="italic font-medium">"{msg.comfortQuote}"</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Timestamp row */}
                  <div
                    className={`flex items-center gap-2 text-[10px] text-neutral-400 px-1 ${
                      isModel ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {isModel && (
                      <>
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          title="목소리로 듣기 (TTS)"
                          className={`p-1 rounded-md transition ${
                            speakingId === msg.id
                              ? 'text-rose-600 bg-rose-50'
                              : 'hover:text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="답변 복사"
                          className="p-1 rounded-md hover:text-neutral-700 hover:bg-neutral-100 transition"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            onOpenGoogleChat(
                              `[SoloMate ${activePersonaObj.name}의 감성 상담]\n\n${msg.text}\n\n${
                                msg.comfortQuote ? `* "${msg.comfortQuote}"` : ''
                              }`,
                              '감성 상담 대화'
                            )
                          }
                          title="Google Chat 스페이스로 공유하기"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-emerald-50 text-neutral-400 hover:text-emerald-700 transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Google Chat</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Follow-up question chips */}
                  {isModel && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.followUpQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] px-2.5 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-full transition shadow-2xs text-left"
                        >
                          💡 {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-base shadow-2xs shrink-0">
                {activePersonaObj.avatar}
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2 text-xs text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-medium">{activePersonaObj.name}가 마음을 담아 생각하고 있어요...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick starter prompt chips */}
        <div className="px-4 py-2 bg-neutral-50/80 border-t border-neutral-100 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <span className="text-[11px] font-bold text-neutral-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> 추천 질문:
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 text-neutral-600 border border-neutral-200 rounded-full shrink-0 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-neutral-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`${activePersonaObj.name.split(' ')[0]}에게 털어놓고 싶은 이야기를 적어보세요...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>전송</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
