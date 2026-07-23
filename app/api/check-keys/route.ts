import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '未設定';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '未設定';

  // 只顯示前 10 個字元以確保安全性
  const maskedKey = key.length > 10 ? `${key.substring(0, 10)}...` : key;

  const isKeyValid = key.startsWith('eyJ') && key.length > 50;

  return NextResponse.json({
    status: isKeyValid ? 200 : 400,
    success: isKeyValid,
    message: isKeyValid
      ? '🎉 NEXT_PUBLIC_SUPABASE_ANON_KEY 格式看起來正確！'
      : '❌ Invalid API key：環境變數中的 ANON KEY 格式不正確或未正確注入！',
    environmentCheck: {
      supabaseUrl: url,
      anonKeyPrefix: maskedKey,
      keyLength: key.length,
      isJwtFormat: isKeyValid,
    },
    timestamp: new Date().toISOString(),
  });
}