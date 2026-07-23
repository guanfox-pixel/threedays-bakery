import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 測試 Supabase 資料庫連線狀態
    const { data, error } = await supabase.from('products').select('count').limit(1);

    if (error) {
      return NextResponse.json({
        status: 500,
        success: false,
        message: 'Supabase 資料庫連線失敗！請檢查 Vercel 環境變數設定。',
        errorDetail: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: '🎉 threedays 伺服器與 Supabase 資料庫連線完全正常！',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: '伺服器內部發生未預期錯誤！',
      errorDetail: err.message,
    }, { status: 500 });
  }
}