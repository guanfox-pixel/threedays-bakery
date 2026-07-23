import { createClient } from '@supabase/supabase-js';

// 讀取 Next.js 環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 輔助函式：檢查金鑰是否為合法的 Supabase ANON JWT 格式
export const checkSupabaseKeyStatus = () => {
  const isUrlValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
  const isKeyValid = supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 50;

  return {
    isUrlValid,
    isKeyValid,
    urlValue: supabaseUrl ? supabaseUrl : '未注入 (Empty)',
    keyPrefix: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : '未注入 (Empty)',
    keyLength: supabaseAnonKey.length,
  };
};

// 於瀏覽器開發者控制台 (Console) 印出診斷資訊
if (typeof window !== 'undefined') {
  const status = checkSupabaseKeyStatus();
  if (!status.isKeyValid) {
    console.error('❌ [Supabase Client Error] NEXT_PUBLIC_SUPABASE_ANON_KEY 無效或未被 Next.js 打包！', status);
  } else {
    console.log('✅ [Supabase Client Success] API Key 格式正確並已載入！');
  }
}

// 建立全域 Supabase 實例
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);