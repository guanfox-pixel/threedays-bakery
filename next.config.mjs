/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 關閉 X-Powered-By 標頭提升安全性
  poweredByHeader: false,

  // 2. 允許 Supabase 圖片與外部圖片存取
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // 3. 自訂 Header 避免自訂網域被跨域原則 (CORS) 阻擋
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;