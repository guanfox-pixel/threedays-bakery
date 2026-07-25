import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // 同時抓取兩種命名
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  const isUrlValid = cleanUrl.startsWith('https://') && cleanUrl.includes('.supabase.co');
  const isJwtFormat = key.startsWith('eyJ') && key.length > 80;
  const isPublishableFormat = key.startsWith('sb_publishable_') && key.length > 20;
  const isKeyValid = isJwtFormat || isPublishableFormat;

  const isAllValid = isUrlValid && isKeyValid;

  return NextResponse.json({
    status: isAllValid ? 200 : 400,
    success: isAllValid,
    message: isAllValid
      ? '🎉 成功！Supabase URL 與 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 已完美讀取！'
      : '❌ 讀取失敗，請確認 Vercel 或 .env.local 中的變數設定。',
    keyDetails: {
      url: cleanUrl || '未讀取到 URL',
      keyLength: key.length,
      isJwtFormat,
      isPublishableFormat,
      isKeyValid,
      keyPreview: key ? `${key.substring(0, 15)}...` : '未注入',
    },
    timestamp: new Date().toISOString(),
  });
}