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
  is_active: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 預約表單狀態
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupType, setPickupType] = useState('店面自取');
  const [pickupDate, setPickupDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. 讀取烘焙麵包商品
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        console.error('讀取麵包清單失敗:', error.message);
      } else if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('網路連線異常:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. 加入購物車
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`已達到 ${product.name} 的每日預約庫存上限！`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // 3. 調整預約數量
  const updateQuantity = (id: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // 總金額計算
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 4. 送出預約訂單
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('請先選擇要預約的麵包品項！');
      return;
    }
    if (!customerName || !customerPhone || !pickupDate) {
      alert('請填寫完整訂購人姓名、電話與預約日期！');
      return;
    }

    setSubmitting(true);

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_type: pickupType,
        pickup_date: pickupDate,
        items: orderItems,
        total_amount: totalAmount,
        note: note,
        status: '待處理',
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert(`❌ 預約失敗: ${error.message}`);
    } else {
      alert('🎉 感謝您的預約！threedays 麵包店已收到您的訂單。');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPickupDate('');
      setNote('');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      {/* 頁首 Header */}
      <header className="bg-amber-900 text-amber-50 py-8 px-6 text-center shadow-md">
        <h1 className="text-3xl font-bold tracking-wider mb-2">🥖 threedays 烘焙手作</h1>
        <p className="text-xs text-amber-200 tracking-widest uppercase">Freshly Baked Every Three Days</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：商品選購區 */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-stone-800 border-b border-stone-200 pb-3 flex items-center gap-2">
            <span>🥐</span> 今日出爐與預約品項
          </h2>

          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm">麵包出爐中...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">今日麵包已全部售罄或未上架</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-stone-100 flex items-center justify-center text-2xl text-stone-400">🥖</div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-stone-800 text-base">{p.name}</h3>
                        <span className="font-extrabold text-amber-900 text-sm">${p.price}</span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className="w-full bg-amber-800 hover:bg-amber-900 text-amber-50 text-xs font-bold py-2 rounded-xl transition"
                    >
                      + 加入預約購物車
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右側：購物車與預約表單 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center justify-between">
              <span>🛒 預約清單</span>
              <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                {cart.length} 項
              </span>
            </h2>

            {cart.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-8">購物車是空的，點擊商品即可加入預約</p>
            ) : (
              <div className="space-y-3 mb-6 divide-y divide-stone-100">
                {cart.map((item) => (
                  <div key={item.id} className="pt-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-stone-800">{item.name}</div>
                      <div className="text-stone-400">${item.price} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 font-bold flex items-center justify-center hover:bg-stone-200"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 font-bold flex items-center justify-center hover:bg-stone-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center text-sm font-bold text-stone-900">
                  <span>預約總金額</span>
                  <span className="text-amber-900 text-base">${totalAmount} 元</span>
                </div>
              </div>
            )}

            {/* 預約人資訊表單 */}
            <form onSubmit={handleSubmitOrder} className="space-y-3 border-t border-stone-100 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">訂購人姓名</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 王小明"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">聯絡電話</label>
                <input
                  type="tel"
                  required
                  placeholder="例如: 0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">取貨方式</label>
                  <select
                    value={pickupType}
                    onChange={(e) => setPickupType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-xs focus:outline-none"
                  >
                    <option value="店面自取">店面自取</option>
                    <option value="外送服務">外送服務</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">預約取貨日期</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1">備註需求</label>
                <input
                  type="text"
                  placeholder="例: 切片/少糖"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-amber-50 font-bold py-2.5 rounded-xl text-xs transition mt-2"
              >
                {submitting ? '預約處理中...' : '確認送出麵包預約'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}