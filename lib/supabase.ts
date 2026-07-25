import { createClient } from '@supabase/supabase-js';

// 輔助函式：清理網址格式
const getCleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return 'https://placeholder.supabase.co';
  }
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
const supabaseAnonKey =
  rawKey && rawKey.length > 20
    ? rawKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// 1. 全域 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. 補全導出 app/admin/page.tsx 所需的診斷函式
export const checkSupabaseKeyStatus = () => {
  const isUrlValid = supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('placeholder');
  const isKeyValid =
    (supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 80) ||
    (supabaseAnonKey.startsWith('sb_publishable_') && supabaseAnonKey.length > 20);

  return {
    isUrlValid,
    isKeyValid,
    urlValue: isUrlValid ? supabaseUrl : '尚未設定有效專案 URL',
    keyPrefix: isKeyValid ? `${supabaseAnonKey.substring(0, 15)}...` : '尚未設定有效 ANON Key',
    keyLength: supabaseAnonKey.length,
  };
};