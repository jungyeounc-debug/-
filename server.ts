import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

import {
  getSavedItems,
  addSavedItem,
  deleteSavedItem,
  getChatSession,
  saveChatSession,
  clearChatSession,
  getCourseHistory,
  addCourseHistory,
  getUserStats,
} from './serverStorage.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;

// Helper to extract user identity from headers/queries
const getUserIdFromReq = (req: Request): string => {
  const headerId = req.headers['x-user-id'];
  if (typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  const queryId = req.query.userId;
  if (typeof queryId === 'string' && queryId.trim()) {
    return queryId.trim();
  }
  return 'default-guest-user';
};

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODEL_NAME = 'gemini-3.8-flash';

// Persona definitions
const PERSONA_PROMPTS: Record<string, string> = {
  ruda: `당신은 2030 세대의 가장 편안하고 따뜻한 랜선 베프 '루다'입니다.
말투는 부드럽고 다정한 존댓말(또는 적절한 애정이 담긴 친근한 톤)을 사용합니다.
혼자 사는 일상, 퇴근길의 허전함, 소소한 행복, 친구 같은 고민 나눔에 진심으로 귀 기울이고 리액션합니다.
과도하게 딱딱하거나 교과서적인 조언 대신, 따뜻한 차 한 잔 나누듯 이야기해주세요.`,

  sori: `당신은 사려 깊고 온화한 감성 심리 상담가 '소리'입니다.
솔로로서 느끼는 외로움, 자존감의 저하, 주변과의 비교로 인한 불안, 과거의 연애 상처를 부드럽게 보듬어줍니다.
판단하지 않고 감정을 온전히 수용하며, '혼자인 시간의 가치'와 '나를 진정으로 사랑하는 법'을 일깨워줍니다.
차분하고 섬세한 어조로 이야기해주세요.`,

  hajin: `당신은 솔직하고 든든하며 유쾌한 라이프 멘토 '하진'입니다.
멋진 솔로 라이프(갓생, 자기계발, 취미)와 연애 현실 팁을 적절히 조언해줍니다.
무조건적인 위로를 넘어 기운이 번쩍 나도록 긍정적인 에너지와 현실적인 시각을 제공합니다.
형/누나/오빠처럼 든든하고 유쾌하게 대화합니다.`,
};

// 1. Emotion Counseling Chat API
app.post('/api/chat/counsel', async (req: Request, res: Response) => {
  try {
    const { messages, persona = 'ruda', userMood = '보통' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 메시지 내용이 비어있습니다.' });
    }

    const personaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.ruda;

    const systemInstruction = `${personaPrompt}

당신은 솔로 사용자를 위한 AI 카운슬러 '솔로메이트(SoloMate)'입니다.
사용자의 현재 기분: "${userMood}"

사용자의 말에 진심으로 경청하고 깊은 공감을 표현하세요.
응답은 반드시 아래 JSON 형식으로 반환해야 합니다:
{
  "reply": "사용자에게 전달할 따뜻하고 진솔한 한국어 답변 (2~4문단 내외)",
  "emotionalTemperature": 70, // 0부터 100 사이의 숫자 (100은 매우 행복/설렘, 50은 차분/평온, 20은 깊은 외로움/우울)
  "detectedEmotion": "사용자의 감정 키워드 1~2개 (예: '따뜻한 위로가 필요한 밤', '설레는 자기발견', '외로움 속 잔잔함')",
  "comfortQuote": "마음을 다독여주는 짧고 아름다운 명언이나 응원 한마디 (1~2줄)",
  "followUpQuestions": ["자연스럽게 이어갈 수 있는 질문 1", "질문 2"]
}`;

    // Format chat contents
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        reply: responseText,
        emotionalTemperature: 60,
        detectedEmotion: '차분한 대화',
        comfortQuote: '오늘 하루도 당신은 충분히 빛났어요.',
        followUpQuestions: ['요즘 가장 마음이 편안했던 순간은 언제였나요?'],
      };
    }

    return res.json(parsedData);
  } catch (error: unknown) {
    console.error('Counseling chat error:', error);
    const errorMessage = error instanceof Error ? error.message : '상담 응답 생성 중 오류가 발생했습니다.';
    return res.status(500).json({ error: errorMessage });
  }
});

// 2. Real-time Date Course Recommendation API
app.post('/api/date-course/recommend', async (req: Request, res: Response) => {
  try {
    const {
      mode = 'solo', // 'solo' | 'romance'
      region = '서울 성수/서울숲',
      vibe = 'healing', // 'healing' | 'romantic' | 'gourmet' | 'activity' | 'budget'
      timeOfDay = 'afternoon', // 'afternoon' | 'evening' | 'allday'
      budget = 'medium',
      customNote = '',
    } = req.body;

    const isSolo = mode === 'solo';
    const modeDescription = isSolo
      ? '나 혼자 알차고 자유롭게 즐기는 힐링 솔로 투어 (혼밥/혼카페/산책/전시 등 갓생 코스)'
      : '썸이나 소개팅, 미래의 연인과 함께하는 설레는 로맨틱 데이트 코스';

    const prompt = `당신은 대한민국 최고의 트렌디한 데이트 & 핫플레이스 큐레이터입니다.
다음 조건에 맞추어 실제 존재하는 감성적인 핫플레이스를 연결한 실시간 데이트 코스를 추천해주세요.

[코스 조건]
- 모드: ${modeDescription}
- 지역: ${region}
- 분위기/테마: ${vibe}
- 시간대: ${timeOfDay}
- 예산 수준: ${budget}
- 추가 요청사항: ${customNote || '없음'}

응답은 반드시 아래 JSON 구조로만 반환해주세요:
{
  "title": "감각적이고 매력적인 코스 제목 (예: '성수동 골목의 나만의 향기와 힐링 브런치')",
  "subtitle": "한 줄 감성 요약",
  "mode": "${mode}",
  "region": "${region}",
  "vibe": "${vibe}",
  "totalEstimatedCost": "예상 총 비용 (예: '약 42,000원' 또는 '약 75,000원(2인 기준)')",
  "totalDuration": "총 소요 시간 (예: '약 4시간')",
  "summary": "이 코스가 왜 특별하고 매력적인지 설명하는 2~3줄의 이야기",
  "tips": "이 코스를 200% 즐기기 위한 핵심 꿀팁 (${isSolo ? '솔로를 위한 혼밥/포토 팁' : '어색함 깨는 대화/예약 꿀팁'})",
  "stops": [
    {
      "step": 1,
      "name": "실제 존재하는 첫 번째 스팟 이름",
      "category": "식사/맛집" 또는 "카페/디저트" 또는 "문화/전시/체험" 또는 "산책/야경",
      "time": "예상 시간대 (예: 13:00 - 14:30)",
      "description": "이 장소의 매력과 분위기 상세 설명",
      "recommendedItem": "추천 대표 메뉴나 꼭 해봐야 할 체험",
      "estimatedCost": "예상 비용 (예: '16,000원')",
      "soloOrCoupleTip": "${isSolo ? '혼자 즐길 때 편안한 좌석이나 팁' : '둘만의 분위기를 돋우는 팁'}",
      "searchKeyword": "지도 검색용 키워드 (예: '성수동 할머니의레시피')"
    }
  ]
}

주의사항:
1. stops는 동선이 매끄러운 3~4개의 연속된 장소로 구성하세요.
2. 장소 이름은 한국에서 실제로 운영 중인 유명/검증된 명소를 사용하세요.
3. ${isSolo ? '혼자 방문해도 전혀 눈치 보이지 않고 편안한 장소들을 우선 추천하세요.' : '첫 만남이나 썸에서 부담 없으면서도 대화하기 좋은 로맨틱한 장소들을 추천하세요.'}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json(parsedData);
  } catch (error: unknown) {
    console.error('Date course generation error:', error);
    const errorMessage = error instanceof Error ? error.message : '데이트 코스 생성 중 오류가 발생했습니다.';
    return res.status(500).json({ error: errorMessage });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', model: MODEL_NAME, storage: 'connected' });
});

// --- Backend Data Storage REST Endpoints ---

// 1. Saved items (courses & comfort quotes)
app.get('/api/data/saved', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const items = await getSavedItems(userId);
    res.json({ success: true, items });
  } catch (err: unknown) {
    console.error('Get saved items error:', err);
    res.status(500).json({ error: '저장된 항목을 불러오지 못했습니다.' });
  }
});

app.post('/api/data/saved', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { id, type, title, content, date, courseData } = req.body;
    if (!id || !title || !content) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    const saved = await addSavedItem(userId, { id, type, title, content, date, courseData });
    res.json({ success: true, item: saved });
  } catch (err: unknown) {
    console.error('Add saved item error:', err);
    res.status(500).json({ error: '항목 저장에 실패했습니다.' });
  }
});

app.delete('/api/data/saved/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    const removed = await deleteSavedItem(userId, id);
    res.json({ success: true, removed });
  } catch (err: unknown) {
    console.error('Delete saved item error:', err);
    res.status(500).json({ error: '항목 삭제에 실패했습니다.' });
  }
});

// 2. Counseling Chat Sessions History
app.get('/api/data/chat', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const persona = (req.query.persona as string) || 'ruda';
    const session = await getChatSession(userId, persona);
    res.json({ success: true, session });
  } catch (err: unknown) {
    console.error('Get chat session error:', err);
    res.status(500).json({ error: '대화 세션을 불러오지 못했습니다.' });
  }
});

app.post('/api/data/chat', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { persona = 'ruda', messages, emotionalTemperature = 60, detectedEmotion } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: '메시지 배열이 올바르지 않습니다.' });
    }
    const session = await saveChatSession(userId, persona, messages, emotionalTemperature, detectedEmotion);
    res.json({ success: true, session });
  } catch (err: unknown) {
    console.error('Save chat session error:', err);
    res.status(500).json({ error: '대화 세션 저장에 실패했습니다.' });
  }
});

app.delete('/api/data/chat', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const persona = (req.query.persona as string) || 'ruda';
    await clearChatSession(userId, persona);
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('Clear chat session error:', err);
    res.status(500).json({ error: '대화 세션 초기화에 실패했습니다.' });
  }
});

// 3. Course Generation History
app.get('/api/data/courses/history', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const history = await getCourseHistory(userId);
    res.json({ success: true, history });
  } catch (err: unknown) {
    console.error('Get course history error:', err);
    res.status(500).json({ error: '코스 생성 이력을 불러오지 못했습니다.' });
  }
});

app.post('/api/data/courses/history', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { course } = req.body;
    if (!course) {
      return res.status(400).json({ error: '코스 데이터가 누락되었습니다.' });
    }
    await addCourseHistory(userId, course);
    res.json({ success: true });
  } catch (err: unknown) {
    console.error('Add course history error:', err);
    res.status(500).json({ error: '코스 이력 저장에 실패했습니다.' });
  }
});

// 4. User stats and storage status
app.get('/api/data/stats', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const stats = await getUserStats(userId);
    res.json({ success: true, stats });
  } catch (err: unknown) {
    console.error('Get user stats error:', err);
    res.status(500).json({ error: '사용자 통계를 불러오지 못했습니다.' });
  }
});

// Attach Vite middleware in development, or serve build output in production
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
