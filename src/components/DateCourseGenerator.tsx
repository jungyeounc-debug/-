import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Compass,
  MapPin,
  Clock,
  Coins,
  Sparkles,
  Share2,
  Bookmark,
  ExternalLink,
  Check,
  RefreshCw,
  User as UserIcon,
  Users,
  Lightbulb,
  History,
} from 'lucide-react';
import { DateCourse } from '../types';
import {
  getCourseHistoryFromStorage,
  saveCourseToHistoryInStorage,
} from '../services/storageService';

interface DateCourseGeneratorProps {
  user: User | null;
  onSaveCourse: (course: DateCourse) => void;
  onOpenGoogleChat: (messageText: string, title: string) => void;
  isSaved?: (courseId: string) => boolean;
}

const POPULAR_REGIONS = [
  '서울 성수/서울숲',
  '서울 홍대/연남동',
  '서울 종로/익선동/삼청동',
  '서울 강남/신사 가로수길',
  '서울 용산/한남동',
  '서울 여의도/한강공원',
  '부산 해운대/광안리',
  '대구 동성로/교동',
  '제주 애월/한림',
];

const VIBE_OPTIONS = [
  { id: 'healing', label: '🌿 힐링 & 고요한 휴식', desc: '조용하고 아늑한 골목과 쉼' },
  { id: 'trendy', label: '🔥 트렌디 SNS 핫플레이스', desc: '요즘 가장 핫한 감성 스팟' },
  { id: 'gourmet', label: '🍷 미식 & 맛집 탐방', desc: '맛있는 음식과 특별한 디저트' },
  { id: 'activity', label: '🎨 원데이클래스 & 체험', desc: '직접 만들고 즐기는 이색 경험' },
  { id: 'nightview', label: '✨ 야경 & 감성 펍/바', desc: '낭만적인 밤 산책과 가벼운 한잔' },
  { id: 'budget', label: '💡 알짜 가성비 코스', desc: '부담 없는 예산으로 알차게' },
];

export const DateCourseGenerator: React.FC<DateCourseGeneratorProps> = ({
  user,
  onSaveCourse,
  onOpenGoogleChat,
  isSaved,
}) => {
  const [mode, setMode] = useState<'solo' | 'romance'>('solo');
  const [selectedRegion, setSelectedRegion] = useState<string>('서울 성수/서울숲');
  const [customRegion, setCustomRegion] = useState<string>('');
  const [vibe, setVibe] = useState<string>('healing');
  const [timeOfDay, setTimeOfDay] = useState<string>('afternoon');
  const [budget, setBudget] = useState<string>('medium');
  const [customNote, setCustomNote] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [course, setCourse] = useState<DateCourse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Course History stored in localStorage
  const [historyList, setHistoryList] = useState<DateCourse[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const regionToUse = customRegion.trim() ? customRegion.trim() : selectedRegion;

  // Load course history from browser localStorage
  useEffect(() => {
    const list = getCourseHistoryFromStorage(user);
    setHistoryList(list);
  }, [user]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Calls Vercel Serverless Function /api/date-course/recommend
      const response = await fetch('/api/date-course/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          region: regionToUse,
          vibe,
          timeOfDay,
          budget,
          customNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `데이트 코스 추천 생성 실패 (${response.status})`);
      }

      const data = await response.json();
      const generatedCourse: DateCourse = {
        ...data,
        id: 'course-' + Date.now(),
        createdAt: new Date().toLocaleDateString(),
      };
      setCourse(generatedCourse);

      // Save to localStorage history
      const updatedList = saveCourseToHistoryInStorage(user, generatedCourse);
      setHistoryList(updatedList);
    } catch (err: unknown) {
      console.error('Course recommendation error:', err);
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCourseForShare = (c: DateCourse): string => {
    const modeLabel = c.mode === 'solo' ? '나 혼자 즐기는 솔로 힐링 투어' : '설레는 로맨틱 데이트 코스';
    let text = `[SoloMate 데이트 코스 추천]\n`;
    text += `💖 ${c.title}\n`;
    text += `📍 지역: ${c.region} | ⏱️ 소요시간: ${c.totalDuration} | 💰 예상비용: ${c.totalEstimatedCost}\n`;
    text += `✨ 테마: ${modeLabel}\n\n`;
    text += `📖 코스 요약:\n${c.summary}\n\n`;
    text += `🗺️ 상세 일정:\n`;

    c.stops?.forEach((s) => {
      text += `[${s.step}단계] ${s.name} (${s.category})\n`;
      text += `- 시간: ${s.time} | 예상비용: ${s.estimatedCost}\n`;
      text += `- 추천: ${s.recommendedItem}\n`;
      text += `- 설명: ${s.description}\n`;
      text += `- 팁: ${s.soloOrCoupleTip}\n\n`;
    });

    if (c.tips) {
      text += `💡 꿀팁: ${c.tips}\n`;
    }

    return text.trim();
  };

  const handleCopyCourse = () => {
    if (!course) return;
    navigator.clipboard.writeText(formatCourseForShare(course));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToGoogleChat = () => {
    if (!course) return;
    const shareText = formatCourseForShare(course);
    onOpenGoogleChat(shareText, course.title);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Title & History toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>실시간 맞춤 코스 큐레이션</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            오늘 당신을 위한 완벽한 하루 코스
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            혼자 오롯이 즐기는 힐링 솔로 투어부터 설레는 로맨틱 데이트까지, 지역과 취향에 맞게 추천해 드립니다.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 shadow-2xs transition"
          >
            <History className="w-4 h-4 text-rose-500" />
            <span>이전 코스 이력 ({historyList.length})</span>
          </button>
        )}
      </div>

      {/* History Drawer if toggled */}
      {showHistory && historyList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-rose-200 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-rose-600" />
              <span>최근 추천받은 데이트 코스</span>
            </h3>
            <span className="text-[11px] text-neutral-400">클릭하여 화면에 다시 로드</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
            {historyList.map((h, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCourse(h);
                  setShowHistory(false);
                }}
                className="text-left p-3 rounded-xl border border-neutral-200 hover:border-rose-400 hover:bg-rose-50/50 transition group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold">
                    {h.region}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {h.totalDuration}
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-800 truncate group-hover:text-rose-600">
                  {h.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter / Generator Config Card */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-sm space-y-6">
        {/* 1. Mode Selector: Solo vs Romance */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-2">
            1. 누구와 함께하는 코스인가요?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setMode('solo')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                mode === 'solo'
                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400/40 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  mode === 'solo' ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900">나 혼자 즐기는 솔로 힐링</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-semibold">
                    갓생 & 휴식
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  혼밥 눈치 안 보이는 맛집, 조용한 북카페, 독립 서점, 감성 전시와 힐링 산책로
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('romance')}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                mode === 'romance'
                  ? 'border-pink-500 bg-pink-50/60 ring-2 ring-pink-400/40 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  mode === 'romance' ? 'bg-pink-500 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900">설레는 썸 & 로맨스 코스</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-200 text-pink-800 font-semibold">
                    소개팅 & 연인
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  분위기 있는 감성 다이닝, 어색함 없는 카페, 로맨틱한 야경과 대화하기 좋은 스팟
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Region Selection */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-2">
            2. 방문하고 싶은 지역을 선택하거나 입력하세요
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {POPULAR_REGIONS.map((reg) => (
              <button
                key={reg}
                onClick={() => {
                  setSelectedRegion(reg);
                  setCustomRegion('');
                }}
                className={`text-xs px-3 py-1.5 rounded-xl border transition ${
                  selectedRegion === reg && !customRegion
                    ? 'border-rose-500 bg-rose-500 text-white font-semibold shadow-xs'
                    : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 bg-white'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="원하는 다른 지역 직접 입력 (예: 수원 행궁동, 강릉 안목해변, 대전 소제동)"
              value={customRegion}
              onChange={(e) => setCustomRegion(e.target.value)}
              className="text-xs px-3.5 py-2 border border-neutral-200 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        {/* 3. Vibe, Time, Budget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vibe */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              분위기 / 테마
            </label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
            >
              {VIBE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              시간대 / 일정 분량
            </label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
            >
              <option value="afternoon">☀️ 오후 반나절 (약 3~4시간)</option>
              <option value="evening">🌙 저녁 & 야경 (약 3~4시간)</option>
              <option value="allday">✨ 올데이 풀코스 (약 6~7시간)</option>
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              예상 예산 수준
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none"
            >
              <option value="low">💡 알뜰 가성비 (3만원 이하)</option>
              <option value="medium">☕️ 보통 (3만~7만원 대)</option>
              <option value="high">✨ 여유롭게 (8만원 이상)</option>
            </select>
          </div>
        </div>

        {/* Custom Note input */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            추가로 반영하고 싶은 사항 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 조용히 책 읽기 좋은 곳, 비 오는 날 실내 코스, 디저트가 맛있는 곳, 어색함을 풀 수 있는 액티비티"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI가 최적의 코스를 실시간 탐색 중입니다...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{regionToUse} 맞춤 실시간 코스 추천받기</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Generated Course Display Section */}
      {course && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Course Hero Banner */}
          <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="relative z-10 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-semibold">
                  {course.mode === 'solo' ? '🛋️ 솔로 힐링 투어' : '💖 로맨틱 데이트'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs font-semibold">
                  📍 {course.region}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {course.title}
              </h2>
              <p className="text-xs sm:text-sm text-rose-100 font-medium">
                {course.subtitle}
              </p>

              {/* Meta stats */}
              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-white/90">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-200" />
                  <span>소요시간: {course.totalDuration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-200" />
                  <span>예상비용: {course.totalEstimatedCost}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary & Story */}
          <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 space-y-2">
            <h3 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>코스 스토리 & 매력 포인트</span>
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {course.summary}
            </p>
          </div>

          {/* Step-by-Step Stops Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>상세 방문 일정 ({course.stops?.length || 0}개 스팟)</span>
            </h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 sm:before:left-5 before:w-0.5 before:bg-rose-200">
              {course.stops?.map((stop, index) => (
                <div key={index} className="relative flex items-start gap-3 sm:gap-4 pl-1 sm:pl-2">
                  {/* Step Bubble */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-4 ring-white shadow-xs z-10">
                    {stop.step || index + 1}
                  </div>

                  {/* Stop Card */}
                  <div className="flex-1 bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-2xs hover:border-rose-300 transition space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-neutral-900">
                          {stop.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-semibold">
                          {stop.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          {stop.time}
                        </span>
                        <span>•</span>
                        <span className="text-rose-600 font-bold">{stop.estimatedCost}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {stop.description}
                    </p>

                    {/* Recommended item/menu */}
                    <div className="bg-rose-50/60 rounded-xl p-2.5 text-xs text-rose-900 flex items-center gap-2">
                      <span className="font-bold text-rose-700 shrink-0">✨ 추천 메뉴/체험:</span>
                      <span>{stop.recommendedItem}</span>
                    </div>

                    {/* Tip & Map link */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{stop.soloOrCoupleTip}</span>
                      </div>

                      {/* Map buttons */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(
                            stop.searchKeyword || `${course.region} ${stop.name}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-[11px] transition"
                        >
                          <span>네이버 지도</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://map.kakao.com/?q=${encodeURIComponent(
                            stop.searchKeyword || `${course.region} ${stop.name}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium text-[11px] transition"
                        >
                          <span>카카오맵</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Tips */}
          {course.tips && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">큐레이터의 실전 꿀팁</span>
                <p className="leading-relaxed text-amber-800">{course.tips}</p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveCourse(course)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  isSaved && isSaved(course.id)
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    isSaved && isSaved(course.id) ? 'fill-rose-600 text-rose-600' : ''
                  }`}
                />
                <span>{isSaved && isSaved(course.id) ? '보관함 저장됨' : '보관함 저장'}</span>
              </button>

              <button
                onClick={handleCopyCourse}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? '복사 완료!' : '텍스트 복사'}</span>
              </button>
            </div>

            {/* Share to Google Chat Button */}
            <button
              onClick={handleShareToGoogleChat}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-200 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Google Chat 스페이스로 공유하기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
