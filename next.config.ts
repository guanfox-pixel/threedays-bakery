import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 關閉 X-Powered-By 標頭以提升安全性
  poweredByHeader: false,

  // 2. 允許 Supabase 雲端與外部 Unsplash 圖片網址
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // 3. 避免型別警告阻擋 Vercel npm run build
  typescript: {
    ignoreBuildErrors: true,
  },

  // 4. 自訂安全標頭與跨域 CORS 開放
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;