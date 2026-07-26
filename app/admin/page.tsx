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

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  return (
    <main className="min-h-screen bg-stone-100 p-4 sm:p-8 text-stone-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-stone-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-950">⚙️ 三日酵 - 訂單管理後台</h1>
            <p className="text-xs text-stone-500 mt-1">即時檢視與處理顧客的麵包預約與宅配訂單</p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-900 transition shadow-xs"
          >
            🔄 重新整理訂單
          </button>
        </header>

        {/* 狀態篩選頁籤 */}
        <div className="flex space-x-2 bg-stone-200/60 p-1.5 rounded-xl text-xs font-bold w-fit">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            全部訂單 ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'pending' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            待處理 ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'completed' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            已完成 ({orders.filter((o) => o.status === 'completed').length})
          </button>
        </div>

        {/* 訂單列表 */}
        {loading ? (
          <div className="p-12 text-center text-stone-400 animate-pulse bg-white rounded-2xl border border-stone-200">
            載入最新訂單集中...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            目前尚無對應狀態的訂單記錄
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const isDelivery = order.pickup_type === '宅配快遞';
              return (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-stone-900 text-base">
                            #{order.id} {order.customer_name}
                          </span>
                          {/* 🌟 核心標籤：清晰區分宅配快遞與到店自取 */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDelivery
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isDelivery ? '🚚 宅配快遞' : '🏪 到店自取'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">📞 {order.customer_phone}</p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}
                      >
                        {order.status === 'completed' ? '已完成' : '待處理'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <p className="text-stone-700">
                        <strong className="text-stone-900">⏰ 取貨/寄送時間：</strong>
                        {order.pickup_date}
                      </p>
                      {/* 🌟 宅配訂單亮點展示地址與備註 */}
                      {order.note && (
                        <p className="text-stone-700 whitespace-pre-line pt-1">
                          <strong className="text-stone-900">📝 備註 / 宅配地址：</strong>
                          <br />
                          <span className="text-amber-950 font-medium">{order.note}</span>
                        </p>
                      )}
                    </div>

                    {/* 商品清單 */}
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-bold text-stone-800">🛒 訂購明細：</p>
                      <div className="divide-y divide-stone-100 text-xs">
                        {order.items &&
                          order.items.map((item, idx) => (
                            <div key={idx} className="py-1 flex justify-between text-stone-600">
                              <span>
                                {item.name} x {item.quantity}
                              </span>
                              <span>${item.price * item.quantity}</span>
                            </div>
                          ))}
                      </div>
                      <div className="pt-2 flex justify-between font-bold text-sm text-amber-950 border-t border-stone-200">
                        <span>總計金額</span>
                        <span>${order.total_amount} 元</span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="pt-3 border-t border-stone-100 flex space-x-2 justify-end">
                    {order.status !== 'completed' ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition shadow-xs"
                      >
                        ✓ 標記為已完成
                      </button>
                    ) : (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'pending')}
                        className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-300 transition"
                      >
                        ↩ 重設為待處理
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}