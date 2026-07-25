'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. 改為呼叫我們自己的 Server Side API 代理，徹底避免 TypeError: Failed to fetch
  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/products');
      const result = await res.json();

      if (!result.success) {
        setErrorMsg(`無法讀取商品：${result.message}`);
      } else {
        setProducts(result.data);
      }
    } catch (err: any) {
      console.error('網絡連線失敗:', err);
      setErrorMsg(`連線失敗：${err.message || '請確認網路狀態'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 p-6 md:p-12">
      <header className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-amber-900 tracking-wide mb-2">
          🥖 threedays 烘焙手作
        </h1>
        <p className="text-stone-600">每日新鮮發酵，線上即時預約</p>
      </header>

      <section className="max-w-5xl mx-auto">
        {loading && (
          <div className="text-center py-12 text-stone-500">
            <p className="animate-pulse">正在讀取今日新鮮麵包資訊...</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center">
            <p className="font-semibold">{errorMsg}</p>
            <button
              onClick={fetchProducts}
              className="mt-2 text-sm bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200"
            >
              重新整理
            </button>
          </div>
        )}

        {!loading && !errorMsg && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-stone-200">
            <p className="text-stone-500">目前尚無上架麵包，請稍後再試！</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-md transition"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-stone-100 flex items-center justify-center text-stone-400">
                    尚無圖片
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-stone-900 mb-1">{item.name}</h3>
                  <p className="text-stone-500 text-sm mb-4 h-10 overflow-hidden">
                    {item.description || '新鮮手作，口感美味。'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-amber-800">${item.price} 元</span>
                    <span className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded-md border border-amber-200">
                      庫存: {item.stock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}