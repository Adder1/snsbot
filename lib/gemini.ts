import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// 말투 변환을 위한 프롬프트 템플릿
const STYLE_PROMPTS: { [key: string]: string } = {
  진지: `다음 텍스트를 진지한 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 핵심 의미와 길이를 최대한 유지해주세요
    2. 불필요하게 길거나 형식적인 내용을 추가하지 마세요
    3. 단순히 진지한 어조로 바꾸되, 학술적이거나 과도하게 격식있는 표현은 피해주세요
    4. 원문의 메시지가 가볍더라도 그 본질은 유지해주세요

    예시:
    원문: "안녕 반가워!"
    변환: "안녕하세요. 진심으로 반갑습니다."
    
    원문:`,
  친근: `다음 텍스트를 친근한 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 핵심 의미와 길이를 최대한 유지해주세요
    2. 불필요한 내용을 추가하지 마세요
    3. 반말을 사용하되 예의는 지켜주세요
    4. 이모티콘이나 과도한 축약어는 사용하지 마세요

    예시:
    원문: "안녕하세요. 처음 뵙겠습니다."
    변환: "안녕~ 처음 보는데 반가워!"
    
    원문:`,
  유머러스: `다음 텍스트를 유머러스한 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 핵심 의미는 유지하면서 재치있게 표현해주세요
    2. 과도하게 유치하거나 저속한 표현은 피해주세요
    3. 위트있고 가벼운 톤을 유지해주세요
    4. 원문의 길이를 크게 벗어나지 마세요

    예시:
    원문: "오늘 날씨가 좋네요."
    변환: "이런 날씨에 집에 있다간 하늘이 삐질 것 같네요!"
    
    원문:`,
  "분노조절 실패": `다음 텍스트를 화가 난 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 핵심 의미는 유지하되 격앙된 어조로 표현해주세요
    2. 욕설이나 부적절한 표현은 사용하지 마세요
    3. 과도한 부정적 감정은 피하고, 약간의 투덜거림 정도로 유지해주세요
    4. 느낌표를 적절히 사용해주세요

    예시:
    원문: "아 오늘 늦잠 잤다."
    변환: "아니 도대체 왜 자꾸 늦잠을 자는 거야! 정말 미치겠네!"
    
    원문:`,
  짜증나게: `다음 텍스트를 짜증나는 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 의미는 유지하되 귀찮아하는 어조로 표현해주세요
    2. 불필요하게 공격적이거나 부정적이지 않게 해주세요
    3. 한숨 쉬는 듯한 느낌을 주되, 예의는 지켜주세요
    4. 과도한 반복이나 과장은 피해주세요

    예시:
    원문: "내일 회의가 있어요."
    변환: "하... 또 회의라니. 그래, 알았어요..."
    
    원문:`,
  기쁘게: `다음 텍스트를 기쁜 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 의미는 유지하되 긍정적이고 밝은 어조로 표현해주세요
    2. 과도하게 들뜨거나 어색하지 않게 해주세요
    3. 자연스러운 즐거움을 표현해주세요
    4. 느낌표는 적절히 사용해주세요

    예시:
    원문: "오늘 점심 뭐 먹을까요?"
    변환: "와! 오늘 점심이 기대되네요! 뭐 먹을까요~?"
    
    원문:`,
  슬프게: `다음 텍스트를 슬픈 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 의미는 유지하되 우울하고 쓸쓸한 어조로 표현해주세요
    2. 과도하게 비관적이거나 극단적이지 않게 해주세요
    3. 담담하면서도 서글픈 느낌을 주세요
    4. 불필요한 감정 과잉은 피해주세요

    예시:
    원문: "집에 가야겠어요."
    변환: "이제... 쓸쓸히 집으로 돌아가야겠네요..."
    
    원문:`,
  냉소적으로: `다음 텍스트를 냉소적인 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 의미는 유지하되 비꼬는 듯한 어조로 표현해주세요
    2. 지나치게 공격적이거나 악의적이지 않게 해주세요
    3. 약간의 비아냥거림을 포함하되, 예의는 지켜주세요
    4. 과도한 비꼼은 피해주세요

    예시:
    원문: "열심히 하면 됩니다."
    변환: "그래요, 열심히 하면 다 된다고들 하시죠..."
    
    원문:`,
  열정적으로: `다음 텍스트를 열정적인 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 의미는 유지하되 에너지 넘치는 어조로 표현해주세요
    2. 과도하게 흥분된 것처럼 보이지 않게 해주세요
    3. 긍정적이고 활기찬 느낌을 주세요
    4. 느낌표는 적절히 사용해주세요

    예시:
    원문: "운동 가실래요?"
    변환: "자, 이제 신나게 운동하러 가시죠! 건강한 하루를 만들어봐요!"
    
    원문:`,
  공손하게: `다음 텍스트를 공손한 말투로 변환해주세요. 단, 다음 규칙을 반드시 지켜주세요:
    1. 원문의 의미는 유지하되 예의 바른 어조로 표현해주세요
    2. 과도하게 형식적이거나 딱딱하지 않게 해주세요
    3. 자연스러운 존댓말을 사용해주세요
    4. 불필요한 겸손은 피해주세요

    예시:
    원문: "이거 먹어도 돼?"
    변환: "이것을 먹어도 될까요? 괜찮으시다면 허락해 주시겠습니까?"
    
    원문:`
};

// 그림 평가 프롬프트
const EVALUATION_PROMPTS = {
  'simribaksa': `당신은 그림을 통해 작가의 심리를 분석하는 심리학 박사입니다. 
아래 작품을 분석하고 다음 기준으로 평가해주세요:
1. 감정 상태
2. 성격 특성
3. 내면의 욕구
4. 스트레스 수준

100점 만점으로 심리 건강 점수를 매기고, 심리 분석 코멘트를 작성해주세요.
코멘트는 100자 이내로 작성해주세요.

응답 형식:
{
  "score": 점수(0-100),
  "comment": "심리 분석 코멘트"
}`,

  'parkchanho': `당신은 야구 레전드의 시각으로 그림을 평가하는 전문가입니다.
아래 작품을 분석하고 다음 기준으로 평가해주세요:
1. 집중력
2. 정확성
3. 끈기
4. 도전정신

100점 만점으로 점수를 매기고, 평가 코멘트를 작성해주세요.
코멘트는 100자 이내로 작성해주세요.

응답 형식:
{
  "score": 점수(0-100),
  "comment": "야구 레전드의 평가 코멘트"
}`,

  'ai-egg': `당신은 그림의 활력과 에너지를 평가하는 전문가입니다.
아래 작품을 분석하고 다음 기준으로 평가해주세요:
1. 역동성
2. 에너지 레벨
3. 활력도
4. 동기부여 요소

100점 만점으로 점수를 매기고, 평가 코멘트를 작성해주세요.
코멘트는 100자 이내로 작성해주세요.

응답 형식:
{
  "score": 점수(0-100),
  "comment": "활력 평가 코멘트"
}`,

  'ceo': `당신은 실용성과 상업적 가치를 평가하는 요리사 CEO입니다.
아래 작품을 분석하고 다음 기준으로 평가해주세요:
1. 실용성
2. 대중성
3. 창의성
4. 완성도

100점 만점으로 점수를 매기고, 평가 코멘트를 작성해주세요.
코멘트는 100자 이내로 작성해주세요.

응답 형식:
{
  "score": 점수(0-100),
  "comment": "요리사 CEO의 평가 코멘트"
}`,

  'joker': `당신은 독특한 시각으로 작품을 평가하는 광대입니다.
아래 작품을 분석하고 다음 기준으로 평가해주세요:
1. 유머러스함
2. 반전 요소
3. 의외성
4. 재미 요소

100점 만점으로 점수를 매기고, 평가 코멘트를 작성해주세요.
코멘트는 100자 이내로 작성해주세요.

응답 형식:
{
  "score": 점수(0-100),
  "comment": "광대의 평가 코멘트"
}`,

  'jisung': `당신은 축구 레전드의 관점으로 그림을 평가하는 전문가입니다.
아래 작품을 분석하고 다음 기준으로 평가해주세요:
1. 팀워크
2. 성실성
3. 발전 가능성
4. 겸손함

100점 만점으로 점수를 매기고, 평가 코멘트를 작성해주세요.
코멘트는 100자 이내로 작성해주세요.

응답 형식:
{
  "score": 점수(0-100),
  "comment": "축구 레전드의 평가 코멘트"
}`
};

export type EvaluationResult = {
  score: number;
  comment: string;
};

export async function transformText(text: string, style: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `${STYLE_PROMPTS[style]}\n${text}\n\n변환된 텍스트만 반환해주세요. 다른 설명이나 부가 내용은 제외해주세요.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error transforming text:', error);
    throw error;
  }
}

export async function analyzeDrawingPsychology(imageUrl: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // 이미지를 바이트 배열로 가져오기
    const imageResponse = await fetch(imageUrl);
    const imageData = await imageResponse.arrayBuffer();
    
    // 이미지 데이터를 base64로 변환
    const base64Image = Buffer.from(imageData).toString('base64');
    const mimeType = 'image/png'; // 또는 'image/jpeg'

    // 프롬프트 설정
    const prompt = `당신은 심리 분석 전문가입니다. 
    이 그림을 보고 작가의 심리 상태와 성격, 감정을 분석해주세요. 
    다음 요소들을 고려하여 분석해주세요:
    1. 선의 특징 (강약, 연속성 등)
    2. 구도와 공간 활용
    3. 표현된 요소들의 상징적 의미
    4. 전반적인 분위기

    분석은 전문가답게 하되, 친근하고 긍정적인 톤으로 작성해주세요.
    결과는 3-4문단으로 작성해주세요.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ]);

    const generatedResponse = await result.response;
    return generatedResponse.text();
  } catch (error) {
    console.error('Error analyzing drawing:', error);
    throw error;
  }
}

export async function evaluateDrawing(imageUrl: string, botId: string): Promise<EvaluationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = EVALUATION_PROMPTS[botId as keyof typeof EVALUATION_PROMPTS];
    if (!prompt) {
      throw new Error(`Invalid bot ID: ${botId}`);
    }

    // 이미지 데이터 처리
    let imageData = imageUrl;
    if (!imageUrl.startsWith('data:image')) {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      imageData = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
    }

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: imageData.replace(/^data:image\/\w+;base64,/, "")
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    
    try {
      // 마크다운에서 JSON 추출
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', text);
        throw new Error('No JSON found in response');
      }
      
      const json = JSON.parse(jsonMatch[0]);
      
      // 점수가 숫자인지 확인
      const score = Number(json.score);
      if (isNaN(score)) {
        console.error('Invalid score:', json.score);
        throw new Error('Invalid score');
      }

      return {
        score: Math.min(100, Math.max(0, score)), // 0-100 사이로 제한
        comment: json.comment.slice(0, 100), // 100자로 제한
      };
    } catch (error) {
      console.error('Failed to parse evaluation result:', error);
      console.error('Raw response:', text);
      // 파싱 실패 시 기본값 반환
      return {
        score: 50, // 중간값으로 변경
        comment: "평가 결과를 생성하는 중 오류가 발생했습니다.",
      };
    }
  } catch (error) {
    console.error('Error in evaluateDrawing:', error);
    return {
      score: 50, // 중간값으로 변경
      comment: "평가 중 오류가 발생했습니다.",
    };
  }
}