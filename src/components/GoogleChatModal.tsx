import React, { useState, useEffect } from 'react';
import { Send, X, AlertCircle, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';
import { ChatSpace, listChatSpaces, sendChatMessage } from '../services/googleChat';

interface GoogleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onRequireAuth: () => void;
  initialMessage: string;
  itemTitle?: string;
  itemType?: 'course' | 'counsel';
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onRequireAuth,
  initialMessage,
  itemTitle = '공유할 내용',
  itemType = 'course',
}) => {
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [messageText, setMessageText] = useState<string>(initialMessage);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessageText(initialMessage);
    setSendSuccess(false);
    setErrorMessage(null);
  }, [initialMessage, isOpen]);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadSpaces();
    }
  }, [isOpen, accessToken]);

  const loadSpaces = async () => {
    if (!accessToken) return;
    setIsLoadingSpaces(true);
    setErrorMessage(null);
    try {
      const fetchedSpaces = await listChatSpaces(accessToken);
      setSpaces(fetchedSpaces);
      if (fetchedSpaces.length > 0 && !selectedSpace) {
        setSelectedSpace(fetchedSpaces[0].name);
      }
    } catch (err: unknown) {
      console.error('Failed to load Google Chat spaces:', err);
      const msg = err instanceof Error ? err.message : '스페이스 목록을 불러오지 못했습니다.';
      setErrorMessage(msg);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleConfirmAndSend = async () => {
    if (!accessToken) {
      onRequireAuth();
      return;
    }
    if (!selectedSpace) {
      setErrorMessage('메시지를 전송할 Google Chat 스페이스를 선택해주세요.');
      return;
    }
    if (!messageText.trim()) {
      setErrorMessage('전송할 메시지 내용이 비어있습니다.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    try {
      await sendChatMessage(accessToken, selectedSpace, messageText.trim());
      setSendSuccess(true);
      setTimeout(() => {
        onClose();
        setSendSuccess(false);
      }, 1800);
    } catch (err: unknown) {
      console.error('Error sending message to Google Chat:', err);
      const msg = err instanceof Error ? err.message : 'Google Chat 메시지 전송에 실패했습니다.';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const currentSpaceObj = spaces.find((s) => s.name === selectedSpace);
  const spaceDisplayName =
    currentSpaceObj?.displayName || currentSpaceObj?.name || '선택된 스페이스';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Google Chat으로 전송</h3>
              <p className="text-xs text-neutral-500">
                {itemType === 'course' ? '데이트 코스 카드 공유' : '감성 상담 위로글 공유'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!accessToken ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-neutral-800">Google 계정 로그인이 필요합니다</h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Google Chat에 메시지를 전송하려면 먼저 사용자의 권한으로 로그인해야 합니다.
              </p>
              <button
                onClick={onRequireAuth}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Google 계정으로 로그인하기
              </button>
            </div>
          ) : (
            <>
              {/* Space Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  전송할 Google Chat 스페이스 선택
                </label>
                {isLoadingSpaces ? (
                  <div className="p-3 text-xs text-neutral-500 bg-neutral-50 rounded-xl border border-neutral-200 animate-pulse">
                    스페이스 목록을 불러오는 중...
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="p-3 text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                    <p className="font-medium">접근 가능한 Google Chat 스페이스가 없습니다.</p>
                    <p className="text-[11px] text-amber-600">
                      Google Chat 웹 또는 앱에서 대화방이나 스페이스를 먼저 생성하거나 초대받아주세요.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {spaces.map((space) => (
                      <option key={space.name} value={space.name}>
                        {space.displayName || space.name} ({space.spaceType || space.type || 'SPACE'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-700">전송될 메시지 내용 미리보기</label>
                  <span className="text-[11px] text-neutral-400">수정 가능</span>
                </div>
                <textarea
                  rows={7}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-neutral-700 resize-none leading-relaxed"
                  placeholder="전송할 내용을 입력하세요..."
                />
              </div>

              {/* Explicit Confirmation Notice (MANDATORY per Workspace guidelines) */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">사용자 작업 확인 (Confirmation)</p>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    선택하신 Google Chat 스페이스{' '}
                    <span className="font-bold underline decoration-emerald-400">
                      "{spaceDisplayName}"
                    </span>
                    에 위 메시지가 즉시 게시됩니다. 진행하시겠습니까?
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Notification */}
              {sendSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Google Chat으로 성공적으로 전송되었습니다!</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with Explicit Cancel & Confirm actions */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition"
          >
            취소 (Cancel)
          </button>
          {accessToken && (
            <button
              type="button"
              onClick={handleConfirmAndSend}
              disabled={isSending || spaces.length === 0 || !selectedSpace || sendSuccess}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? '전송 중...' : '확인 및 전송 (Confirm & Send)'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
