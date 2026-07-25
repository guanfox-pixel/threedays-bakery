import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 測試對 products 資料表進行讀取
    const { data: products, error: readError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (readError) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: '❌ RLS 權限拒絕或資料表不存在！',
        error: readError.message,
        hint: '請至 Supabase SQL Editor 執行 RLS 開放腳本。',
      });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: '🎉 恭喜！.env.local 與 Supabase 資料庫連線完全打通且 RLS 權限正常！',
      dataCount: products ? products.length : 0,
      sampleData: products,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 500,
      success: false,
      message: '💥 網路請求例外失敗',
      error: err.message,
    });
  }
}