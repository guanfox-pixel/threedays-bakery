import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. 測試讀取 products 資料表
    const { data: products, error: readError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (readError) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: '❌ 無法讀取 products 資料表！請確認已執行 SQL 建表與 RLS 腳本。',
        errorDetails: readError,
      });
    }

    // 2. 測試寫入一個測試商品以驗證 INSERT 權限
    const testName = `測試法式麵包_${Date.now().toString().slice(-4)}`;
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert([
        {
          name: testName,
          description: '連線測試商品',
          price: 50,
          stock: 10,
          is_active: true,
        },
      ])
      .select();

    if (insertError) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: '❌ 讀取成功但寫入 (INSERT) 被阻擋！請檢查 SQL RLS INSERT Policy。',
        errorDetails: insertError,
      });
    }

    return NextResponse.json({
      status: 200,
      success: true,
      message: '🎉 恭喜！Supabase 建表與 RLS 讀寫權限已完全設定成功！',
      testInsertedProduct: insertData,
      currentProductsCount: products ? products.length : 0,
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