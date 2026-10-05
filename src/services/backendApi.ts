import { User } from 'firebase/auth';
import { SavedItem, ChatMessage, DateCourse } from '../types';

export const getClientUserId = (user: User | null): string => {
  if (user?.uid) {
    return `user_${user.uid}`;
  }
  if (user?.email) {
    return `email_${user.email.replace(/[@.]/g, '_')}`;
  }

  let guestId = localStorage.getItem('solomate_guest_user_id');
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    localStorage.setItem('solomate_guest_user_id', guestId);
  }
  return guestId;
};

const getHeaders = (user: User | null) => ({
  'Content-Type': 'application/json',
  'X-User-Id': getClientUserId(user),
});

// 1. Saved Items API
export const apiFetchSavedItems = async (user: User | null): Promise<SavedItem[]> => {
  const res = await fetch('/api/data/saved', {
    headers: getHeaders(user),
  });
  if (!res.ok) throw new Error('백엔드 서버에서 저장된 항목을 가져오지 못했습니다.');
  const data = await res.json();
  return (data.items || []) as SavedItem[];
};

export const apiSaveItem = async (user: User | null, item: SavedItem): Promise<SavedItem> => {
  const res = await fetch('/api/data/saved', {
    method: 'POST',
    headers: getHeaders(user),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('백엔드 서버에 항목 저장 실패');
  const data = await res.json();
  return data.item;
};

export const apiDeleteSavedItem = async (user: User | null, id: string): Promise<boolean> => {
  const res = await fetch(`/api/data/saved/${id}`, {
    method: 'DELETE',
    headers: getHeaders(user),
  });
  if (!res.ok) throw new Error('백엔드 서버에서 항목 삭제 실패');
  const data = await res.json();
  return data.removed;
};

// 2. Chat Sessions API
export const apiFetchChatSession = async (user: User | null, persona: string) => {
  const res = await fetch(`/api/data/chat?persona=${encodeURIComponent(persona)}`, {
    headers: getHeaders(user),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.session;
};

export const apiSaveChatSession = async (
  user: User | null,
  persona: string,
  messages: ChatMessage[],
  emotionalTemperature: number,
  detectedEmotion?: string
) => {
  const res = await fetch('/api/data/chat', {
    method: 'POST',
    headers: getHeaders(user),
    body: JSON.stringify({
      persona,
      messages,
      emotionalTemperature,
      detectedEmotion,
    }),
  });
  if (!res.ok) return null;
  return await res.json();
};

export const apiClearChatSession = async (user: User | null, persona: string) => {
  await fetch(`/api/data/chat?persona=${encodeURIComponent(persona)}`, {
    method: 'DELETE',
    headers: getHeaders(user),
  });
};

// 3. Course History API
export const apiSaveCourseHistory = async (user: User | null, course: DateCourse) => {
  await fetch('/api/data/courses/history', {
    method: 'POST',
    headers: getHeaders(user),
    body: JSON.stringify({ course }),
  });
};

export const apiFetchCourseHistory = async (user: User | null): Promise<DateCourse[]> => {
  const res = await fetch('/api/data/courses/history', {
    headers: getHeaders(user),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
};

// 4. Server Stats
export const apiFetchServerStats = async (user: User | null) => {
  const res = await fetch('/api/data/stats', {
    headers: getHeaders(user),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.stats;
};
