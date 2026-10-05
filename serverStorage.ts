import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface BackendSavedItem {
  id: string;
  type: 'course' | 'quote';
  title: string;
  content: string;
  date: string;
  courseData?: any;
  createdAt: number;
}

export interface BackendChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  emotionalTemperature?: number;
  detectedEmotion?: string;
  comfortQuote?: string;
  followUpQuestions?: string[];
}

export interface BackendChatSession {
  persona: string;
  messages: BackendChatMessage[];
  emotionalTemperature: number;
  detectedEmotion?: string;
  lastUpdated: number;
}

export interface DatabaseSchema {
  savedItems: Record<string, BackendSavedItem[]>;
  chatSessions: Record<string, Record<string, BackendChatSession>>; // userId -> persona -> session
  courseHistory: Record<string, any[]>; // userId -> courses
}

const DEFAULT_DB: DatabaseSchema = {
  savedItems: {},
  chatSessions: {},
  courseHistory: {},
};

let memoryCache: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

// Ensure data folder and db file exist
async function ensureDb(): Promise<DatabaseSchema> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    memoryCache = JSON.parse(content);
    return memoryCache!;
  } catch {
    memoryCache = { ...DEFAULT_DB };
    await persistDb(memoryCache);
    return memoryCache;
  }
}

async function persistDb(data: DatabaseSchema): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error persisting database to disk:', err);
    }
  });
  return writeQueue;
}

// 1. Saved Items
export async function getSavedItems(userId: string): Promise<BackendSavedItem[]> {
  const db = await ensureDb();
  return db.savedItems[userId] || [];
}

export async function addSavedItem(userId: string, item: Omit<BackendSavedItem, 'createdAt'>): Promise<BackendSavedItem> {
  const db = await ensureDb();
  if (!db.savedItems[userId]) {
    db.savedItems[userId] = [];
  }

  // Remove duplicate if exists
  db.savedItems[userId] = db.savedItems[userId].filter((i) => i.id !== item.id);

  const fullItem: BackendSavedItem = {
    ...item,
    createdAt: Date.now(),
  };

  db.savedItems[userId].unshift(fullItem);
  await persistDb(db);
  return fullItem;
}

export async function deleteSavedItem(userId: string, itemId: string): Promise<boolean> {
  const db = await ensureDb();
  if (!db.savedItems[userId]) return false;

  const initialLength = db.savedItems[userId].length;
  db.savedItems[userId] = db.savedItems[userId].filter((i) => i.id !== itemId);
  const changed = db.savedItems[userId].length !== initialLength;

  if (changed) {
    await persistDb(db);
  }
  return changed;
}

// 2. Chat Sessions History
export async function getChatSession(userId: string, persona: string): Promise<BackendChatSession | null> {
  const db = await ensureDb();
  if (!db.chatSessions[userId] || !db.chatSessions[userId][persona]) {
    return null;
  }
  return db.chatSessions[userId][persona];
}

export async function saveChatSession(
  userId: string,
  persona: string,
  messages: BackendChatMessage[],
  emotionalTemperature: number,
  detectedEmotion?: string
): Promise<BackendChatSession> {
  const db = await ensureDb();
  if (!db.chatSessions[userId]) {
    db.chatSessions[userId] = {};
  }

  const session: BackendChatSession = {
    persona,
    messages,
    emotionalTemperature,
    detectedEmotion,
    lastUpdated: Date.now(),
  };

  db.chatSessions[userId][persona] = session;
  await persistDb(db);
  return session;
}

export async function clearChatSession(userId: string, persona: string): Promise<void> {
  const db = await ensureDb();
  if (db.chatSessions[userId] && db.chatSessions[userId][persona]) {
    delete db.chatSessions[userId][persona];
    await persistDb(db);
  }
}

// 3. Course Generation History
export async function getCourseHistory(userId: string): Promise<any[]> {
  const db = await ensureDb();
  return db.courseHistory[userId] || [];
}

export async function addCourseHistory(userId: string, course: any): Promise<void> {
  const db = await ensureDb();
  if (!db.courseHistory[userId]) {
    db.courseHistory[userId] = [];
  }

  db.courseHistory[userId].unshift({
    ...course,
    savedAtServer: Date.now(),
  });

  // Keep last 30 courses
  if (db.courseHistory[userId].length > 30) {
    db.courseHistory[userId] = db.courseHistory[userId].slice(0, 30);
  }

  await persistDb(db);
}

// 4. Overall User Stats
export async function getUserStats(userId: string) {
  const db = await ensureDb();
  const savedCount = (db.savedItems[userId] || []).length;
  const historyCount = (db.courseHistory[userId] || []).length;
  const sessions = Object.values(db.chatSessions[userId] || {});
  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);

  return {
    savedItemsCount: savedCount,
    generatedCoursesCount: historyCount,
    totalCounselingMessages: totalMessages,
    activeChatSessions: sessions.length,
    serverStorageStatus: 'connected',
    storageFile: 'data/db.json',
  };
}
