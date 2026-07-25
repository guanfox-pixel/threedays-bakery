import { createClient } from '@supabase/supabase-js';

// 讀取正確的環境變數
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 格式清理
const cleanUrl = rawUrl ? rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '') : '';
const cleanKey = rawKey ? rawKey.trim() : '';

const supabaseUrl = cleanUrl || 'https://vjdspblbknwmkkojavtl.supabase.co';
const supabaseAnonKey = cleanKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// 建立全域 Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// 金鑰狀態檢查函式
export const checkSupabaseKeyStatus = () => {
  return {
    isUrlValid: supabaseUrl.includes('.supabase.co'),
    isKeyValid: supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 80,
    urlValue: supabaseUrl,
    keyLength: supabaseAnonKey.length,
  };
};