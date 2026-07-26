'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  pickup_type: string;
  pickup_date: string;
  total_amount: number;
  items: OrderItem[];
  note: string;
  status: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

interface CategorySetting {
  id: number;
  category_name: string;
  is_pinned: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // 1. 訂單管理 State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 2. 商品管理 State
  const [products, setProducts] = useState<Product[]>([]);
  const [categorySettings, setCategorySettings] = useState<CategorySetting[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // 新增商品表單 State
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('熱門商品');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // 抓取訂單資料
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('抓取訂單失敗：', error.message);
      } else if (data) {
        setOrders(data);
      }
    } catch (err: any) {
      console.error('連線例外：', err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // 抓取商品與類別設定資料
  const fetchProductsAndCategories = async () => {
    setProductsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: true }),
        supabase.from('category_settings').select('*'),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (catRes.data) setCategorySettings(catRes.data);
    } catch (err: any) {
      console.error('抓取商品失敗：', err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProductsAndCategories();
  }, []);

  // 更新訂單狀態
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        alert(`更新失敗：${error.message}`);
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err: any) {
      alert(`更新例外：${err.message}`);
    }
  };

  // 🌟 刪除訂單（垃圾桶功能）
  const deleteOrder = async (orderId: number) => {
    if (!confirm(`⚠️ 確定要刪除訂單 #${orderId} 嗎？刪除後無法復原！`)) return;

    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);

      if (error) {
        alert(`刪除訂單失敗：${error.message}`);
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        alert('🗑️ 訂單已順利刪除！');
      }
    } catch (err: any) {
      alert(`刪除例外：${err.message}`);
    }
  };

  // 🌟 刪除商品（垃圾桶功能）
  const deleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`⚠️ 確定要刪除商品「${productName}」嗎？刪除後無法復原！`)) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) {
        alert(`刪除商品失敗：${error.message}`);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        alert('🗑️ 商品已順利刪除！');
      }
    } catch (err: any) {
      alert(`刪除例外：${err.message}`);
    }
  };

  // 切換商品上下架狀態
  const toggleProductActive = async (productId: number, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentActive })
        .eq('id', productId);

      if (error) {
        alert(`修改狀態失敗：${error.message}`);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_active: !currentActive } : p))
        );
      }
    } catch (err: any) {
      alert(`修改例外：${err.message}`);
    }
  };

  // 新增商品表單提交
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice === '') {
      alert('請填寫商品名稱與價格！');
      return;
    }

    setSubmittingProduct(true);
    try {
      const { error } = await supabase.from('products').insert([
        {
          name: newName.trim(),
          description: newDescription.trim(),
          price: Number(newPrice),
          image_url: newImageUrl.trim(),
          category: newCategory.trim(),
          is_active: true,
        },
      ]);

      if (error) {
        alert(`新增商品失敗：${error.message}`);
      } else {
        alert('🎉 商品上架成功！');
        setNewName('');
        setNewDescription('');
        setNewPrice('');
        setNewImageUrl('');
        fetchProductsAndCategories();
      }
    } catch (err: any) {
      alert(`新增例外：${err.message}`);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // 切換類別置頂
  const toggleCategoryPin = async (categoryName: string, isPinned: boolean) => {
    try {
      const existing = categorySettings.find((c) => c.category_name === categoryName);
      if (existing) {
        await supabase
          .from('category_settings')
          .update({ is_pinned: !isPinned })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('category_settings')
          .insert([{ category_name: categoryName, is_pinned: true }]);
      }
      fetchProductsAndCategories();
    } catch (err: any) {
      alert(`置頂設定失敗：${err.message}`);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const allCategories = Array.from(new Set(products.map((p) => p.category || '未分類')));

  return (
    <main className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-stone-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-950">⚙️ 三日酵 - 後台管理系統</h1>
            <p className="text-xs text-stone-500 mt-1">預約訂單處理與麵包商品上架管理</p>
          </div>

          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'orders' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🛒 訂單管理 ({orders.filter((o) => o.status === 'pending').length} 待處理)
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'products' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🍞 商品上架與管理 ({products.length})
            </button>
          </div>
        </header>

        {/* 1. 訂單管理分頁 */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2 bg-stone-200/60 p-1.5 rounded-xl text-xs font-bold w-fit">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  全部 ({orders.length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === 'pending' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  待處理 ({orders.filter((o) => o.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterStatus === 'completed' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  已完成 ({orders.filter((o) => o.status === 'completed').length})
                </button>
              </div>

              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 bg-white text-stone-700 rounded-lg text-xs font-bold border border-stone-200 hover:bg-stone-50"
              >
                🔄 重新整理
              </button>
            </div>

            {ordersLoading ? (
              <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border">載入訂單中...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border">尚無對應訂單</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => {
                  const isDelivery = order.pickup_type === '宅配快遞';
                  return (
                    <div key={order.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between relative">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start border-b pb-3 pr-8">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-stone-900 text-base">#{order.id} {order.customer_name}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isDelivery ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isDelivery ? '🚚 宅配快遞' : '🏪 到店自取'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">📞 {order.customer_phone}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {order.status === 'completed' ? '已完成' : '待處理'}
                            </span>
                            
                            {/* 🌟 核心按鈕：垃圾桶刪除訂單功能 */}
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition"
                              title="刪除訂單"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 bg-stone-50 p-3 rounded-xl border">
                          <p className="text-stone-700"><strong>⏰ 時間：</strong>{order.pickup_date}</p>
                          {order.note && (
                            <p className="text-stone-700 whitespace-pre-line pt-1">
                              <strong>📝 備註 / 宅配地址：</strong><br />
                              <span className="text-amber-950 font-medium">{order.note}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="font-bold">🛒 訂購明細：</p>
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-stone-600">
                              <span>{item.name} x {item.quantity}</span>
                              <span>${item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="pt-2 flex justify-between font-bold text-sm text-amber-950 border-t">
                            <span>總計金額</span>
                            <span>${order.total_amount} 元</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex justify-end space-x-2">
                        {order.status !== 'completed' ? (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                          >
                            ✓ 標記已完成
                          </button>
                        ) : (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'pending')}
                            className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold"
                          >
                            ↩ 重設待處理
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. 商品上架與管理分頁 */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 新增商品表單 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm h-fit space-y-4">
              <h2 className="text-lg font-bold text-amber-950 border-b pb-2">➕ 新增麵包品項上架</h2>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">商品名稱 *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例：招牌原味菠蘿"
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">商品類別 *</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="例：熱門菠蘿、月餅禮盒"
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">商品價格 (元) *</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="例：55"
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">圖片網址 (URL)</label>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">商品簡介</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="簡單說明口感與發酵特點..."
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white h-20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="w-full bg-amber-800 text-white py-2.5 rounded-lg font-bold text-xs hover:bg-amber-900 transition disabled:bg-stone-300"
                >
                  {submittingProduct ? '上架中...' : '確認上架商品'}
                </button>
              </form>
            </div>

            {/* 商品清單 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-stone-700 mr-2">📌 類別置頂設定：</span>
                {allCategories.map((catName) => {
                  const isPinned = categorySettings.some((c) => c.category_name === catName && c.is_pinned);
                  return (
                    <button
                      key={catName}
                      onClick={() => toggleCategoryPin(catName, isPinned)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${
                        isPinned
                          ? 'bg-amber-800 text-white'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {catName} {isPinned ? '★ 已置頂' : '☆ 置頂'}
                    </button>
                  );
                })}
              </div>

              {productsLoading ? (
                <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border">載入商品列表中...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-[10px]">
                            無圖
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-xs text-stone-900 truncate">{product.name}</p>
                          <p className="text-[10px] text-stone-500">
                            ${product.price} 元 ｜ {product.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => toggleProductActive(product.id, product.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                            product.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {product.is_active ? '販售中' : '已下架'}
                        </button>

                        {/* 🌟 核心按鈕：垃圾桶刪除商品功能 */}
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition"
                          title="刪除商品"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}