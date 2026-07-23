/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 允許 Supabase 圖片與雲端儲存庫存取
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // 2. 允許 DNS 轉址與 HiNet 節點標頭傳遞
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