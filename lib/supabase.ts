import { createClient } from '@supabase/supabase-js';

// 1. 從環境變數 (.env.local) 中讀取 Supabase 的連線資訊
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. 安全檢查：確保環境變數有正確讀取，避免執行時因缺少金鑰而崩潰
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 環境變數！請檢查 .env.local 檔案中的 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY。');
}

// 3. 初始化 Supabase 用戶端實例並匯出
export const supabase = createClient(supabaseUrl, supabaseAnonKey);