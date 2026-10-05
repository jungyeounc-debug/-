import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { Database } from 'lucide-react';
import { Header } from './components/Header';
import { CounselingChat } from './components/CounselingChat';
import { DateCourseGenerator } from './components/DateCourseGenerator';
import { GoogleChatHub } from './components/GoogleChatHub';
import { SavedFavorites } from './components/SavedFavorites';
import { GoogleChatModal } from './components/GoogleChatModal';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import {
  apiFetchSavedItems,
  apiSaveItem,
  apiDeleteSavedItem,
} from './services/backendApi';
import { DateCourse, SavedItem } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'course' | 'google-chat' | 'saved'>('chat');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Saved items from Backend Server
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);

  // Google Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [chatModalMessage, setChatModalMessage] = useState<string>('');
  const [chatModalTitle, setChatModalTitle] = useState<string>('공유');
  const [chatModalType, setChatModalType] = useState<'course' | 'counsel'>('course');

  // Notification Banner
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Load saved items from backend server
  const loadSavedItems = useCallback(async (targetUser: User | null) => {
    setIsLoadingSaved(true);
    try {
      const items = await apiFetchSavedItems(targetUser);
      setSavedItems(items);
    } catch (e) {
      console.error('Failed to load saved items from backend:', e);
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  // Sync when user changes
  useEffect(() => {
    loadSavedItems(user);
  }, [user, loadSavedItems]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        // Auth state verified
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`환영합니다, ${result.user.displayName || '사용자'}님! Google Chat & 백엔드 계정이 연결되었습니다.`);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.1, x: 0.9 },
        });
      }
    } catch (err: unknown) {
      console.error('Login failed:', err);
      const msg = err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.';
      showToast(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      showToast('로그아웃 되었습니다.');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleOpenGoogleChatModal = (
    messageText: string,
    title: string,
    type: 'course' | 'counsel' = 'course'
  ) => {
    setChatModalMessage(messageText);
    setChatModalTitle(title);
    setChatModalType(type);
    setIsChatModalOpen(true);
  };

  // Saving items to backend server
  const handleSaveCourse = async (course: DateCourse) => {
    const existing = savedItems.find((i) => i.id === course.id);
    if (existing) {
      try {
        await apiDeleteSavedItem(user, course.id);
        setSavedItems((prev) => prev.filter((i) => i.id !== course.id));
        showToast('백엔드 서버에서 코스 저장이 해제되었습니다.');
      } catch {
        showToast('저장 해제 중 오류가 발생했습니다.');
      }
      return;
    }

    const newItem: SavedItem = {
      id: course.id,
      type: 'course',
      title: course.title,
      content: course.summary,
      date: new Date().toLocaleDateString(),
      courseData: course,
    };

    try {
      await apiSaveItem(user, newItem);
      setSavedItems((prev) => [newItem, ...prev]);
      showToast('코스가 백엔드 서버에 안전하게 저장되었습니다! 💾');
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 },
      });
    } catch {
      showToast('서버 저장에 실패했습니다.');
    }
  };

  const handleSaveQuote = async (title: string, quote: string) => {
    const newItem: SavedItem = {
      id: 'quote-' + Date.now(),
      type: 'quote',
      title,
      content: quote,
      date: new Date().toLocaleDateString(),
    };

    try {
      await apiSaveItem(user, newItem);
      setSavedItems((prev) => [newItem, ...prev]);
      showToast('위로 문장이 백엔드 서버에 저장되었습니다! 💌');
    } catch {
      showToast('서버 저장에 실패했습니다.');
    }
  };

  const handleRemoveSavedItem = async (id: string) => {
    try {
      await apiDeleteSavedItem(user, id);
      setSavedItems((prev) => prev.filter((i) => i.id !== id));
      showToast('백엔드 서버에서 항목이 삭제되었습니다.');
    } catch {
      showToast('삭제 중 오류가 발생했습니다.');
    }
  };

  const isCourseSaved = (courseId: string) => {
    return savedItems.some((i) => i.id === courseId);
  };

  return (
    <div className="min-h-screen bg-[#faf8f7] text-neutral-800 flex flex-col font-sans selection:bg-rose-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border border-neutral-700 animate-in slide-in-from-bottom-5">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        savedCount={savedItems.length}
      />

      {/* Server Storage Sync Banner */}
      <div className="bg-emerald-50/70 border-b border-emerald-100 py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] text-emerald-800 font-medium">
          <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            백엔드 Express 서버 스토리지 연동됨 — 감성 상담 대화, 추천 코스 이력, 보관함 데이터가 서버에 안전하게 영구 저장됩니다.
          </span>
        </div>
      </div>

      {/* Main Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'chat' && (
          <CounselingChat
            user={user}
            onOpenGoogleChat={(msg, title) => handleOpenGoogleChatModal(msg, title, 'counsel')}
            onSaveQuote={handleSaveQuote}
          />
        )}

        {activeTab === 'course' && (
          <DateCourseGenerator
            user={user}
            onSaveCourse={handleSaveCourse}
            onOpenGoogleChat={(msg, title) => handleOpenGoogleChatModal(msg, title, 'course')}
            isSaved={isCourseSaved}
          />
        )}

        {activeTab === 'google-chat' && (
          <GoogleChatHub
            user={user}
            accessToken={accessToken}
            onLogin={handleLogin}
            onOpenConfirmModal={(msg, title) => handleOpenGoogleChatModal(msg, title, 'counsel')}
          />
        )}

        {activeTab === 'saved' && (
          <SavedFavorites
            savedItems={savedItems}
            onRemoveItem={handleRemoveSavedItem}
            onOpenGoogleChat={(msg, title) => handleOpenGoogleChatModal(msg, title, 'course')}
            onRefresh={() => loadSavedItems(user)}
            isRefreshing={isLoadingSaved}
          />
        )}
      </main>

      {/* Google Chat Mandatory Confirmation Modal */}
      <GoogleChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        accessToken={accessToken}
        onRequireAuth={handleLogin}
        initialMessage={chatModalMessage}
        itemTitle={chatModalTitle}
        itemType={chatModalType}
      />
    </div>
  );
}
