import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3.8-flash';

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

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-User-Id'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { messages, persona = 'ruda', userMood = '보통' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 메시지 내용이 비어있습니다.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const personaPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.ruda;

    const systemInstruction = `${personaPrompt}

당신은 솔로 사용자를 위한 AI 카운슬러 '솔로메이트(SoloMate)'입니다.
사용자의 현재 기분: "${userMood}"

사용자의 말에 진심으로 경청하고 깊은 공감을 표현하세요.
응답은 반드시 아래 JSON 형식으로 반환해야 합니다:
{
  "reply": "사용자에게 전달할 따뜻하고 진솔한 한국어 답변 (2~4문단 내외)",
  "emotionalTemperature": 70,
  "detectedEmotion": "사용자의 감정 키워드 1~2개 (예: '따뜻한 위로가 필요한 밤', '설레는 자기발견', '외로움 속 잔잔함')",
  "comfortQuote": "마음을 다독여주는 짧고 아름다운 명언이나 응원 한마디 (1~2줄)",
  "followUpQuestions": ["자연스럽게 이어갈 수 있는 질문 1", "질문 2"]
}`;

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const generateWithRetry = async (): Promise<any> => {
      const modelsToTry = [MODEL_NAME, 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          return await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });
        } catch (err: any) {
          lastErr = err;
          console.warn(`Model ${m} failed, trying next fallback:`, err?.message || err);
          await new Promise((r) => setTimeout(r, 600));
        }
      }
      throw lastErr;
    };

    const response = await generateWithRetry();

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

    return res.status(200).json(parsedData);
  } catch (error: unknown) {
    console.error('Counseling handler error:', error);
    const errorMessage = error instanceof Error ? error.message : '상담 응답 생성 중 오류가 발생했습니다.';
    return res.status(500).json({ error: errorMessage });
  }
}
