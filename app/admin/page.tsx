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
}

export default function AdminPage() {
  // 登入狀態管理
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');

  // 分頁切換 (products / orders)
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // 商品與訂單資料
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 新增商品表單 State
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 檢查是否已登入
  useEffect(() => {
    const loggedIn = sessionStorage.getItem('threedays_admin_logged');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 登入驗證
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'threedays2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('threedays_admin_logged', 'true');
    } else {
      alert('❌ 管理員密碼錯誤！');
    }
  };

  // 取得商品與訂單資料
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
      console.error('資料載入錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // 處理新增商品
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
        fetchData();
      }
    } catch (err: any) {
      alert(`系統例外錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 未登入畫面
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

  // 已登入後台主畫面
  return (
    <main className="min-h-screen bg-stone-100 p-6 md:p-10 text-stone-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-950">⚙️ threedays 後台管理系統</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('threedays_admin_logged');
              setIsAuthenticated(false);
            }}
            className="text-sm bg-stone-200 text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-300 transition"
          >
            登出
          </button>
        </div>

        {/* 分頁切換按鈕 */}
        <div className="flex space-x-4 mb-6 border-b border-stone-200 pb-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-xl font-bold transition ${
              activeTab === 'products'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            🍞 商品管理與上架
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl font-bold transition ${
              activeTab === 'orders'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            📋 客戶預約單檢視 ({orders.length})
          </button>
        </div>

        {/* 標籤頁 1：商品管理 */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            {/* 新增商品表單 */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-amber-900 mb-4">➕ 新增麵包品項</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">麵包名稱 *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：日式紅豆吐司"
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
                      placeholder="80"
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
                      placeholder="20"
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
                  className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition disabled:bg-stone-300"
                >
                  {submitting ? '商品上架中...' : '確認上架商品'}
                </button>
              </form>
            </section>

            {/* 已上架商品列表 */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold text-amber-900 mb-4">📋 目前已上架商品</h2>
              {loading ? (
                <p className="text-stone-400">載入商品中...</p>
              ) : products.length === 0 ? (
                <p className="text-stone-400">目前尚無上架商品。</p>
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
        )}

        {/* 標籤頁 2：預約單檢視 */}
        {activeTab === 'orders' && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-amber-900 mb-4">📋 客戶預約訂單紀錄</h2>
            {loading ? (
              <p className="text-stone-400">載入訂單中...</p>
            ) : orders.length === 0 ? (
              <p className="text-stone-400">目前尚無任何預約訂單。</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
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

                    <div className="flex flex-col justify-between items-end min-w-[120px]">
                      <span className="text-xl font-bold text-amber-900">
                        ${order.total_amount} 元
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                        狀態：{order.status === 'pending' ? '待處理' : order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}