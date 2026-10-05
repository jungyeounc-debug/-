import { User } from 'firebase/auth';
import { SavedItem, ChatMessage, DateCourse } from '../types';

export interface ChatSessionData {
  persona: string;
  messages: ChatMessage[];
  emotionalTemperature: number;
  detectedEmotion?: string;
  lastUpdated: number;
}

const getStorageUserKey = (user: User | null): string => {
  if (user?.uid) return `user_${user.uid}`;
  if (user?.email) return `email_${user.email.replace(/[@.]/g, '_')}`;
  return 'guest';
};

// 1. Saved Items (Date Courses & Comfort Quotes)
export const getSavedItemsFromStorage = (user: User | null): SavedItem[] => {
  try {
    const key = `solomate_saved_items_${getStorageUserKey(user)}`;
    const data = localStorage.getItem(key);
    if (!data) {
      // Fallback to legacy global key if available
      const legacy = localStorage.getItem('solomate_saved_items');
      return legacy ? JSON.parse(legacy) : [];
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read saved items from localStorage:', e);
    return [];
  }
};

export const saveItemToStorage = (user: User | null, item: SavedItem): SavedItem[] => {
  try {
    const current = getSavedItemsFromStorage(user);
    // Remove if exists
    const filtered = current.filter((i) => i.id !== item.id);
    const updated = [item, ...filtered];
    const key = `solomate_saved_items_${getStorageUserKey(user)}`;
    localStorage.setItem(key, JSON.stringify(updated));
    // Also update generic key for convenience
    localStorage.setItem('solomate_saved_items', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save item to localStorage:', e);
    return [];
  }
};

export const deleteSavedItemFromStorage = (user: User | null, id: string): SavedItem[] => {
  try {
    const current = getSavedItemsFromStorage(user);
    const updated = current.filter((i) => i.id !== id);
    const key = `solomate_saved_items_${getStorageUserKey(user)}`;
    localStorage.setItem(key, JSON.stringify(updated));
    localStorage.setItem('solomate_saved_items', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete item from localStorage:', e);
    return [];
  }
};

// 2. Chat Sessions History by Persona
export const getChatSessionFromStorage = (
  user: User | null,
  persona: string
): ChatSessionData | null => {
  try {
    const key = `solomate_chat_${getStorageUserKey(user)}_${persona}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to read chat session from localStorage:', e);
    return null;
  }
};

export const saveChatSessionToStorage = (
  user: User | null,
  persona: string,
  messages: ChatMessage[],
  emotionalTemperature: number,
  detectedEmotion?: string
): void => {
  try {
    const key = `solomate_chat_${getStorageUserKey(user)}_${persona}`;
    const session: ChatSessionData = {
      persona,
      messages,
      emotionalTemperature,
      detectedEmotion,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save chat session to localStorage:', e);
  }
};

export const clearChatSessionInStorage = (user: User | null, persona: string): void => {
  try {
    const key = `solomate_chat_${getStorageUserKey(user)}_${persona}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear chat session in localStorage:', e);
  }
};

// 3. Course Generation History
export const getCourseHistoryFromStorage = (user: User | null): DateCourse[] => {
  try {
    const key = `solomate_course_history_${getStorageUserKey(user)}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read course history from localStorage:', e);
    return [];
  }
};

export const saveCourseToHistoryInStorage = (
  user: User | null,
  course: DateCourse
): DateCourse[] => {
  try {
    const current = getCourseHistoryFromStorage(user);
    const updated = [course, ...current.filter((c) => c.id !== course.id)].slice(0, 30);
    const key = `solomate_course_history_${getStorageUserKey(user)}`;
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save course history to localStorage:', e);
    return [];
  }
};
