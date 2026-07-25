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
  category: string;
}

interface Order {
  id: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  pickup_type: string;
  pickup_date: string;
  total_amount: number;
  items: any[];
  note: string;
  status: string;
  is_deleted?: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'trash'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 新增商品 State
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [category, setCategory] = useState<string>('吐司類');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 編輯商品 Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState<boolean>(false);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('threedays_admin_logged');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
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

  const handleLogout = () => {
    sessionStorage.removeItem('threedays_admin_logged');
    setIsAuthenticated(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (orderRes.data) setOrders(orderRes.data);
    } catch (err) {
      console.error('抓取資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // 🌟 1. 切換訂單狀態 (出貨/待處理)
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        alert(`❌ 更新狀態失敗：${error.message}`);
        fetchData();
      }
    } catch (err: any) {
      alert(`例外錯誤：${err.message}`);
      fetchData();
    }
  };

  // 🌟 2. 將訂單丟入 / 還原垃圾桶 (軟刪除)
  const handleToggleTrash = async (orderId: number, targetIsDeleted: boolean) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, is_deleted: targetIsDeleted } : o))
      );

      const { error } = await supabase
        .from('orders')
        .update({ is_deleted: targetIsDeleted })
        .eq('id', orderId);

      if (error) {
        alert(`❌ 操作失敗：${error.message}`);
        fetchData();
      } else {
        alert(targetIsDeleted ? '🗑️ 已將訂單移至垃圾桶' : '🎉 已成功還原訂單！');
      }
    } catch (err: any) {
      alert(`例外錯誤：${err.message}`);
      fetchData();
    }
  };

  // 🌟 3. 一鍵清空垃圾桶全部資料 (硬刪除)
  const handleClearAllTrash = async () => {
    const trashedOrders = orders.filter((o) => o.is_deleted);
    if (trashedOrders.length === 0) {
      alert('垃圾桶目前沒有任何資料！');
      return;
    }

    if (!confirm(`⚠️ 確定要永久清空垃圾桶中的 ${trashedOrders.length} 筆訂單嗎？刪除後無法復原！`)) {
      return;
    }

    try {
      const trashedIds = trashedOrders.map((o) => o.id);
      const { error } = await supabase.from('orders').delete().in('id', trashedIds);

      if (error) {
        alert(`❌ 清空失敗：${error.message}`);
      } else {
        alert('💥 垃圾桶已全部清空！');
        fetchData();
      }
    } catch (err: any) {
      alert(`清空發生例外：${err.message}`);
    }
  };

  // 圖片上傳
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
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

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
      alert(`上傳例外：${err.message}`);
    } finally {
      if (isEdit) setEditUploadingImage(false);
      else setUploadingImage(false);
    }
  };

  // 新增商品
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !stock) {
      alert('請填寫完整商品名稱、價格與庫存！');
      return;
    }

    const finalCategory = category === '其他自訂' ? customCategory.trim() || '未分類' : category;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('products').insert([
        {
          name: name.trim(),
          description: desc.trim(),
          price: Number(price),
          stock: Number(stock),
          category: finalCategory,
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
        setCategory('吐司類');
        setCustomCategory('');
        setImageUrl('');
        fetchData();
      }
    } catch (err: any) {
      alert(`系統例外錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 更新商品
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
          category: editingProduct.category.trim() || '未分類',
          image_url: editingProduct.image_url,
        })
        .eq('id', editingProduct.id);

      if (error) {
        alert(`❌ 更新失敗：${error.message}`);
      } else {
        alert('🎉 成功更新麵包商品資訊！');
        setEditingProduct(null);
        fetchData();
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
          <p className="text-stone-500 text-sm text-center mb-6">請輸入後台管理密碼以繼續</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="請輸入密碼..."
              className="w-full p-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition"
            >
              登入後台
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 過濾正常與已進垃圾桶的訂單
  const activeOrders = orders.filter((o) => !o.is_deleted);
  const trashedOrders = orders.filter((o) => o.is_deleted);

  return (
    <main className="min-h-screen bg-stone-100 p-6 md:p-10 text-stone-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-950">⚙️ threedays 後台管理系統</h1>
          <button
            onClick={handleLogout}
            className="text-sm bg-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-300 transition"
          >
            登出
          </button>
        </div>

        {/* 標籤頁切換按鈕 */}
        <div className="flex space-x-3 mb-6 border-b border-stone-200 pb-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'products'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            🍞 商品管理與上架
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'orders'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            📋 客戶預約單 ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'trash'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            🗑️ 垃圾桶 ({trashedOrders.length})
          </button>
        </div>

        {/* 頁籤 1：商品管理 */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-amber-900 mb-4">➕ 新增麵包品項</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium mb-1">商品類別 *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                    >
                      <option value="吐司類">🍞 吐司類</option>
                      <option value="可頌類">🥐 可頌類</option>
                      <option value="歐包類">🥖 歐包類</option>
                      <option value="甜點類">🍰 甜點類</option>
                      <option value="其他自訂">➕ 其他自訂類別</option>
                    </select>
                    {category === '其他自訂' && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="請輸入自訂類別名稱"
                        className="w-full p-2.5 border border-stone-300 rounded-lg mt-2 text-sm"
                        required
                      />
                    )}
                  </div>
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
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-stone-900">{p.name}</h4>
                            <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                              {p.category || '未分類'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500">{p.description || '無描述'}</p>
                          <p className="text-xs text-amber-800 font-semibold mt-1">單價: ${p.price} | 庫存: {p.stock}</p>
                        </div>
                      </div>

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
          </div>
        )}

        {/* 頁籤 2：正常客戶預約單 */}
        {activeTab === 'orders' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-amber-900 mb-4">📋 客戶預約訂單紀錄</h2>
            {loading ? (
              <p className="text-stone-400">載入預約單中...</p>
            ) : activeOrders.length === 0 ? (
              <p className="text-stone-400">目前尚無未處理或未出貨的訂單。</p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => {
                  const isShipped = order.status === 'completed' || order.status === '已出貨';
                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-lg text-amber-950">
                            {order.customer_name}
                          </span>
                          <span className="text-stone-600 text-sm">📞 {order.customer_phone}</span>
                          <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-semibold">
                            {order.pickup_type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          預約取貨日期：<strong className="text-stone-700">{order.pickup_date}</strong> | 
                          下單時間：{new Date(order.created_at).toLocaleString('zh-TW')}
                        </p>
                        {order.note && (
                          <p className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200 mt-2">
                            備註：{order.note}
                          </p>
                        )}
                        <div className="mt-3 pt-2 border-t border-stone-200">
                          <p className="text-xs font-bold text-stone-700 mb-1">預約品項：</p>
                          <ul className="text-xs space-y-1 text-stone-600">
                            {order.items &&
                              order.items.map((item: any, idx: number) => (
                                <li key={idx}>
                                  • {item.name} × {item.quantity} (NTD ${item.price * item.quantity})
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between items-end min-w-[150px]">
                        <span className="text-xl font-bold text-amber-900 mb-2 md:mb-0">
                          ${order.total_amount} 元
                        </span>

                        <div className="flex flex-col items-end space-y-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-bold ${
                              isShipped
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            狀態：{isShipped ? '✅ 已出貨' : '⏳ 待處理'}
                          </span>

                          <div className="flex items-center space-x-2">
                            {isShipped ? (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                                className="text-xs text-stone-500 underline hover:text-stone-800"
                              >
                                標記為待處理
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, '已出貨')}
                                className="bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-800 transition shadow-sm"
                              >
                                改為已出貨
                              </button>
                            )}

                            {/* 🌟 移至垃圾桶按鈕 */}
                            <button
                              onClick={() => handleToggleTrash(order.id, true)}
                              className="bg-stone-200 text-stone-700 text-xs px-2.5 py-1.5 rounded-lg font-bold hover:bg-rose-100 hover:text-rose-800 transition"
                              title="移至垃圾桶"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 🌟 頁籤 3：垃圾桶與一鍵清空 */}
        {activeTab === 'trash' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-rose-900">🗑️ 資源回收垃圾桶</h2>
              {trashedOrders.length > 0 && (
                <button
                  onClick={handleClearAllTrash}
                  className="bg-rose-800 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-rose-900 transition shadow-sm"
                >
                  💥 一鍵刪除全部資料
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-stone-400">載入垃圾桶資料中...</p>
            ) : trashedOrders.length === 0 ? (
              <p className="text-stone-400 py-6 text-center">垃圾桶內空空如也！</p>
            ) : (
              <div className="space-y-4">
                {trashedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg text-stone-800">
                          {order.customer_name}
                        </span>
                        <span className="text-stone-600 text-sm">📞 {order.customer_phone}</span>
                        <span className="text-xs bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded-full font-semibold">
                          {order.pickup_type}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        預約取貨日期：{order.pickup_date} | 下單時間：{new Date(order.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-stone-700">${order.total_amount} 元</span>
                      <button
                        onClick={() => handleToggleTrash(order.id, false)}
                        className="bg-stone-800 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-stone-900 transition"
                      >
                        ↩️ 還原訂單
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 編輯 Modal 彈窗 */}
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
                  <label className="block text-xs font-medium text-stone-600 mb-1">商品類別</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
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