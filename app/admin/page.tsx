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

  // 新增商品 State
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 🌟 編輯商品專用 State (null 代表未處於編輯狀態)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState<boolean>(false);

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

  // 新增商品圖片上傳
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB！');
      return;
    }

    if (isEdit) setEditUploadingImage(true);
    else setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bread_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        alert(`❌ 圖片上傳失敗：${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (isEdit && editingProduct) {
        setEditingProduct({ ...editingProduct, image_url: urlData.publicUrl });
      } else {
        setImageUrl(urlData.publicUrl);
      }
      alert('🎉 圖片上傳成功！');
    } catch (err: any) {
      alert(`上傳發生例外：${err.message}`);
    } finally {
      if (isEdit) setEditUploadingImage(false);
      else setUploadingImage(false);
    }
  };

  // 新增商品處理
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

  // 🌟 核心功能：更新已上架商品
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name.trim(),
          description: editingProduct.description.trim(),
          price: Number(editingProduct.price),
          stock: Number(editingProduct.stock),
          image_url: editingProduct.image_url,
        })
        .eq('id', editingProduct.id);

      if (error) {
        alert(`❌ 更新失敗：${error.message}`);
      } else {
        alert('🎉 成功更新麵包商品資訊！');
        setEditingProduct(null); // 關閉編輯 modal
        fetchProducts(); // 重新整理清單
      }
    } catch (err: any) {
      alert(`更新發生例外：${err.message}`);
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

        {/* 新增商品區塊 */}
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

            <div>
              <label className="block text-sm font-medium mb-1">上傳麵包照片</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, false)}
                disabled={uploadingImage}
                className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-stone-50"
              />
              {uploadingImage && <p className="text-xs text-amber-800 mt-1 animate-pulse">圖片上傳中...</p>}
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="預覽" className="w-20 h-20 object-cover rounded-lg border" />
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

        {/* 已上架商品清單與編輯按鈕 */}
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
                      <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-lg" />
                    ) : (
                      <div className="w-14 h-14 bg-stone-100 rounded-lg flex items-center justify-center text-xs text-stone-400">無圖</div>
                    )}
                    <div>
                      <h4 className="font-bold text-stone-900">{p.name}</h4>
                      <p className="text-xs text-stone-500">{p.description || '無描述'}</p>
                      <p className="text-xs text-amber-800 font-semibold mt-1">單價: ${p.price} | 庫存: {p.stock}</p>
                    </div>
                  </div>

                  {/* 🌟 編輯按鈕 */}
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="bg-amber-100 text-amber-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-200 transition"
                  >
                    ✏️ 編輯商品
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🌟 編輯商品 Modal 彈窗 */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-amber-950">✏️ 編輯麵包商品 (ID: {editingProduct.id})</h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-stone-400 hover:text-stone-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">麵包名稱</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">商品描述</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg text-sm h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">價格 (NTD)</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">庫存量</label>
                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">更換照片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    disabled={editUploadingImage}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-stone-50"
                  />
                  {editUploadingImage && <p className="text-xs text-amber-800 mt-1 animate-pulse">新圖片上傳中...</p>}
                  {editingProduct.image_url && (
                    <img src={editingProduct.image_url} alt="目前照片" className="w-20 h-20 object-cover rounded-lg border mt-2" />
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="w-1/2 bg-stone-100 text-stone-700 py-2.5 rounded-lg font-bold text-sm hover:bg-stone-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={editUploadingImage}
                    className="w-1/2 bg-amber-800 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-amber-900 transition"
                  >
                    儲存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}