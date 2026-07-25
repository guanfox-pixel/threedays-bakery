import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 強制 Next.js 將此 API 視為完全動態路由，跳過 npm run build 靜態預先執行
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        status: 400,
        success: false,
        message: '❌ Supabase 資料庫回應錯誤',
        errorDetails: {
          code: error.code,
          message: error.message,
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
      message: '💥 連線發生例外中斷',
      error: err.message,
    });
  }
}