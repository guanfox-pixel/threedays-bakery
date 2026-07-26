'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_active: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedCategories, setPinnedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 圖片放大燈箱 State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 購物車與預約單 State
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupType, setPickupType] = useState('到店自取 (復興店)');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('14:00');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 計算「後天」的最小可選日期字串 (YYYY-MM-DD)
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 2); // 至少提前 2 天
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [prodRes, pinRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('id', { ascending: true }),
        supabase
          .from('category_settings')
          .select('category_name')
          .eq('is_pinned', true),
      ]);

      if (prodRes.error) {
        setErrorMsg(`無法讀取商品：${prodRes.error.message}`);
      } else if (prodRes.data) {
        setProducts(prodRes.data);
      }

      if (pinRes.data) {
        setPinnedCategories(pinRes.data.map((c) => c.category_name));
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

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const cartItems: CartItem[] = products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ ...p, quantity: cart[p.id] }));

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 商品分類與類別內排序邏輯 (禮盒置後，其餘按數字排序)
  const categorizedProducts = products.reduce<{ [category: string]: Product[] }>((acc, product) => {
    const cat = product.category || '未分類';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(product);
    return acc;
  }, {});

  const extractQuantity = (name: string): number => {
    const match = name.match(/(\d+)\s*(入|個|顆|盒|隻|pcs)?/i) || name.match(/\d+/);
    return match ? parseInt(match[1], 10) : 999;
  };

  Object.keys(categorizedProducts).forEach((cat) => {
    categorizedProducts[cat].sort((a, b) => {
      const isAGift = a.name.includes('禮盒');
      const isBGift = b.name.includes('禮盒');

      if (isAGift && !isBGift) return 1;
      if (!isAGift && isBGift) return -1;

      if (isAGift && isBGift) {
        const qtyA = extractQuantity(a.name);
        const qtyB = extractQuantity(b.name);
        if (qtyA !== qtyB) {
          return qtyA - qtyB;
        }
      }

      const numA = a.name.match(/\d+/);
      const numB = b.name.match(/\d+/);

      if (numA && numB) {
        const diff = parseInt(numA[0], 10) - parseInt(numB[0], 10);
        if (diff !== 0) return diff;
      }

      return a.name.localeCompare(b.name, 'zh-Hant');
    });
  });

  const sortedCategoryNames = Object.keys(categorizedProducts).sort((a, b) => {
    const isAPinned = pinnedCategories.includes(a);
    const isBPinned = pinnedCategories.includes(b);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0;
  });

  // 🌟 新增：攔截日期選擇事件，阻擋週日與週一
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const day = dateObj.getDay(); // 0 是週日，1 是週一
      if (day === 0 || day === 1) {
        alert('⚠️ 週日與週一為公休日，請選擇其他營業日期！');
        setPickupDate(''); // 清空無效選擇
        return;
      }
    }
    setPickupDate(selectedDate);
  };

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

    // 🌟 表單送出前的雙重防呆：阻擋週日與週一
    const selectedDateObj = new Date(pickupDate);
    const dayOfWeek = selectedDateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      alert('⚠️ 週日與週一為公休日，無法預約取貨，請選擇其他日期！');
      return;
    }

    if (minDate && pickupDate < minDate) {
      alert(`⚠️ 預約失敗：取貨日需提前至少 2 天預訂！\n最早可預約日期為：${minDate}`);
      return;
    }

    setSubmitting(true);

    const selectedTime = pickupTime || '14:00';
    const fullPickupDateTime = `${pickupDate.trim()} ${selectedTime.trim()}`;

    try {
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          pickup_type: pickupType,
          pickup_date: fullPickupDateTime,
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
      ]);

      if (error) {
        alert(`❌ 預約失敗：${error.message}`);
      } else {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            pickupType,
            pickupDate: fullPickupDateTime,
            items: cartItems,
            totalAmount: totalPrice,
            note: note.trim(),
          }),
        }).catch((err) => console.error('推播失敗:', err));

        alert('🎉 預約成功！我們將會為您準備新鮮手作麵包！');
        setCart({});
        setCustomerName('');
        setCustomerPhone('');
        setPickupDate('');
        setPickupTime('14:00');
        setNote('');
        fetchProducts();
      }
    } catch (err: any) {
      alert(`系統例外錯誤: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen text-stone-800 p-3 sm:p-6 md:p-12 bg-stone-50 overflow-x-hidden">
      <header className="-mx-3 -mt-3 sm:mx-auto sm:mt-0 max-w-5xl text-center mb-6 md:mb-10 flex flex-col items-center">
        <div className="w-full sm:max-w-md md:max-w-lg">
          <img
            src="/logo.png"
            alt="三日酵 THREEDAYS"
            className="w-full h-auto block object-cover drop-shadow-sm mb-3"
          />
        </div>
        
        <p className="text-xs md:text-sm font-semibold text-stone-600 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full border border-stone-200/80 shadow-xs mx-3">
          熱量就該浪費在美好的菠蘿上
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <section className="lg:col-span-2 space-y-8">
          {loading && <p className="text-stone-400 animate-pulse text-sm">載入麵包品項中...</p>}
          {errorMsg && <p className="text-red-500 font-semibold text-sm">{errorMsg}</p>}

          {!loading && !errorMsg && products.length === 0 && (
            <p className="text-stone-400 text-sm bg-white p-4 rounded-xl text-center border border-stone-200">
              目前尚無上架商品，請至後台新增！
            </p>
          )}

          {!loading &&
            sortedCategoryNames.map((categoryName) => (
              <div key={categoryName} className="space-y-3">
                <h2 className="text-lg md:text-xl font-bold text-amber-950 border-b border-amber-300/80 pb-2 flex items-center bg-white px-3 py-1.5 rounded-lg border border-stone-200">
                  <span>{categoryName}</span>
                  {pinnedCategories.includes(categoryName) && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-normal">
                      熱門推薦
                    </span>
                  )}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {categorizedProducts[categoryName].map((item) => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition"
                      >
                        <div>
                          {item.image_url ? (
                            <div
                              onClick={() => setPreviewImage(item.image_url)}
                              className="w-full h-28 sm:h-36 md:h-40 overflow-hidden cursor-zoom-in relative group"
                              title="點擊放大檢視圖片"
                            >
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                                🔍 點擊放大
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-28 sm:h-36 md:h-40 bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
                              尚無圖片
                            </div>
                          )}

                          <div className="p-2.5 sm:p-4">
                            <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug break-words">
                              {item.name}
                            </h3>
                            <p className="text-stone-500 text-xs mt-1 leading-relaxed break-words whitespace-pre-line">
                              {item.description || '新鮮美味手作'}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-amber-900 font-bold text-sm sm:text-base">
                                ${item.price} 元
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-4 pt-0 flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs text-stone-500 hidden sm:inline">
                            數量：
                          </span>
                          <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                            <button
                              onClick={() => updateCartQuantity(item.id, -1)}
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 text-xs sm:text-sm flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-xs sm:text-sm">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, 1)}
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-amber-800 text-white font-bold hover:bg-amber-900 text-xs sm:text-sm flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </section>

        <section className="space-y-6 h-fit sticky top-6">
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm text-stone-800">
            <h3 className="font-bold text-amber-950 text-base mb-3 flex items-center border-b border-amber-200/60 pb-2">
              <span className="mr-1.5">📌</span> 預訂注意事項
            </h3>

            {/* 🌟 新增與修改：根據您的需求重構的注意事項排版 */}
            <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <div className="font-bold text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 text-center space-y-0.5">
                <p>《不接受當日預訂》</p>
                <p>《當日請現場購買》</p>
              </div>

              <div className="space-y-0.5 pt-1">
                <p className="font-bold text-amber-900">▪ 預訂未滿 200 元</p>
                <p className="pl-3 text-stone-600">
                  請直接至現場選購（12:00-13:00 品項齊全）
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="font-bold text-amber-900">▪ 需提前 2 天預訂，付款成功即完成訂單</p>
              </div>

              <ul className="space-y-1 text-stone-600 pl-1 list-none text-[11px] pt-1">
                <li>*提早2天前預訂付款</li>
                <li>*無外送服務，請至復興店取餐</li>
              </ul>

              <hr className="border-amber-200/60 my-2" />
              
              <div className="space-y-1 text-[11px] text-stone-700">
                <p>取餐時段為：<strong>14：00～00：00 (周日一公休)</strong></p>
                <p className="text-amber-900 font-semibold">非營業時間可販售機取貨</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-lg md:text-xl font-bold text-amber-950 mb-4">🛒 預約結帳單</h2>

            {cartItems.length === 0 ? (
              <p className="text-stone-400 text-xs sm:text-sm py-4 text-center">尚未選擇任何麵包品項</p>
            ) : (
              <div className="divide-y divide-stone-100 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between text-xs sm:text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold text-amber-900">
                      ${item.price * item.quantity}
                    </span>
                  </div>
                ))}
                <div className="pt-3 flex justify-between font-bold text-sm sm:text-base text-amber-950">
                  <span>總計金額：</span>
                  <span>${totalPrice} 元</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-3 mt-4 pt-4 border-t border-stone-200">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">訂購人姓名 *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="王小明"
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
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
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">取貨方式</label>
                <select
                  value={pickupType}
                  onChange={(e) => setPickupType(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-stone-50"
                >
                  <option value="到店自取 (復興店)">到店自取 (復興店)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">預約取貨日 *</label>
                  {/* 🌟 修改點：加入了 onChange={(e) => handleDateChange(e)} 來攔截特定星期 */}
                  <input
                    type="date"
                    min={minDate}
                    value={pickupDate}
                    onChange={handleDateChange}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">取貨時間 *</label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
                    required
                  >
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
                    <option value="00:00">00:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">備註說明</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="如有特殊需求請註明"
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-amber-900 transition disabled:bg-stone-300 mt-2 shadow-sm"
              >
                {submitting ? '送出預約中...' : '送出麵包預約單'}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* 全螢幕圖片放大燈箱 Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white bg-white/20 hover:bg-white/40 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="商品圖片放大"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}