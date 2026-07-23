'use client';

// 強制 Next.js 將此頁面視為動態渲染，避免 npm run build 靜態編譯失敗
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase, checkSupabaseKeyStatus } from '@/lib/supabase';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  pickup_type: string;
  pickup_date: string;
  items: OrderItem[] | any;
  total_amount: number;
  image_url: string | null;
  status: string;
  note?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // API Key 診斷狀態
  const [keyInfo, setKeyInfo] = useState<any>(null);

  // 資料狀態
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // 新增商品表單狀態
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdStock, setNewProdStock] = useState<number | ''>('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');

  // 檢視放大照片 Modal
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    // 頁面載入時取得 API Key 打包診斷狀態
    setKeyInfo(checkSupabaseKeyStatus());
  }, []);

  // 1. 密碼登入驗證
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'threedays2026') {
      setIsAuthenticated(true);
      fetchOrders();
      fetchProducts();
    } else {
      alert('密碼錯誤！請重新輸入。');
    }
  };

  // 2. 讀取訂單列表
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('讀取訂單失敗:', error);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  // 3. 讀取商品列表
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('讀取商品失敗:', error);
    } else if (data) {
      setProducts(data);
    }
  };

  // 4. 更新訂單狀態
  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert(`更新失敗: ${error.message}`);
    } else {
      fetchOrders();
    }
  };

  // 5. 切換商品上下架狀態
  const handleToggleProductActive = async (productId: number, currentActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentActive })
      .eq('id', productId);

    if (error) {
      alert(`更新商品失敗: ${error.message}`);
    } else {
      fetchProducts();
    }
  };

  // 6. 新增商品
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProdName.trim()) {
      alert('請填寫麵包名稱！');
      return;
    }
    if (newProdPrice === '' || isNaN(Number(newProdPrice))) {
      alert('請填寫正確的價格數字！');
      return;
    }
    if (newProdStock === '' || isNaN(Number(newProdStock))) {
      alert('請填寫正確的庫存數字！');
      return;
    }

    try {
      const { data, error } = await supabase.from('products').insert([
        {
          name: newProdName.trim(),
          description: newProdDesc.trim(),
          price: Number(newProdPrice),
          stock: Number(newProdStock),
          image_url: newProdImageUrl.trim(),
          is_active: true,
        },
      ]).select();

      if (error) {
        console.error('新增商品失敗 Error:', error);
        if (error.message.includes('API key') || error.message.includes('JWT')) {
          alert('❌ 錯誤：Invalid API key！請確認 Vercel 設定檔後執行 git push 觸發重新編譯。');
        } else {
          alert(`❌ 新增商品失敗：${error.message} (${error.details || '請確認 Supabase RLS 權限'})`);
        }
        return;
      }

      alert('🎉 成功新增麵包商品！');
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setNewProdStock('');
      setNewProdImageUrl('');
      fetchProducts();
    } catch (err: any) {
      console.error('系統發生例外錯誤:', err);
      alert(`系統發生未預期錯誤：${err.message}`);
    }
  };

  // 未登入畫面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-stone-200 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-stone-800 mb-1">threedays 麵包店</h1>
            <p className="text-sm text-stone-500">後台管理系統登入</p>
          </div>

          {/* 🔍 API Key 現場診斷區塊 */}
          {keyInfo && (
            <div className={`p-3 rounded-xl text-xs space-y-1 border ${
              keyInfo.isKeyValid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <span>Supabase API Key 狀態:</span>
                <span>{keyInfo.isKeyValid ? '🟢 正常注入' : '🔴 金鑰無效/未注入'}</span>
              </div>
              <div>URL: <code className="bg-white/50 px-1 rounded">{keyInfo.urlValue}</code></div>
              <div>ANON Key: <code className="bg-white/50 px-1 rounded">{keyInfo.keyPrefix}</code> (長度: {keyInfo.keyLength})</div>
              {!keyInfo.isKeyValid && (
                <div className="mt-1 font-semibold text-[11px] underline">
                  ⚠️ 提示：請確認 Vercel 設定檔後執行 git push 觸發重新編譯。
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">管理員密碼</label>
              <input
                type="password"
                placeholder="請輸入後台密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800/30"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-800 text-amber-50 font-bold py-2.5 rounded-xl hover:bg-amber-900 transition"
            >
              登入管理後台
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-16">
      {/* 頂部 Header */}
      <header className="bg-amber-900 text-amber-50 py-4 px-6 shadow flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wide">🥖 threedays 麵包店後台管理</h1>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-xs bg-amber-800 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition"
        >
          登出
        </button>
      </header>

      {/* 標籤頁選單 */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex border-b border-stone-200 gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'orders'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            📋 訂單管理
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'products'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            🥐 商品/庫存管理
          </button>
        </div>

        {/* Tab 1: 訂單管理 */}
        {activeTab === 'orders' && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-stone-800">所有預約訂單列表</h2>
              <button
                onClick={fetchOrders}
                className="text-xs bg-stone-200 hover:bg-stone-300 px-3 py-1.5 rounded-lg transition"
              >
                🔄 重新整理
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-stone-400 text-sm">載入訂單中...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">目前尚無預約訂單</div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => {
                  const itemsList = Array.isArray(o.items) ? o.items : [];

                  return (
                    <div
                      key={o.id}
                      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-900 text-lg">
                            #{o.id} {o.customer_name}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 font-medium text-stone-600">
                            {o.pickup_type}
                          </span>
                          <span className="text-xs text-stone-400">
                            預約日期: {o.pickup_date}
                          </span>
                        </div>

                        <div className="text-xs text-stone-500">
                          連絡電話: <span className="font-semibold text-stone-700">{o.customer_phone}</span>
                        </div>

                        {/* 品項清單 */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1">
                          {itemsList.map((item: OrderItem, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.name} × {item.quantity}</span>
                              <span className="font-semibold">${item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="border-t border-stone-200 pt-1 text-right font-bold text-stone-800 text-sm">
                            總計: ${o.total_amount} 元
                          </div>
                        </div>

                        {o.note && (
                          <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg">
                            備註: {o.note}
                          </div>
                        )}
                      </div>

                      {/* 照片與狀態控制區 */}
                      <div className="flex flex-col justify-between items-end gap-3 min-w-[180px]">
                        {o.image_url ? (
                          <button
                            type="button"
                            onClick={() => setModalImage(o.image_url)}
                            className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-200"
                          >
                            <img src={o.image_url} alt="附件" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition">
                              點擊放大
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-stone-300">無參考照片</span>
                        )}

                        <div className="w-full">
                          <label className="block text-[10px] font-bold text-stone-400 mb-1">訂單狀態</label>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-bold text-stone-700 focus:outline-none"
                          >
                            <option value="待處理">🟡 待處理</option>
                            <option value="處理中">🔵 處理中</option>
                            <option value="已完成">🟢 已完成</option>
                            <option value="已取消">🔴 已取消</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 商品管理 */}
        {activeTab === 'products' && (
          <div className="mt-6 space-y-8">
            {/* 新增商品表單 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>➕</span> 新增烘焙麵包
              </h3>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">麵包名稱</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 法式蒜味麵包"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">價格 ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="例: 85"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">每日庫存量</label>
                  <input
                    type="number"
                    required
                    placeholder="例: 30"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">圖片網址 (URL)</label>
                  <input
                    type="text"
                    placeholder="例: https://images.unsplash.com/..."
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-600 mb-1">商品描述</label>
                  <textarea
                    rows={2}
                    placeholder="簡單介紹這款麵包的風味與口感..."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 text-right">
                  <button
                    type="submit"
                    className="bg-amber-800 text-amber-50 font-bold px-6 py-2 rounded-xl hover:bg-amber-900 text-xs transition"
                  >
                    儲存並上架麵包
                  </button>
                </div>
              </form>
            </div>

            {/* 商品清單列表 */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <h3 className="font-bold text-stone-800 mb-4">現有麵包清單</h3>
              <div className="divide-y divide-stone-100">
                {products.map((p) => (
                  <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-xs text-stone-400">🥐</div>
                      )}
                      <div>
                        <div className="font-bold text-stone-800 text-sm">{p.name}</div>
                        <div className="text-xs text-stone-400">${p.price} 元 ‧ 庫存 {p.stock} 個</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleProductActive(p.id, p.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                        p.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      {p.is_active ? '上架中' : '已下架'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 照片放大 Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 bg-stone-900/80 text-white rounded-full p-2 text-xs hover:bg-stone-900 z-10"
            >
              ✕
            </button>
            <img src={modalImage} alt="放大照片" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}