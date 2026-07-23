import { createClient } from '@supabase/supabase-js';

// 輔助函式：清理網址並確保回傳合法的 HTTP/HTTPS URL 格式
const getCleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    // 預設合法占位 URL，防止 build 階段 populate 靜態頁面時崩潰
    return 'https://placeholder.supabase.co';
  }
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey && rawKey.length > 20 ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// 建立全域 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 金鑰診斷函式
export const checkSupabaseKeyStatus = () => {
  const isUrlValid = supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('placeholder');
  const isKeyValid = supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 80;

  return {
    isUrlValid,
    isKeyValid,
    urlValue: isUrlValid ? supabaseUrl : '尚未設定有效專案 URL',
    keyPrefix: isKeyValid ? `${supabaseAnonKey.substring(0, 10)}...` : '尚未設定有效 ANON Key',
    keyLength: supabaseAnonKey.length,
  };
};