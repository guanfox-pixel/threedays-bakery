import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 嘗試向 Supabase products 資料表進行讀取測試
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: '❌ Supabase 資料庫回應錯誤！',
        errorDetails: {
          code: error.code,
          message: error.message,
          hint: error.hint || '請確認是否已設定 Supabase RLS 權限或 API Key 格式。',
        },
      });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: '🎉 成功連接至 Supabase 資料庫！',
      dataInfo: {
        productCount: count ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: '💥 連線發生例外中斷（Failed to fetch）',
      error: err.message,
    });
  }
}