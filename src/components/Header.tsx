import React from 'react';
import { User } from 'firebase/auth';
import { MessageSquareHeart, Compass, MessageCircle, Bookmark, LogOut, HeartHandshake } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'course' | 'google-chat' | 'saved';
  setActiveTab: (tab: 'chat' | 'course' | 'google-chat' | 'saved') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-md shadow-rose-200">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  SoloMate
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                  솔로메이트
                </span>
              </div>
              <p className="text-xs text-neutral-500 hidden sm:block">
                솔로들을 위한 따뜻한 감성 대화 & 실시간 데이트 코스 AI
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                  : 'text-neutral-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <MessageSquareHeart className="w-4 h-4" />
              <span>감성 상담소</span>
            </button>

            <button
              onClick={() => setActiveTab('course')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'course'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                  : 'text-neutral-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>데이트 코스 추천</span>
            </button>

            <button
              onClick={() => setActiveTab('google-chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === 'google-chat'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Google Chat 연동</span>
              {user && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative ${
                activeTab === 'saved'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                  : 'text-neutral-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">보관함</span>
              {savedCount > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold">
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* User Profile or Google Sign In */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full py-1 px-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-400"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden md:block max-w-[120px] truncate">
                  <div className="text-xs font-semibold text-neutral-800 truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Google Chat 연결됨</div>
                </div>
                <button
                  onClick={onLogout}
                  title="로그아웃"
                  className="p-1 text-neutral-400 hover:text-neutral-700 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-medium shadow-xs transition hover:shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isLoggingIn ? '연결 중...' : 'Google 계정 로그인'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
