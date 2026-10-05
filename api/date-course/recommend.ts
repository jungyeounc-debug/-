import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3.8-flash';

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
    const {
      mode = 'solo',
      region = '서울 성수/서울숲',
      vibe = 'healing',
      timeOfDay = 'afternoon',
      budget = 'medium',
      customNote = '',
    } = body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    const generateWithRetry = async (): Promise<any> => {
      const modelsToTry = [MODEL_NAME, 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          return await ai.models.generateContent({
            model: m,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
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
    const parsedData = JSON.parse(responseText);

    return res.status(200).json(parsedData);
  } catch (error: unknown) {
    console.error('Date course generation handler error:', error);
    const errorMessage = error instanceof Error ? error.message : '데이트 코스 생성 중 오류가 발생했습니다.';
    return res.status(500).json({ error: errorMessage });
  }
}
