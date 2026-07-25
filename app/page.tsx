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
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 購物車與訂單狀態
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupType, setPickupType] = useState('到店自取');
  const [pickupDate, setPickupDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. 抓取商品清單
  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        setErrorMsg(`無法讀取商品：${error.message}`);
      } else if (data) {
        setProducts(data);
      }
    } catch (err: any) {
      setErrorMsg(`連線例外：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. 購物車數量控制
  const updateCartQuantity = (productId: number, delta: number, maxStock: number) => {
    setCart((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, Math.min(maxStock, currentQty + delta));
      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  // 3. 計算總金額與購買明細
  const cartItems: CartItem[] = products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ ...p, quantity: cart[p.id] }));

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 4. 送出預約訂單
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('請至少選擇一項麵包商品！');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !pickupDate) {
      alert('請完整填寫姓名、電話與預約取貨日期！');
      return;
    }

    setSubmitting(true);

    try {
      // 寫入 Supabase orders 資料表
      const { data, error } = await supabase.from('orders').insert([
        {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          pickup_type: pickupType,
          pickup_date: pickupDate,
          total_amount: totalPrice,
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          note: note.trim(),
          status: 'pending',
        },
      ]).select();

      if (error) {
        alert(`❌ 預約失敗：${error.message}`);
      } else {
        alert('🎉 預約成功！我們將會為您準備新鮮手作麵包！');
        // 重置表單與購物車
        setCart({});
        setCustomerName('');
        setCustomerPhone('');
        setPickupDate('');
        setNote('');
        fetchProducts(); // 重新讀取庫存
      }
    } catch (err: any) {
      alert(`系統例外錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 p-6 md:p-12">
      <header className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-amber-900 tracking-wide mb-2">
          🥖 threedays 烘焙手作
        </h1>
        <p className="text-stone-600">每日新鮮發酵，線上即時點單預約</p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：麵包點單區域 (2 欄) */}
        <section className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-amber-950 mb-6">🍞 今日新鮮麵包</h2>

          {loading && <p className="text-stone-400 animate-pulse">載入麵包品項中...</p>}
          {errorMsg && <p className="text-red-500 font-semibold">{errorMsg}</p>}

          {!loading && !errorMsg && products.length === 0 && (
            <p className="text-stone-400">目前尚無上架商品，請至後台新增！</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 flex flex-col justify-between"
                >
                  <div>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-stone-100 flex items-center justify-center text-stone-400">
                        尚無圖片
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-stone-900">{item.name}</h3>
                      <p className="text-stone-500 text-xs mt-1 h-8 overflow-hidden">
                        {item.description || '新鮮美味手作'}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-amber-900 font-bold">${item.price} 元</span>
                        <span className="text-xs text-stone-400">庫存: {item.stock}</span>
                      </div>
                    </div>
                  </div>

                  {/* 數量選擇按鈕 */}
                  <div className="p-4 pt-0 flex items-center justify-between">
                    <span className="text-xs text-stone-500">選擇數量：</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1, item.stock)}
                        className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 font-bold hover:bg-stone-200"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{qty}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1, item.stock)}
                        className="w-8 h-8 rounded-lg bg-amber-800 text-white font-bold hover:bg-amber-900"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 右側：購物車與預約結帳單 (1 欄) */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 h-fit sticky top-6">
          <h2 className="text-xl font-bold text-amber-950 mb-4">🛒 預約結帳單</h2>

          {/* 明細列表 */}
          {cartItems.length === 0 ? (
            <p className="text-stone-400 text-sm py-6 text-center">尚未選擇任何麵包品項</p>
          ) : (
            <div className="divide-y divide-stone-100 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2 flex justify-between text-sm">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold text-amber-900">
                    ${item.price * item.quantity}
                  </span>
                </div>
              ))}
              <div className="pt-3 flex justify-between font-bold text-base text-amber-950">
                <span>總計金額：</span>
                <span>${totalPrice} 元</span>
              </div>
            </div>
          )}

          {/* 表單 */}
          <form onSubmit={handleSubmitOrder} className="space-y-3 mt-4 pt-4 border-t border-stone-200">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">訂購人姓名 *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="王小明"
                className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">聯絡電話 *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">取貨方式</label>
                <select
                  value={pickupType}
                  onChange={(e) => setPickupType(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                >
                  <option value="到店自取">到店自取</option>
                  <option value="宅配到府">宅配到府</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">預約取貨日 *</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">備註說明</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="如有特殊需求請註明"
                className="w-full p-2 border border-stone-300 rounded-lg text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold text-sm hover:bg-amber-900 transition disabled:bg-stone-300 mt-2"
            >
              {submitting ? '送出預約中...' : '送出麵包預約單'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}