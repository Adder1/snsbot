import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

declare global {
  var io: SocketIOServer | undefined;
}

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const protocol = headersList.has('x-forwarded-proto') ? headersList.get('x-forwarded-proto') : 'http';
    const host = headersList.has('host') ? headersList.get('host') : 'localhost:3000';

    if (!global.io) {
      console.log('Initializing Socket.IO server...');
      
      const io = new SocketIOServer({
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        },
        path: '/socket.io'
      });

      io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId as string;
        if (userId) {
          socket.join(`user-${userId}`);
          console.log(`User ${userId} connected`);

          socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`);
          });
        }
      });

      const port = parseInt(process.env.SOCKET_PORT || '3001', 10);
      io.listen(port);
      console.log(`Socket.IO server is running on port ${port}`);

      global.io = io;
    }

    return new NextResponse('Socket.IO server is running', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic' 