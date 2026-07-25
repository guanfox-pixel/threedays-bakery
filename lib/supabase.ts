import { createClient } from '@supabase/supabase-js';

// 清理 URL 格式輔助函式
const getCleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return 'https://placeholder.supabase.co';
  }
  // 移除尾端多餘斜線與 rest 路徑
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
const supabaseAnonKey = (rawKey || '').trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// 建立全域 Supabase 客戶端實例，顯式設定 fetch 屬性
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 避免無效 Session 殘留導致 Fetch 失敗
  },
});

export const checkSupabaseKeyStatus = () => {
  const isUrlValid = supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('placeholder');
  const isKeyValid = supabaseAnonKey.length > 20;

  return {
    isUrlValid,
    isKeyValid,
    urlValue: isUrlValid ? supabaseUrl : '尚未設定有效專案 URL',
    keyPrefix: isKeyValid ? `${supabaseAnonKey.substring(0, 15)}...` : '尚未設定有效 Key',
    keyLength: supabaseAnonKey.length,
  };
};