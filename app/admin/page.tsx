'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 表單 State
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. 取得所有商品清單
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('讀取商品失敗:', error);
      } else if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('連線例外:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. 處理新增麵包商品上架
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !stock) {
      alert('請填寫完整商品名稱、價格與庫存！');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.from('products').insert([
        {
          name: name.trim(),
          description: desc.trim(),
          price: Number(price),
          stock: Number(stock),
          image_url: imageUrl.trim(),
          is_active: true,
        },
      ]).select();

      if (error) {
        alert(`❌ 上架失敗：${error.message}`);
      } else {
        alert('🎉 成功上架麵包商品！');
        setName('');
        setDesc('');
        setPrice('');
        setStock('');
        setImageUrl('');
        fetchProducts(); // 重新載入列表
      }
    } catch (err: any) {
      alert(`系統例外錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 p-6 md:p-10 text-stone-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-950 mb-8">⚙️ threedays 後台商品管理系統</h1>

        {/* 新增商品表單 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm mb-10 border border-stone-200">
          <h2 className="text-xl font-bold text-amber-900 mb-4">➕ 新增麵包品項</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">麵包名稱 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：日式鹽可頌"
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">商品描述</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="請輸入麵包口感或成分..."
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">價格 (NTD) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45"
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">每日庫存量 *</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="15"
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">圖片網址 (Image URL)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition disabled:bg-stone-400"
            >
              {submitting ? '商品上架中...' : '確認上架商品'}
            </button>
          </form>
        </section>

        {/* 商品列表 */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h2 className="text-xl font-bold text-amber-900 mb-4">📋 已上架商品清單</h2>
          {loading ? (
            <p className="text-stone-400">載入商品清單中...</p>
          ) : products.length === 0 ? (
            <p className="text-stone-400">目前尚無商品，請在上方新增！</p>
          ) : (
            <div className="divide-y divide-stone-200">
              {products.map((p) => (
                <div key={p.id} className="py-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg text-stone-900">{p.name}</h4>
                    <p className="text-sm text-stone-500">{p.description || '無描述'}</p>
                    <p className="text-xs text-amber-800 font-semibold mt-1">
                      單價: ${p.price} | 庫存: {p.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}