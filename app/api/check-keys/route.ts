import { NextResponse } from 'next/server';

export async function GET() {
  // 從環境變數讀取
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  // 自動清理 URL 格式
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  // 格式驗證
  const isUrlValid = cleanUrl.startsWith('https://') && cleanUrl.includes('.supabase.co');
  const isJwtFormat = key.startsWith('eyJ') && key.length > 80;
  const isPublishableFormat = key.startsWith('sb_publishable_') && key.length > 20;
  const isKeyValid = isJwtFormat || isPublishableFormat;

  const isConfigValid = isUrlValid && isKeyValid;

  return NextResponse.json({
    status: isConfigValid ? 200 : 400,
    success: isConfigValid,
    message: isConfigValid
      ? '🎉 恭喜！Vercel 環境變數 (NEXT_PUBLIC_SUPABASE_URL 與 ANON_KEY) 已完美設定並成功注入！'
      : '❌ 環境變數設定有誤，請確認 Vercel 設定檔中的變數名稱與數值。',
    envCheck: {
      url: cleanUrl || '未讀取到 URL (Empty)',
      isUrlValid,
      keyLength: key.length,
      keyFormat: isJwtFormat ? 'JWT (eyJ...)' : isPublishableFormat ? 'Publishable (sb_...)' : '未知/無效格式',
      isKeyValid,
      keyPreview: key ? `${key.substring(0, 15)}...` : '未讀取到 KEY (Empty)',
    },
    timestamp: new Date().toISOString(),
  });
}