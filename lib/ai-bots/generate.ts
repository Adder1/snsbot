import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIBot, AI_BOTS } from "./config";
import { logAIBotActivity } from "../logger";

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function generateAIComment(
  postContent: string,
  bot: AIBot
): Promise<string> {
  logAIBotActivity(`시작: ${bot.name}의 댓글 생성`, {
    botName: bot.name,
    postContent: postContent.substring(0, 100) + "..."  // 긴 내용은 잘라서 로깅
  });

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
당신은 ${bot.name}입니다. 다음과 같은 특성을 가지고 있습니다:
- 성격: ${bot.personality}
- 특징: ${bot.traits.join(", ")}
- 말투 예시: ${bot.speakingStyle}

다음 게시물에 대해 ${bot.name}의 성격과 특징을 살려 한국어로 댓글을 작성해주세요.
댓글은 2-3문장 정도로 자연스럽게 작성해주세요.

게시물 내용:
${postContent}

규칙:
1. 반드시 해당 인물의 특징적인 말투를 사용할 것
2. 게시물의 내용과 관련된 답변을 할 것
3. 해당 인물의 전문 분야나 경험을 연관지어 답변할 것
4. 친근하고 재미있게 작성할 것
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    logAIBotActivity(`완료: ${bot.name}의 댓글 생성`, {
      botName: bot.name,
      generatedComment: text
    });
    
    return text.trim();
  } catch (error) {
    logAIBotActivity(`오류: ${bot.name}의 댓글 생성 실패`, {
      botName: bot.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error("Error generating AI comment:", error);
    return "죄송합니다. 지금은 댓글을 달 수 없습니다.";
  }
}

export async function generateRandomAIComments(
  postContent: string
): Promise<Array<{ botId: string; content: string }>> {
  logAIBotActivity("시작: AI 봇 댓글 생성", { 
    postContent: postContent.substring(0, 100) + "..."  // 긴 내용은 잘라서 로깅
  });
  
  // 모든 봇의 댓글 생성
  const comments = await Promise.all(
    AI_BOTS.map(async (bot) => {
      const content = await generateAIComment(postContent, bot);
      return {
        botId: bot.id.toString(),
        content,
      };
    })
  );

  logAIBotActivity("완료: AI 댓글 생성", {
    generatedComments: comments
  });

  return comments;
}

// AI 봇의 대댓글 생성
export async function generateAIReply(
  parentComment: string,
  botId: string,
  postContent: string
): Promise<string> {
  const bot = AI_BOTS.find(b => b.id === botId);
  if (!bot) {
    throw new Error(`Bot with id ${botId} not found`);
  }

  logAIBotActivity("시작: AI 봇의 대댓글 생성", {
    botName: bot.name,
    parentComment,
    postContent: postContent.substring(0, 100) + "..."
  });

  const prompt = `당신은 ${bot.name}입니다. ${bot.personality}

게시물 내용: ${postContent}
사용자의 댓글: ${parentComment}

위 댓글에 대한 답글을 ${bot.name}의 성격과 말투로 작성해주세요. 
특히 다음 특성을 반영해주세요:
- 성격: ${bot.traits.join(', ')}
- 말투: ${bot.speakingStyle}

답글은 한국어로, 2-3문장 정도로 자연스럽게 작성해주세요.`;

  try {
    const reply = await generateAIResponse(prompt);
    
    logAIBotActivity("완료: AI 봇의 대댓글 생성", {
      botName: bot.name,
      generatedReply: reply
    });

    return reply;
  } catch (error) {
    logAIBotActivity("오류: AI 봇의 대댓글 생성 실패", {
      botName: bot.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Note: generateAIResponse 함수는 정의되어 있지 않습니다. 이 함수는 Gemini AI의 generateContent 함수와 유사하게 구현되어야 합니다.
async function generateAIResponse(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text.trim();
}
