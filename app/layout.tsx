import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next Olympics/font/google'; // 若專案有字型設定，維持原樣即可
import './globals.css';

// 🌟 核心修改：設定瀏覽器分頁標題與網站描述
export const metadata: Metadata = {
  title: '三日酵麵包',
  description: '三日酵麵包預定系統 - 每日新鮮發酵，線上點單預約',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased bg-stone-50 text-stone-800">
        {children}
      </body>
    </html>
  );
}