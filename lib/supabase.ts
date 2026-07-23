import { createClient } from '@supabase/supabase-js';

// 讀取 Next.js 公開環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 防呆機制：檢測金鑰是否正確設定
if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn(
    '⚠️ [Supabase Warning]: 檢測到 Supabase URL 或 ANON KEY 無效或未設定。' +
    '請確認 Vercel 的 Environment Variables 或 .env.local 已正確設定 NEXT_PUBLIC_SUPABASE_ANON_KEY。'
  );
}

// 建立全域單例 Supabase 客戶端程式碼
export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);