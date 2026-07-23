import { NextResponse } from 'next/server';

export async function GET() {
  // 從伺服器端 process.env 讀取，避免前端靜態打包失敗
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  // 自動清除 URL 中多餘的 /rest/v1/ 或尾端斜線
  const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  return NextResponse.json({
    status: 200,
    success: true,
    config: {
      supabaseUrl: cleanUrl,
      supabaseAnonKey: rawKey,
    },
    timestamp: new Date().toISOString(),
  });
}