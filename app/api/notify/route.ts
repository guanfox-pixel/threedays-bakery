import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, pickupType, pickupDate, items, totalAmount, note } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram Bot Token 或 Chat ID 未設定！');
      return NextResponse.json({ error: 'Server environment variable missing' }, { status: 500 });
    }

    // 格式化商品明細文字
    const itemListText = items
      .map((item: any) => `▫️ *${item.name}* x ${item.quantity} ($${item.price * item.quantity}元)`)
      .join('\n');

    // 組合要發送到 Telegram 的 Markdown 訊息內容
    const message = `
🍞 *【三日酵 THREEDAYS】收到新預約訂單！*
━━━━━━━━━━━━━━━━━━
👤 *訂購人姓名：* ${customerName}
📞 *聯絡電話：* ${customerPhone}
📍 *取貨地點：* ${pickupType}
⏰ *預約取貨時間：* ${pickupDate}
📝 *備註說明：* ${note || '無'}

📦 *訂購商品明細：*
${itemListText}

💰 *訂單總金額：* *$ ${totalAmount} 元*
━━━━━━━━━━━━━━━━━━
⚡️ 請及時進入系統後台確認訂單！
    `.trim();

    // 發送請求至 Telegram Bot API
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