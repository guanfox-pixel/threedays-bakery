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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 表單 State
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // 圖片上傳 State
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('threedays_admin_logged');
    if (loggedIn === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'threedays2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('threedays_admin_logged', 'true');
    } else {
      alert('❌ 管理員密碼錯誤！');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchProducts();
  }, [isAuthenticated]);

  // 🌟 核心功能：上傳檔案至 Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查檔案大小 (限制 5MB 內)
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB！');
      return;
    }

    setUploadingImage(true);

    try {
      // 產生不重複的檔名
      const fileExt = file.name.split('.').pop();
      const fileName = `bread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. 上傳至 Supabase Storage 'product-images' bucket
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        alert(`❌ 圖片上傳失敗：${uploadError.message}`);
        return;
      }

      // 2. 取得公開 URL (Public URL)
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(urlData.publicUrl);
      alert('🎉 麵包圖片上傳成功！');
    } catch (err: any) {
      alert(`上傳發生例外：${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !stock) {
      alert('請填寫完整商品名稱、價格與庫存！');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('products').insert([
        {
          name: name.trim(),
          description: desc.trim(),
          price: Number(price),
          stock: Number(stock),
          image_url: imageUrl.trim(),
          is_active: true,
        },
      ]);

      if (error) {
        alert(`❌ 上架失敗：${error.message}`);
      } else {
        alert('🎉 成功上架麵包商品！');
        setName('');
        setDesc('');
        setPrice('');
        setStock('');
        setImageUrl('');
        fetchProducts();
      }
    } catch (err: any) {
      alert(`系統例外錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 max-w-md w-full">
          <h1 className="text-2xl font-bold text-amber-950 mb-2 text-center">🔐 管理員登入</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="請輸入密碼..."
              className="w-full p-3 border border-stone-300 rounded-lg"
              required
            />
            <button type="submit" className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold">
              登入後台
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 p-6 md:p-10 text-stone-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-950 mb-8">⚙️ threedays 後台商品管理系統</h1>

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
                className="w-full p-2.5 border border-stone-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">商品描述</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="請輸入麵包口感或成分..."
                className="w-full p-2.5 border border-stone-300 rounded-lg h-20"
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
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
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
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* 🌟 圖片上傳區塊 */}
            <div>
              <label className="block text-sm font-medium mb-1">上傳麵包照片</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-stone-50"
              />
              {uploadingImage && <p className="text-xs text-amber-800 mt-1 animate-pulse">圖片上傳 Supabase 中...</p>}
              {imageUrl && (
                <div className="mt-2">
                  <p className="text-xs text-emerald-600 font-semibold mb-1">圖片上傳成功預覽：</p>
                  <img src={imageUrl} alt="預覽" className="w-24 h-24 object-cover rounded-lg border border-stone-200" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition disabled:bg-stone-300"
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
          ) : (
            <div className="divide-y divide-stone-200">
              {products.map((p) => (
                <div key={p.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-xs text-stone-400">無圖</div>
                    )}
                    <div>
                      <h4 className="font-bold text-stone-900">{p.name}</h4>
                      <p className="text-xs text-amber-800 font-semibold">單價: ${p.price} | 庫存: {p.stock}</p>
                    </div>
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