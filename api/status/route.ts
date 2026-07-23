import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const host = request.headers.get('host') || 'unknown';

  try {
    // 1. 檢查 Supabase 數據庫連線狀態
    const { data, error } = await supabase.from('products').select('id').limit(1);

    if (error) {
      return NextResponse.json({
        status: 500,
        success: false,
        domain: host,
        message: 'Supabase 連線失敗，請檢查 Vercel Environment Variables 設定！',
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      domain: host,
      message: `🎉 成功！網域 ${host} 已正確連通 Vercel 與 Supabase 資料庫。`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      domain: host,
      message: '伺服器端發生未預期錯誤',
      error: err.message,
    }, { status: 500 });
  }
}