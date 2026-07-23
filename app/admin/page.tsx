'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  pickup_type: string;
  pickup_date: string;
  items: any[];
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 新增商品表單狀態
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  
  // 商品照片上傳狀態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'threedays2026') {
      setIsAuthenticated(true);
      fetchProducts();
      fetchOrders();
    } else {
      alert('密碼錯誤！');
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id');
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if (data) setOrders(data);
  };

  // 1. 處理商品照片選取與預覽
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('照片檔案大小不能超過 5MB！');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 2. 上傳商品照片至 Supabase Storage
  const uploadProductImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('上傳失敗:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('圖片上傳錯誤:', err);
      return null;
    }
  };

  // 3. 處理新增商品提交
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newStock) {
      alert('請填寫完整商品名稱、價格與初始庫存！');
      return;
    }

    setIsUploading(true);
    let imageUrl = '';

    // 如果有選取照片，先執行上傳
    if (selectedFile) {
      const uploadedUrl = await uploadProductImage(selectedFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        alert('麵包照片上傳失敗！');
        setIsUploading(false);
        return;
      }
    }

    // 寫入 Supabase 產品表
    const { error } = await supabase.from('products').insert([
      {
        name: newName,
        description: newDescription,
        price: parseFloat(newPrice),
        stock: parseInt(newStock),
        image_url: imageUrl,
        is_active: true,
      },
    ]);

    setIsUploading(false);

    if (error) {
      alert(`新增失敗：${error.message}`);
    } else {
      alert('🎉 麵包商品新增成功！');
      setNewName('');
      setNewDescription('');
      setNewPrice('');
      setNewStock('');
      setSelectedFile(null);
      setImagePreview(null);
      fetchProducts();
    }
  };

  // 本地暫存庫存修改
  const handleLocalStockChange = (id: number, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  // 快捷填寫庫存
  const handleSetAllStock = (defaultQty: number) => {
    setProducts((prev) => prev.map((p) => ({ ...p, stock: defaultQty })));
  };

  // 上下架切換
  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p))
    );

    await supabase.from('products').update({ is_active: newStatus }).eq('id', id);
  };

  // 批次儲存庫存
  const handleBatchSaveStock = async () => {
    setIsSaving(true);
    try {
      for (const p of products) {
        await supabase.from('products').update({ stock: p.stock }).eq('id', p.id);
      }
      alert('🎉 每日庫存更新成功！');
    } catch (error) {
      alert('儲存失敗，請重試！');
    } finally {
      setIsSaving(false);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('確定要刪除這項商品嗎？')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full border border-amber-200">
          <h1 className="text-2xl font-bold text-amber-900 text-center mb-6">threedays 後台登入</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">管理員密碼</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="請輸入後台密碼"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full bg-amber-800 text-white font-bold py-3 rounded-xl hover:bg-amber-900 transition">
            登入管理系統
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-900">
            threedays 麵包店 - 快速管理後台
          </h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 transition">
            登出
          </button>
        </header>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
              activeTab === 'products' ? 'bg-amber-800 text-white' : 'bg-white text-gray-600 border hover:bg-amber-50'
            }`}
          >
            🍞 每日庫存與上下架
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
              activeTab === 'orders' ? 'bg-amber-800 text-white' : 'bg-white text-gray-600 border hover:bg-amber-50'
            }`}
          >
            📦 訂單管理 ({orders.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* 快速管理工具列 */}
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">⚡ 快速填充：</span>
                <button
                  onClick={() => handleSetAllStock(20)}
                  className="bg-white border border-amber-300 text-xs px-2.5 py-1 rounded hover:bg-amber-100"
                >
                  全部設為 20 個
                </button>
                <button
                  onClick={() => handleSetAllStock(10)}
                  className="bg-white border border-amber-300 text-xs px-2.5 py-1 rounded hover:bg-amber-100"
                >
                  全部設為 10 個
                </button>
              </div>

              <button
                onClick={handleBatchSaveStock}
                disabled={isSaving}
                className="bg-amber-800 text-white font-bold px-6 py-2 rounded-lg hover:bg-amber-900 transition shadow disabled:bg-gray-400"
              >
                {isSaving ? '儲存中...' : '💾 一鍵儲存今日所有庫存'}
              </button>
            </div>

            {/* 新增麵包品項 (含檔案上傳) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold text-gray-800 mb-4">➕ 新增麵包品項</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="麵包名稱 (例: 招牌生吐司)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="單價 ($)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="初始庫存"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
                
                <input
                  type="text"
                  placeholder="麵包簡介 (例: 香濃奶香，口感軟綿)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="border rounded-lg p-2.5 text-sm sm:col-span-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {/* 麵包照片選擇區塊 */}
                <div className="sm:col-span-3 border-t pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    上傳麵包商品照片 (建議尺寸: 1:1 正方形, 上限 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                  />
                  {imagePreview && (
                    <div className="mt-3 relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img src={imagePreview} alt="麵包照片預覽" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-amber-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-900 transition sm:col-span-3 disabled:bg-gray-400 mt-2"
                >
                  {isUploading ? '照片上傳與新增中...' : '確認新增商品'}
                </button>
              </form>
            </div>

            {/* 現有商品列表 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold text-gray-800 mb-4">麵包目錄列表</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase border-b">
                    <tr>
                      <th className="p-3">照片</th>
                      <th className="p-3">狀態</th>
                      <th className="p-3">品名</th>
                      <th className="p-3">單價</th>
                      <th className="p-3">今日庫存</th>
                      <th className="p-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className={`border-b ${!p.is_active ? 'bg-gray-100/60 opacity-60' : 'hover:bg-gray-50'}`}>
                        <td className="p-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">無照片</div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleActive(p.id, p.is_active)}
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {p.is_active ? '販售中' : '已下架'}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-gray-800">{p.name}</td>
                        <td className="p-3">${p.price}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={p.stock}
                            onChange={(e) => handleLocalStockChange(p.id, parseInt(e.target.value) || 0)}
                            className="w-24 border border-gray-300 rounded-md p-1.5 text-center font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:underline text-xs">
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">客戶訂單紀錄</h2>
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="border rounded-lg p-4 bg-amber-50/30">
                  <div className="flex flex-col sm:flex-row justify-between border-b pb-2 mb-2 gap-2">
                    <div>
                      <span className="font-bold text-amber-900 mr-2">訂單 #{o.id}</span>
                      <span className="text-gray-700 font-semibold">{o.customer_name}</span> ({o.customer_phone})
                    </div>
                    <div className="text-xs text-gray-500">
                      下單時間：{new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">取貨方式：</span>{o.pickup_type} | <span className="text-gray-500">取貨日期：</span>{o.pickup_date}</p>
                    <p><span className="text-gray-500">訂購明細：</span></p>
                    <ul className="list-disc pl-5 text-xs text-gray-600">
                      {o.items?.map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.name} x {item.quantity} 個 (${item.price} / 個)
                        </li>
                      ))}
                    </ul>
                    <p className="font-bold text-amber-900 pt-2 text-right">總金額：${o.total_amount} 元</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}