import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const host = request.headers.get('host') || 'unknown';

  return NextResponse.json({
    status: 200,
    success: true,
    message: '🎉 恭喜！threedays.com.tw 已成功連通 Next.js 伺服器',
    connectionDetails: {
      domain: host,
      protocol: request.headers.get('x-forwarded-proto') || 'https',
      timestamp: new Date().toISOString(),
    },
  });
}