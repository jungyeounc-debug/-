import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  MessageCircle,
  Users,
  RefreshCw,
  Send,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { ChatSpace, ChatMessage, listChatSpaces, listRecentMessages } from '../services/googleChat';

interface GoogleChatHubProps {
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  onOpenConfirmModal: (text: string, title: string) => void;
}

export const GoogleChatHub: React.FC<GoogleChatHubProps> = ({
  user,
  accessToken,
  onLogin,
  onOpenConfirmModal,
}) => {
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [customDraft, setCustomDraft] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchSpaces();
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && selectedSpace) {
      fetchMessages(selectedSpace);
    }
  }, [selectedSpace, accessToken]);

  const fetchSpaces = async () => {
    if (!accessToken) return;
    setIsLoadingSpaces(true);
    setErrorMsg(null);
    try {
      const data = await listChatSpaces(accessToken);
      setSpaces(data);
      if (data.length > 0 && !selectedSpace) {
        setSelectedSpace(data[0].name);
      }
    } catch (err: unknown) {
      console.error('Fetch spaces error:', err);
      const msg = err instanceof Error ? err.message : '스페이스 목록 조회에 실패했습니다.';
      setErrorMsg(msg);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const fetchMessages = async (spaceName: string) => {
    if (!accessToken || !spaceName) return;
    setIsLoadingMessages(true);
    try {
      const list = await listRecentMessages(accessToken, spaceName, 15);
      setMessages(list);
    } catch (err: unknown) {
      console.error('Fetch messages error:', err);
      // Non-fatal, just set empty messages
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleTriggerSendDraft = () => {
    if (!customDraft.trim()) return;
    // Hand over to the confirmation modal for explicit user confirmation
    onOpenConfirmModal(customDraft.trim(), '사용자 작성 메시지');
    setCustomDraft('');
  };

  const handleTemplateInsert = (template: string) => {
    setCustomDraft(template);
  };

  if (!user || !accessToken) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
          <MessageCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900">
            Google Chat 연동하기
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Google 계정으로 로그인하면, 상담에서 나눈 따뜻한 위로글이나 마음에 드는 데이트 코스 일정을 내 Google Chat 대화방과 스페이스로 바로 공유할 수 있습니다.
          </p>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-md mx-auto text-left text-xs text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>안전한 Google Workspace 연동</span>
          </div>
          <p className="text-emerald-700 leading-relaxed text-[11px]">
            Google 공식 OAuth 2.0 프로토콜을 사용하며, 메시지를 전송할 때마다 항상 명시적인 확인(Confirmation) 창이 표시됩니다.
          </p>
        </div>

        <div>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-200 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Google 계정으로 로그인 및 연동</span>
          </button>
        </div>
      </div>
    );
  }

  const activeSpaceObj = spaces.find((s) => s.name === selectedSpace);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Google Workspace 활성화됨</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Google Chat 스페이스 연동 센터
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100">
            스페이스를 선택하여 최근 대화를 확인하거나, 데이트 코스 및 상담 노트를 전송하세요.
          </p>
        </div>

        <button
          onClick={fetchSpaces}
          disabled={isLoadingSpaces}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
          <span>스페이스 새로고침</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Spaces List & Space Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Spaces list */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>내 Google Chat 스페이스</span>
            </h3>
            <span className="text-xs text-neutral-400 font-semibold">{spaces.length}개</span>
          </div>

          {isLoadingSpaces ? (
            <div className="p-8 text-center text-xs text-neutral-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
              <p>스페이스 목록을 불러오는 중...</p>
            </div>
          ) : spaces.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-2">
              <MessageSquare className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="font-semibold text-neutral-700">참여 중인 스페이스가 없습니다</p>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Google Chat 웹에서 새 스페이스를 만들거나 대화방에 입장한 후 새로고침해 주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {spaces.map((sp) => {
                const isSelected = sp.name === selectedSpace;
                return (
                  <button
                    key={sp.name}
                    onClick={() => setSelectedSpace(sp.name)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-start gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-300 shadow-2xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      #
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-neutral-900 truncate">
                          {sp.displayName || sp.name.replace('spaces/', '스페이스 ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {sp.spaceType || sp.type || 'SPACE'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Messages in Space & Quick Send */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Space Detail Box */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  #
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    {activeSpaceObj?.displayName || activeSpaceObj?.name || '스페이스를 선택하세요'}
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Google Chat 메시지 이력 및 전송
                  </span>
                </div>
              </div>

              {selectedSpace && (
                <button
                  onClick={() => fetchMessages(selectedSpace)}
                  disabled={isLoadingMessages}
                  className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                  <span>메시지 갱신</span>
                </button>
              )}
            </div>

            {/* Recent Messages View */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3">
              {isLoadingMessages ? (
                <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
                  <p>스페이스 메시지를 불러오는 중...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
                  <MessageSquare className="w-5 h-5 text-neutral-300 mx-auto" />
                  <p>최근 메시지가 없거나 조회 권한이 제한되어 있습니다.</p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-800">
                        {m.sender?.displayName || m.sender?.name || '사용자'}
                      </span>
                      <span className="text-neutral-400 text-[10px]">
                        {m.createTime ? new Date(m.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed">
                      {m.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Message Composer with Confirmation Flow */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Chat으로 메시지 보내기</span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-neutral-400">템플릿:</span>
                  <button
                    onClick={() =>
                      handleTemplateInsert(
                        '[SoloMate] 이번 주말 혼자 떠나는 힐링 투어 코스 추천!\n1. 성수동 블루보틀 커피\n2. 서울숲 메타세쿼이아 산책로\n3. 독립서점 탐방'
                      )
                    }
                    className="text-emerald-600 hover:underline"
                  >
                    코스 예시
                  </button>
                  <span>•</span>
                  <button
                    onClick={() =>
                      handleTemplateInsert(
                        '[SoloMate 오늘의 마음 한마디]\n"혼자인 시간은 나를 잃어버리는 것이 아니라, 진짜 나를 발견하는 가장 따뜻한 순간입니다."'
                      )
                    }
                    className="text-emerald-600 hover:underline"
                  >
                    위로글 예시
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                placeholder="전송하고 싶은 메시지나 일정을 입력하세요. 전송 버튼을 누르면 확인 대화상자가 열립니다."
                className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-neutral-50 focus:bg-white resize-none"
              />

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-neutral-400">
                  ※ 메시지 전송 전 항상 최종 확인 창이 나타납니다.
                </p>
                <button
                  onClick={handleTriggerSendDraft}
                  disabled={!customDraft.trim() || !selectedSpace}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>확인 후 전송하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
