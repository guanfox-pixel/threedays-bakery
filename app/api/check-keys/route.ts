import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // 清除 URL 尾端多餘的斜線或路徑
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  // 1. 驗證 URL 是否合法
  const isUrlValid = cleanUrl.startsWith('https://') && cleanUrl.includes('.supabase.co');

  // 2. 驗證 Key 是否合法：支援經典 JWT (eyJ...) 或 Supabase 新版 (sb_publishable_...)
  const isJwtFormat = key.startsWith('eyJ') && key.length > 80;
  const isNewPublishableFormat = key.startsWith('sb_publishable_') && key.length > 20;
  const isKeyValid = isJwtFormat || isNewPublishableFormat;

  const isAllValid = isUrlValid && isKeyValid;

  return NextResponse.json({
    status: isAllValid ? 200 : 400,
    success: isAllValid,
    message: isAllValid
      ? '🎉 成功！Supabase URL 與 Publishable/ANON Key 格式驗證通過！'
      : '❌ 金鑰或 URL 格式不正確，請檢查 Vercel 環境變數。',
    keyDetails: {
      url: cleanUrl || '未讀取到 URL',
      keyLength: key.length,
      isJwtFormat,
      isNewPublishableFormat,
      isKeyValid,
      keyPreview: key ? `${key.substring(0, 15)}...` : '未注入',
    },
    timestamp: new Date().toISOString(),
  });
}