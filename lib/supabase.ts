import { createClient } from '@supabase/supabase-js';

// 清理 URL 格式輔助函式
const getCleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return 'https://placeholder.supabase.co';
  }
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey || 'placeholder-key';

// 建立全域 Supabase 客戶端實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 診斷函式
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