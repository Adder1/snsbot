import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const response = new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });

  // 연결이 끊어졌을 때 정리
  req.signal.addEventListener('abort', () => {
    writer.close();
  });

  // 주기적으로 핑 보내기
  const pingInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode('event: ping\ndata: ping\n\n'));
    } catch (error) {
      clearInterval(pingInterval);
      writer.close();
    }
  }, 30000);

  return response;
} 