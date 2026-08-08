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
  display_order?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface LookedUpOrder {
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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('14:00');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 日期選擇行內錯誤訊息
  const [dateError, setDateError] = useState<string>('');

  // 訂單電話查詢 Modal State
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<LookedUpOrder[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // 計算「最早可預約日期」字串 (YYYY-MM-DD)
  const [minDate, setMinDate] = useState('');

  const parseLocalDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const isClosedDay = (dateStr: string): boolean => {
    const d = parseLocalDate(dateStr);
    if (!d) return false;
    const day = d.getDay();
    return day === 0 || day === 1;
  };

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 2);

    while (today.getDay() === 0 || today.getDay() === 1) {
      today.setDate(today.getDate() + 1);
    }

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
          .order('display_order', { ascending: true })
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

  const handleLookupOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone.trim()) {
      alert('請輸入電話號碼！');
      return;
    }

    setLookupLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', lookupPhone.trim())
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('id', { ascending: false });

      if (error) {
        alert(`查詢失敗：${error.message}`);
      } else {
        setLookupResults(data || []);
      }
    } catch (err: any) {
      alert(`查詢發生例外：${err.message}`);
    } finally {
      setLookupLoading(false);
    }
  };

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

  const productSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateDeliveryFee = (): number => {
    if (pickupType !== '宅配快遞' || cartItems.length === 0) return 0;

    let mooncakeBoxCount = 0;
    let breadAmount = 0;

    cartItems.forEach((item) => {
      if (item.name.includes('禮盒') || item.category.includes('禮盒')) {
        mooncakeBoxCount += item.quantity;
      } else {
        breadAmount += item.price * item.quantity;
      }
    });

    let mooncakeFee = 0;
    if (mooncakeBoxCount > 0) {
      if (mooncakeBoxCount >= 6) mooncakeFee = 0;
      else if (mooncakeBoxCount >= 3) mooncakeFee = 205;
      else mooncakeFee = 125;
    }

    let breadFee = 0;
    if (breadAmount > 0) {
      if (breadAmount > 1000) breadFee = 290;
      else if (breadAmount > 500) breadFee = 220;
      else breadFee = 160;
    }

    return mooncakeFee + breadFee;
  };

  const deliveryFee = calculateDeliveryFee();
  const totalPrice = productSubtotal + deliveryFee;

  const categorizedProducts = products.reduce<{ [category: string]: Product[] }>((acc, product) => {
    const cat = product.category || '未分類';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(product);
    return acc;
  }, {});

  // 🌟 核心調整：類別內部的商品依照 display_order 優先排序
  Object.keys(categorizedProducts).forEach((cat) => {
    categorizedProducts[cat].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.id - b.id;
    });
  });

  const sortedCategoryNames = Object.keys(categorizedProducts).sort((a, b) => {
    const isAPinned = pinnedCategories.includes(a);
    const isBPinned = pinnedCategories.includes(b);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0;
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setDateError('');

    if (!selectedDate) {
      setPickupDate('');
      return;
    }

    if (isClosedDay(selectedDate)) {
      setDateError('⚠️ 週日與週一為公休日，無法安排取貨／寄送，請改選其他日期！');
      setPickupDate('');
      return;
    }

    if (minDate && selectedDate < minDate) {
      setDateError(`⚠️ 需提前至少 2 天預訂，最早可預約日期為：${minDate}`);
      setPickupDate('');
      return;
    }

    setPickupDate(selectedDate);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('請至少選擇一項麵包商品！');
      return;
    }

    if (productSubtotal < 200) {
      alert('⚠️ 預訂金額未滿 200 元，無法送出預約！\n請直接至現場選購（12:00–13:00品項最齊全），或增加訂購數量。');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !pickupDate) {
      alert('請完整填寫姓名、電話與有效的預約取貨日期！');
      return;
    }

    if (pickupType === '宅配快遞' && !deliveryAddress.trim()) {
      alert('選擇宅配快遞時，請務必填寫宅配收件地址！');
      return;
    }

    if (isClosedDay(pickupDate)) {
      alert('⚠️ 週日與週一為公休日，無法安排取貨，請選擇其他日期！');
      return;
    }

    if (minDate && pickupDate < minDate) {
      alert(`⚠️ 預約失敗：取貨日需提前至少 2 天預訂！\n最早可預約日期為：${minDate}`);
      return;
    }

    setSubmitting(true);

    const selectedTime = pickupTime || '14:00';
    const fullPickupDateTime = `${pickupDate.trim()} ${selectedTime.trim()}`;

    const finalNote = pickupType === '宅配快遞'
      ? `【宅配地址】：${deliveryAddress.trim()}${note.trim() ? `\n【備註】：${note.trim()}` : ''}`
      : note.trim();

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
          note: finalNote,
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
            productSubtotal,
            deliveryFee,
            totalAmount: totalPrice,
            note: finalNote,
          }),
        }).catch((err) => console.error('推播失敗:', err));

        alert('🎉 預約單已成功送出！\n\n請點擊頁面上的【💬 聯繫 LINE 官方客服】按鈕，核對訂單並取得匯款帳號，完成付款後訂單才正式成立喔！');
        setCart({});
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryAddress('');
        setPickupDate('');
        setPickupTime('14:00');
        setNote('');
        setDateError('');
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
      <header className="-mx-3 -mt-3 sm:mx-auto sm:mt-0 max-w-5xl text-center mb-6 md:mb-10 flex flex-col items-center relative">
        <div className="w-full flex justify-end mb-2 px-3">
          <button
            onClick={() => {
              setShowLookupModal(true);
              setLookupResults(null);
            }}
            className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm flex items-center space-x-1.5 transition"
          >
            <span>🔍 查詢預約訂單</span>
          </button>
        </div>

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
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm text-stone-800 space-y-4">
            <h3 className="font-bold text-amber-950 text-base flex items-center border-b border-amber-200/60 pb-2">
              <span className="mr-1.5">📌</span> 預訂注意事項
            </h3>

            <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <div className="font-bold text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-center space-y-0.5">
                <p>🔸 不接受當日預訂</p>
                <p>🔸 當日請直接至現場購買</p>
              </div>

              <div className="space-y-1 pt-1">
                <p className="font-bold text-amber-950">
                  ▪ 消費滿 200 元，請於 2 天前完成預訂；付款完成後才算訂單成立。
                </p>
              </div>

              <div className="space-y-0.5">
                <p className="font-bold text-amber-950">▪ 預訂未滿 200 元，請直接至現場選購。</p>
                <p className="pl-3 text-stone-600 font-medium">（12:00–13:00 品項最齊全）</p>
              </div>

              {/* 宅配運費說明備註 */}
              <div className="bg-white/80 p-3 rounded-xl border border-amber-300/80 space-y-2">
                <p className="font-bold text-amber-950 flex items-center">
                  🚚 宅配運費說明：
                </p>
                
                <div className="space-y-1 pl-1">
                  <p className="font-bold text-amber-900">📦 麵包冷凍宅配運費：</p>
                  <ul className="pl-3 text-stone-600 space-y-0.5 text-[11px]">
                    <li>• 訂購金額 0～500 元……運費 160 元</li>
                    <li>• 訂購金額 501～1000 元……運費 220 元</li>
                    <li>• 訂購金額 1000～2000 元……運費 290 元</li>
                  </ul>
                </div>

                <div className="space-y-1 pl-1 pt-1 border-t border-amber-200/60">
                  <p className="font-bold text-amber-900">🥮 月餅禮盒宅配運費：</p>
                  <ul className="pl-3 text-stone-600 space-y-0.5 text-[11px]">
                    <li>• 2 盒以下……運費 125 元</li>
                    <li>• 3～5 盒……運費 205 元</li>
                    <li>• 6 盒以上……<span className="font-bold text-emerald-700">免運</span></li>
                  </ul>
                </div>
              </div>

              <div className="space-y-0.5 bg-amber-100/60 p-2 rounded-lg border border-amber-200/80">
                <p className="font-bold text-amber-900">
                  ▪ 訂單送出後，點擊客服，核對訂單並取得匯款帳號；付款完成後才算完成訂單。
                </p>
              </div>

              <hr className="border-amber-200/60 my-2" />

              <div className="space-y-1 text-[11px] text-stone-800">
                <p className="font-bold text-stone-900">⏰ 取餐時段：</p>
                <p className="pl-2">• 14:00–18:00 ｜ 櫃檯取餐</p>
                <p className="pl-2">• 18:00–00:00 ｜ 無人商店（冷藏保存）取餐</p>
              </div>
            </div>

            <a
              href="https://line.me/R/ti/p/@399mteem"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition transform active:scale-95"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186.521.648.763-.537 4.113-2.422 5.613-4.144 1.258-1.42 1.885-2.88 1.885-4.316zm-16.892 2.372h-2.001v-3.774c0-.284-.23-.514-.514-.514s-.514.23-.514.514v4.288c0 .284.23.514.514.514h2.515c.284 0 .514-.23.514-.514s-.23-.514-.514-.514zm3.016 0h-1.028v-3.774c0-.284-.23-.514-.514-.514s-.514.23-.514.514v4.288c0 .284.23.514.514.514h1.542c.284 0 .514-.23.514-.514s-.23-.514-.514-.514zm3.83 0h-1.398l-1.528-2.222v2.222c0 .284-.23-.514-.514-.514s-.23-.514-.514-.514v-4.288c0-.284.23-.514.514-.514h1.398l1.528 2.222v-2.222c0-.284.23-.514.514-.514s.514.23.514.514v4.288c0 .284-.23-.514-.514.514zm4.116-2.746h-1.543v.715h1.543c.284 0 .514.23.514.514s-.23.514-.514.514h-1.543v.988h1.543c.284 0 .514.23.514.514s-.23.514-.514.514h-2.057c-.284 0-.514-.23-.514-.514v-4.288c0-.284.23-.514.514-.514h2.057c.284 0 .514.23.514.514s-.23.514-.514.514z" />
              </svg>
              <span>點擊加入 LINE 官方客服對談</span>
            </a>
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

                <div className="pt-3 space-y-1">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>商品小計：</span>
                    <span>${productSubtotal} 元</span>
                  </div>
                  {pickupType === '宅配快遞' && (
                    <div className="flex justify-between text-xs text-amber-900 font-medium">
                      <span>🚚 宅配運費：</span>
                      <span>+${deliveryFee} 元</span>
                    </div>
                  )}
                  <div className="pt-2 flex justify-between font-bold text-sm sm:text-base text-amber-950 border-t border-stone-200">
                    <span>總計金額：</span>
                    <span>${totalPrice} 元</span>
                  </div>
                </div>
              </div>
            )}

            {productSubtotal > 0 && productSubtotal < 200 && (
              <div className="bg-rose-50 text-rose-700 text-xs p-2.5 rounded-lg border border-rose-200 mb-3 font-medium">
                ⚠️ 預訂金額未滿 200 元（目前 ${productSubtotal} 元），無法線上預約，請至現場購買或加購商品。
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
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs sm:text-sm bg-white"
                >
                  <option value="到店自取 (復興店)">到店自取 (復興店)</option>
                  <option value="宅配快遞">宅配快遞</option>
                </select>
              </div>

              {pickupType === '宅配快遞' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-medium text-amber-900 mb-1">
                    🚚 宅配收件地址 *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="請輸入完整的縣市、區域與街道門牌"
                    className="w-full p-2 border border-amber-400 rounded-lg text-xs sm:text-sm bg-amber-50/50 focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {pickupType === '宅配快遞' ? '預計寄送日 *' : '預約取貨日 *'}
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={pickupDate}
                    onChange={handleDateChange}
                    className={`w-full p-2 border rounded-lg text-xs sm:text-sm bg-white ${
                      dateError ? 'border-rose-500 bg-rose-50' : 'border-stone-300'
                    }`}
                    required
                  />
                  {dateError && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 bg-rose-50 p-1.5 rounded border border-rose-200">
                      {dateError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    {pickupType === '宅配快遞' ? '希望送達時間 *' : '取貨時間 *'}
                  </label>
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
                disabled={submitting || cartItems.length === 0 || productSubtotal < 200 || !pickupDate}
                className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold text-xs sm:text-sm hover:bg-amber-900 transition disabled:bg-stone-300 mt-2 shadow-sm"
              >
                {submitting ? '送出預約中...' : '送出麵包預約單'}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* 電話查詢預約訂單彈窗 Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-bold text-amber-950 text-base flex items-center">
                <span>🔍 查詢您的預約訂單</span>
              </h3>
              <button
                onClick={() => setShowLookupModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLookupOrders} className="flex gap-2 mb-4">
              <input
                type="tel"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="請輸入訂購時留的電話號碼"
                className="flex-1 p-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-hidden focus:border-amber-700"
                required
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition disabled:bg-stone-300"
              >
                {lookupLoading ? '查詢中...' : '查詢'}
              </button>
            </form>

            {/* 查詢結果列表 */}
            {lookupResults !== null && (
              <div className="space-y-3 pt-2">
                {lookupResults.length === 0 ? (
                  <p className="text-center text-stone-500 text-xs py-6 bg-stone-50 rounded-xl border border-stone-200">
                    查無電話相符的預約紀錄，請確認電話是否正確！
                  </p>
                ) : (
                  lookupResults.map((order) => {
                    const isShipped = order.status === 'completed' || order.status === '已確認訂單' || order.status === '已出貨';
                    const isDelivery = order.pickup_type === '宅配快遞';

                    return (
                      <div
                        key={order.id}
                        className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start border-b border-stone-200 pb-2">
                          <div>
                            <span className="font-bold text-amber-950 text-sm">
                              #{order.id} {order.customer_name}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDelivery
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isDelivery ? '🚚 宅配快遞' : '🏪 到店自取'}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                              isShipped
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isShipped ? '✅ 已確認訂單' : '⏳ 處理中'}
                          </span>
                        </div>

                        <p className="text-stone-700">
                          <strong>⏰ 預約時間：</strong>
                          <span className="font-bold text-amber-950">{order.pickup_date}</span>
                        </p>

                        {order.note && (
                          <div className="bg-white p-2 rounded-lg border border-stone-200 text-stone-600 whitespace-pre-line">
                            <strong>備註 / 地址：</strong> {order.note}
                          </div>
                        )}

                        <div className="pt-1">
                          <p className="font-bold text-stone-800 mb-1">🛒 訂購內容：</p>
                          <ul className="space-y-0.5 text-stone-600 pl-2">
                            {order.items?.map((item: any, idx: number) => (
                              <li key={idx}>
                                • {item.name} x {item.quantity} (${item.price * item.quantity}元)
                              </li>
                            ))}
                          </ul>
                          <div className="text-right font-bold text-amber-950 text-sm mt-2 border-t pt-1">
                            總計：${order.total_amount} 元
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

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