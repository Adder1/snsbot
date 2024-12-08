import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const AI_BOT_LOG_FILE = path.join(LOG_DIR, 'ai-bot.log');

// 로그 디렉토리가 없으면 생성
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function logAIBotActivity(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}`;
  
  // 콘솔에도 출력
  console.log(logEntry);
  
  // 파일에 로그 추가
  fs.appendFileSync(AI_BOT_LOG_FILE, logEntry);
}
