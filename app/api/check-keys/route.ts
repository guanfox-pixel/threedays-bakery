import { NextResponse } from 'next/server';

export async function GET() {
  // 從環境變數讀取金鑰
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // 清除 URL 尾端多餘的斜線或路徑
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  // 驗證是否為 Publishable / Anon public 的 JWT 格式 (以 eyJ 開頭且長度 > 100)
  const isAnonKeyValid = key.startsWith('eyJ') && key.length > 100;

  return NextResponse.json({
    status: isAnonKeyValid ? 200 : 400,
    success: isAnonKeyValid,
    message: isAnonKeyValid
      ? '🎉 成功！Vercel 已正確綁定 Supabase anon public (Publishable) 金鑰！'
      : '❌ 金鑰格式不正確！請確認填入的是 anon public Key 而非長度過短的字串。',
    keyDetails: {
      url: cleanUrl || '未讀取到 URL',
      keyLength: key.length,
      isJwtFormat: isAnonKeyValid,
      keyPreview: key ? `${key.substring(0, 15)}...` : '未注入',
    },
    timestamp: new Date().toISOString(),
  });
}