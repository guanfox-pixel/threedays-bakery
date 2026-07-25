import { createClient } from '@supabase/supabase-js';

const getCleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return 'https://placeholder.supabase.co';
  }
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = getCleanSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

// 建立全域 Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);