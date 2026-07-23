'use client';

// 強制 Next.js 將此頁面視為動態渲染，防止 npm run build 時因 Supabase 靜態預擷取失敗而報錯
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ... (其餘原本的 app/page.tsx 程式碼保持不變)
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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupType, setPickupType] = useState('自取');
  const [pickupDate, setPickupDate] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 圖片上傳狀態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('id');

    if (error) {
      console.error('讀取商品失敗:', error);
    } else if (data) {
      setProducts(data);
    }
  };

  // 數量加減按鈕控制
  const updateQuantity = (productId: number, delta: number, maxStock: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const updated = Math.min(maxStock, Math.max(0, current + delta));
      return { ...prev, [productId]: updated };
    });
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);
  };

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

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `customer-uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(filePath, file);

      if (uploadError) return null;

      const { data } = supabase.storage
        .from('order-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderItems = products
      .filter((p) => cart[p.id] > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: cart[p.id],
      }));

    if (orderItems.length === 0) {
      alert('請至少選擇一項美味麵包！');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = '';
      if (selectedFile) {
        const url = await uploadImageToSupabase(selectedFile);
        if (url) {
          uploadedImageUrl = url;
        } else {
          alert('參考照片上傳失敗，請重試！');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          pickupType,
          pickupDate,
          items: orderItems,
          totalAmount: calculateTotal(),
          customerImageUrl: uploadedImageUrl,
          note,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert('🎉 訂單提交成功！threedays 感謝您的預約。');
        setCart({});
        setCustomerName('');
        setCustomerPhone('');
        setPickupDate('');
        setNote('');
        setSelectedFile(null);
        setImagePreview(null);
        fetchProducts();
      } else {
        alert(`訂單失敗：${result.error}`);
      }
    } catch (error) {
      alert('系統發生錯誤，請稍後再試！');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans pb-16">
      {/* 頂部質感 Hero Banner */}
      <header className="relative bg-amber-900 text-amber-50 py-12 px-4 sm:px-6 text-center shadow-inner overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 bg-amber-800/80 text-amber-200 text-xs tracking-widest rounded-full uppercase mb-3 border border-amber-700/50">
            Handcrafted Bakery
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-amber-100 drop-shadow-sm">
            threedays 麵包店
          </h1>
          <p className="text-amber-200/90 mt-3 text-sm sm:text-base font-light tracking-wide">
            每日限量新鮮出爐 ‧ 預約專屬手作美味
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {/* 產品展示區 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 border-b border-stone-200/80 pb-3">
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <span>🥖</span> 今日烘焙選單
            </h2>
            <span className="text-xs text-stone-500 font-medium">
              點擊「+」加入購物車
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const currentQty = cart[p.id] || 0;
              const isSoldOut = p.stock === 0;

              return (
                <div
                  key={p.id}
                  className="group bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* 麵包圖片區塊 */}
                    <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
                          🥐 暫無照片
                        </div>
                      )}

                      {/* 庫存狀態 Badge */}
                      <div className="absolute top-3 right-3">
                        {isSoldOut ? (
                          <span className="bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                            已售完
                          </span>
                        ) : p.stock <= 5 ? (
                          <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                            剩 {p.stock} 個
                          </span>
                        ) : (
                          <span className="bg-amber-800/90 text-amber-100 text-xs font-medium px-2.5 py-1 rounded-full shadow">
                            限量供應
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 麵包簡介 */}
                    <div className="p-5">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-lg text-stone-900 group-hover:text-amber-900 transition-colors">
                          {p.name}
                        </h3>
                        <span className="text-amber-900 font-extrabold text-xl">
                          ${p.price}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                        {p.description || '選用優質食材，每日新鮮現做。'}
                      </p>
                    </div>
                  </div>

                  {/* 數量調整按鈕列 */}
                  <div className="p-5 pt-0 mt-2">
                    <div className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-100">
                      <span className="text-xs text-stone-500 font-medium ml-2">
                        選購數量
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, -1, p.stock)}
                          disabled={currentQty === 0 || isSoldOut}
                          className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-stone-700 hover:bg-stone-100 active:scale-95 disabled:opacity-40 disabled:hover:bg-white transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-extrabold text-stone-900 text-sm">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, 1, p.stock)}
                          disabled={currentQty >= p.stock || isSoldOut}
                          className="w-8 h-8 rounded-lg bg-amber-800 text-amber-50 flex items-center justify-center font-bold hover:bg-amber-900 active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-800 transition shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 顧客資料與結帳表單 */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-stone-100">
          <div className="border-b border-stone-100 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <span>📋</span> 填寫預約訂購單
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              請完整填寫聯絡資料，以便為您保留熱騰騰的麵包
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  訂購人姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="請輸入姓名"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  連絡電話 <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="例: 0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  取貨方式 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pickupType}
                  onChange={(e) => setPickupType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 focus:outline-none transition"
                >
                  <option value="自取">🏪 門市自取</option>
                  <option value="宅配">🚚 低溫宅配</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  取貨 / 到貨日期 <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 focus:outline-none transition"
                />
              </div>

              {/* 圖片上傳區塊 */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  參考照片 / 付款證明 (選填，上限 5MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100/70 file:text-amber-900 hover:file:bg-amber-200/70 cursor-pointer border border-stone-200 rounded-xl bg-stone-50 p-1"
                />
                {imagePreview && (
                  <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-800/30 shadow-sm">
                    <img src={imagePreview} alt="預覽" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                      className="absolute top-1 right-1 bg-stone-900/80 text-white rounded-full p-1 text-xs hover:bg-stone-900"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 結帳列 */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-stone-100 pt-6 gap-4 mt-8">
              <div>
                <span className="text-xs text-stone-400 block sm:inline mr-2">
                  共選購 {totalItemCount} 個麵包，總金額：
                </span>
                <span className="text-3xl font-black text-amber-900">
                  ${calculateTotal()} <span className="text-sm font-normal text-stone-500">元</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || totalItemCount === 0}
                className="w-full sm:w-auto bg-amber-800 text-amber-50 font-bold px-10 py-3.5 rounded-2xl hover:bg-amber-900 active:scale-98 transition-all shadow-md disabled:bg-stone-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isSubmitting ? '預約處理中...' : '確認送出預約單'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}