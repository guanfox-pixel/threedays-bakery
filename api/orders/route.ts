import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

// 初始化 Resend Email 套件
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. 拆解前台傳送過來的 JSON 請求資料
    const body = await request.json();
    const { customerName, customerPhone, pickupType, pickupDate, items, totalAmount } = body;

    // 基本欄位驗證
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json({ error: '請完整填寫顧客資訊與訂購商品！' }, { status: 400 });
    }

    // 2. 檢查並更新商品庫存
    for (const item of items) {
      // 查詢該商品的最新庫存數量
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', item.id)
        .single();

      if (fetchError || !product) {
        return NextResponse.json({ error: `找不到商品 ID: ${item.id}` }, { status: 404 });
      }

      // 庫存不足檢查
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `商品「${product.name}」庫存不足，剩餘庫存：${product.stock}` },
          { status: 400 }
        );
      }

      // 扣減庫存並寫回資料庫
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', item.id);

      if (updateError) {
        throw new Error(`更新商品「${product.name}」庫存失敗`);
      }
    }

    // 3. 將訂單資料寫入 Supabase orders 資料表
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: customerName,
          customer_phone: customerPhone,
          pickup_type: pickupType,
          pickup_date: pickupDate,
          items: items,
          total_amount: totalAmount,
          status: '待處理'
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. 發送 LINE 即時訊息通知（若有設定 LINE 金鑰）
    if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_USER_ID) {
      // 整理商品清單字串
      const itemDetails = items.map((i: any) => `• ${i.name} x ${i.quantity}`).join('\n');
      
      const lineMessage = 
        `🍞 【threedays 新訂單通知】\n` +
        `-------------------------\n` +
        `訂購人：${customerName}\n` +
        `電話：${customerPhone}\n` +
        `取貨方式：${pickupType}\n` +
        `取貨日期：${pickupDate}\n` +
        `訂購內容：\n${itemDetails}\n` +
        `-------------------------\n` +
        `總金額：$${totalAmount} 元`;

      await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: process.env.LINE_USER_ID,
          messages: [{ type: 'text', text: lineMessage }],
        }),
      });
    }

    // 5. 發送 Email 通知（若有設定 RESEND API KEY）
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'threedays Bakery <orders@resend.dev>',
        to: ['your-email@example.com'], // 後續可於 .env.local 自訂接收信箱
        subject: `[threedays] 新訂單通知 - ${customerName}`,
        html: `<p>您收到一份來自 <strong>${customerName}</strong> 的新訂單！</p><p>總金額：$${totalAmount}</p>`,
      });
    }

    // 回傳成功狀態與訂單資料
    return NextResponse.json({ success: true, order });

  } catch (err: any) {
    console.error('訂單 API 處理錯誤:', err);
    return NextResponse.json({ error: err.message || '伺服器內部錯誤' }, { status: 500 });
  }
}