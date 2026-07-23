import { createClient } from '@supabase/supabase-js';

// 1. 清除 URL 多餘路徑的輔助函式
const cleanSupabaseUrl = (url: string) => {
  if (!url) return '';
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

// 讀取環境變數並自動清理格式
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey;

// 2. 金鑰狀態診斷函式
export const checkSupabaseKeyStatus = () => {
  const isUrlValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
  // 合法的 ANON Key 必定為 eyJ 開頭的長 JWT 字串 (長度 > 100)
  const isKeyValid = supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 80;

  return {
    isUrlValid,
    isKeyValid,
    urlValue: supabaseUrl || '未注入 (Empty)',
    keyPrefix: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : '未注入 (Empty)',
    keyLength: supabaseAnonKey.length,
  };
};

// 3. 建立全域 Supabase 客戶端實例
export const supabase = createClient(
  supabaseUrl || 'https://vjdspblbknwmkkojavtl.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);