import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 由 Server 端代理發送請求給 Supabase，完全避開瀏覽器端 Failed to fetch 限制
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Server 端讀取 Supabase 失敗:', error);
      return NextResponse.json(
        { success: false, message: error.message, errorDetails: error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err: any) {
    console.error('Server 端連線例外:', err);
    return NextResponse.json(
      { success: false, message: err.message || '伺服器內部連線例外' },
      { status: 500 }
    );
  }
}