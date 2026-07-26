import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      pickupType,
      pickupDate,
      items,
      productSubtotal,
      deliveryFee,
      totalAmount,
      note,
    } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram Bot Token 或 Chat ID 未設定！');
      return NextResponse.json({ error: 'Server environment variable missing' }, { status: 500 });
    }

    const itemListText = items
      .map((item: any) => `▫️ *${item.name}* x ${item.quantity} ($${item.price * item.quantity}元)`)
      .join('\n');

    // 🌟 Telegram 推播動態加入運費明細
    const feeDetailText =
      pickupType === '宅配快遞'
        ? `💵 *商品小計：* $${productSubtotal} 元\n🚚 *宅配運費：* $${deliveryFee} 元\n💰 *應付總金額：* *$ ${totalAmount} 元*`
        : `💰 *訂單總金額：* *$ ${totalAmount} 元*`;

    const message = `
🍞 *【三日酵 THREEDAYS】收到新預約訂單！*
━━━━━━━━━━━━━━━━━━
👤 *訂購人姓名：* ${customerName}
📞 *聯絡電話：* ${customerPhone}
📍 *取貨/配送方式：* ${pickupType}
⏰ *預約時間：* ${pickupDate}
📝 *備註 / 宅配地址：*
${note || '無'}

📦 *訂購商品明細：*
${itemListText}

━━━━━━━━━━━━━━━━━━
${feeDetailText}
━━━━━━━━━━━━━━━━━━
⚡️ 請及時進入系統後台核對訂單與帳款！
    `.trim();

    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const tgData = await tgResponse.json();

    if (!tgResponse.ok) {
      console.error('Telegram API 回傳錯誤:', tgData);
      return NextResponse.json({ error: 'Telegram dispatch failed', details: tgData }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Telegram notification sent successfully!' });
  } catch (error: any) {
    console.error('API 執行例外錯誤:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}