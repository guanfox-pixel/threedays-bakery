import { createClient } from '@supabase/supabase-js';

// 清理 URL 格式並提供靜態打包（Build Time）安全的預設值
const getCleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    // 預設合法 URL，避免 Next.js npm run build 時因網址無效而中斷
    return 'https://placeholder.supabase.co';
  }
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
// 確保 key 具備 Basic JWT 格式，防止 build 時 SDK 拋出 Invalid API Key
const supabaseAnonKey =
  rawKey && rawKey.length > 20
    ? rawKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// 建立全域 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);