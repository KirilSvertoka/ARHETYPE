import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingBag, CheckCircle2, ArrowLeft, RefreshCw, CreditCard, Truck, MapPin, Search, ChevronDown } from 'lucide-react';
import { useCart } from './CartProvider';
import { useLanguage } from './LanguageProvider';
import { getVariantType } from '../types';
import { europostOffices } from '../data/europostOffices';
import { belpostOffices } from '../data/belpostOffices';
import { trackBeginCheckout, trackPurchase } from '../utils/analytics';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, total, clearCart, justAdded } = useCart();
  const { t, language } = useLanguage();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    if (isCheckingOut && !isSuccess) {
      trackBeginCheckout(items, total);
    }
  }, [isCheckingOut, isSuccess]);
  const [customerData, setCustomerData] = useState({ 
    name: '', 
    phone: '',
    city: '',
    deliveryMethod: 'europost',
    address: '',
    comment: ''
  });
  const [officeSearch, setOfficeSearch] = useState('');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOfficeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCustomerData(prev => ({ ...prev, address: '' }));
    setOfficeSearch('');
  }, [customerData.deliveryMethod]);

  const filteredOffices = (customerData.deliveryMethod === 'europost' ? europostOffices : belpostOffices).filter(office => {
    const matchesCity = !customerData.city || office.city.toLowerCase().includes(customerData.city.toLowerCase());
    const matchesSearch = !officeSearch || 
      office.address.toLowerCase().includes(officeSearch.toLowerCase()) || 
      office.department.toLowerCase().includes(officeSearch.toLowerCase()) ||
      office.city.toLowerCase().includes(officeSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const orderId = params.get('order_id');

    if (checkoutStatus === 'success') {
      setIsCartOpen(true);
      setIsSuccess(true);
      clearCart();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkoutStatus === 'cancel') {
      setIsCartOpen(true);
      setIsCheckingOut(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setIsCartOpen, clearCart]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let deliveryMethodText = '';
    switch(customerData.deliveryMethod) {
      case 'europost': deliveryMethodText = 'Европочта'; break;
      case 'belpost': deliveryMethodText = 'Белпочта'; break;
      case 'courier_grodno': deliveryMethodText = 'Курьер по Гродно'; break;
    }

    const fullAddress = customerData.city ? `${customerData.city}, ${customerData.address}` : customerData.address;

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const orderPayload = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        delivery_method: deliveryMethodText,
        delivery_address: fullAddress,
        comment: customerData.comment,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          brand: item.brand,
          size: item.selectedVariantSize,
          selectedVariantId: item.selectedVariantId,
          selectedVariantSize: item.selectedVariantSize,
          imageUrl: item.imageUrl
        })),
        total
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const orderData = await res.json();
        const orderId = orderData.orderId || Date.now().toString();
        setIsSuccess(true);
        trackPurchase(orderId, orderPayload.items, total);
        clearCart();
      } else {
        const data = await res.json();
        alert(data.error || t('failedToSend'));
      }
    } catch (err) {
      console.error(err);
      alert(t('failedToSend'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDrawer = () => {
    setIsCartOpen(false);
    // Reset states after animation
    setTimeout(() => {
      setIsCheckingOut(false);
      setIsSuccess(false);
      setCustomerData({ name: '', phone: '', city: '', deliveryMethod: 'europost', address: '', comment: '' });
    }, 300);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-bg shadow-2xl z-50 flex flex-col border-l border-brand-border"
          >
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                {isCheckingOut && !isSuccess && (
                  <button 
                    onClick={() => setIsCheckingOut(false)}
                    className="p-2 -ml-2 text-brand-muted hover:text-brand-accent transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-2xl font-serif text-brand-light flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6" />
                  {isSuccess ? t('orderSuccess') : (isCheckingOut ? t('checkoutTitle') : t('cart'))}
                </h2>
              </div>
              <button onClick={closeDrawer} className="p-2 text-brand-muted hover:text-brand-accent transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-serif text-brand-light">{t('orderSuccess')}</h3>
                  <p className="text-brand-muted">{t('orderSuccessDesc')}</p>
                  <button 
                    onClick={closeDrawer}
                    className="mt-8 px-8 py-3 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors"
                  >
                    {t('backToCatalog')}
                  </button>
                </motion.div>
              ) : isCheckingOut ? (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8 pb-8">
                  {/* Контактные данные */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-brand-light border-b border-brand-border pb-2">1. Контактные данные</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wider text-brand-muted ml-1">{t('name')} *</label>
                        <input 
                          required
                          type="text" 
                          minLength={2}
                          maxLength={100}
                          value={customerData.name}
                          onChange={e => setCustomerData({...customerData, name: e.target.value})}
                          className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-brand-light placeholder:text-brand-muted/50 text-sm"
                          placeholder={t('placeholderName')}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wider text-brand-muted ml-1">{t('phoneNumber')} *</label>
                        <input 
                          required
                          type="tel" 
                          pattern="^(\+?[0-9\s\-\(\)]{7,20})$"
                          title="Введите корректный номер телефона"
                          value={customerData.phone}
                          onChange={e => setCustomerData({...customerData, phone: e.target.value})}
                          className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-brand-light placeholder:text-brand-muted/50 text-sm"
                          placeholder={t('placeholderPhone')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Доставка */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-brand-light border-b border-brand-border pb-2">2. Доставка</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wider text-brand-muted ml-1">Город / Населенный пункт *</label>
                        <input 
                          required
                          type="text" 
                          value={customerData.city}
                          onChange={e => setCustomerData({...customerData, city: e.target.value})}
                          className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-brand-light placeholder:text-brand-muted/50 text-sm"
                          placeholder="Гродно"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-medium uppercase tracking-wider text-brand-muted ml-1 mb-2 block">Способ доставки *</label>
                        <div className="space-y-2">
                          {[
                            { id: 'europost', label: 'Европочта (до отделения)' },
                            { id: 'belpost', label: 'Белпочта' },
                            { id: 'courier_grodno', label: 'Курьер по Гродно' }
                          ].map(method => (
                            <label key={method.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${customerData.deliveryMethod === method.id ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-hover hover:border-brand-accent/50'}`}>
                              <input 
                                type="radio" 
                                name="deliveryMethod" 
                                value={method.id}
                                checked={customerData.deliveryMethod === method.id}
                                onChange={e => {
                                  const newMethod = e.target.value;
                                  setCustomerData({
                                    ...customerData, 
                                    deliveryMethod: newMethod,
                                    city: newMethod === 'courier_grodno' ? 'Гродно' : customerData.city
                                  });
                                }}
                                className="w-4 h-4 text-brand-accent bg-brand-bg border-brand-border focus:ring-brand-accent focus:ring-offset-brand-bg"
                              />
                              <span className="ml-3 text-sm text-brand-light">{method.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2"
                      >
                          <label className="text-[10px] font-medium uppercase tracking-wider text-brand-muted ml-1">
                            {customerData.deliveryMethod === 'europost' ? 'Пункт выдачи Европочты *' : 
                             customerData.deliveryMethod === 'belpost' ? 'Отделение Белпочты *' : 'Адрес доставки *'}
                          </label>
                          
                          {(customerData.deliveryMethod === 'europost' || customerData.deliveryMethod === 'belpost') ? (
                            <div className="relative mt-1" ref={dropdownRef}>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                                <input 
                                  required
                                  type="text" 
                                  value={customerData.address}
                                  onChange={e => {
                                    setCustomerData({...customerData, address: e.target.value});
                                    setOfficeSearch(e.target.value);
                                    setShowOfficeDropdown(true);
                                  }}
                                  onFocus={() => setShowOfficeDropdown(true)}
                                  className="w-full pl-10 pr-10 py-3 bg-brand-hover border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-brand-light placeholder:text-brand-muted/50 text-sm"
                                  placeholder="Начните вводить адрес или номер отделения"
                                />
                                {customerData.address && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setCustomerData({...customerData, address: ''});
                                      setOfficeSearch('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-accent transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              
                              <AnimatePresence>
                                {showOfficeDropdown && filteredOffices.length > 0 && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-brand-bg border border-brand-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar"
                                  >
                                    {filteredOffices.map((office, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setCustomerData({
                                            ...customerData, 
                                            address: `${office.city}, ${office.address} (${office.department})`,
                                            city: office.city // Auto-fill city if selected from dropdown
                                          });
                                          setOfficeSearch('');
                                          setShowOfficeDropdown(false);
                                        }}
                                        className="w-full text-left p-4 hover:bg-brand-hover transition-colors border-b border-brand-border last:border-0"
                                      >
                                        <p className="text-sm font-medium text-brand-light">{office.city}, {office.address}</p>
                                        <p className="text-xs text-brand-accent mt-1">{office.department}</p>
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              {showOfficeDropdown && filteredOffices.length === 0 && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute left-0 right-0 top-full mt-2 p-4 bg-brand-bg border border-brand-border rounded-xl shadow-2xl z-50 text-center"
                                >
                                  <p className="text-sm text-brand-muted">Отделения не найдены</p>
                                  {customerData.city && (
                                    <p className="text-xs text-brand-accent mt-1">Попробуйте изменить город или очистить поиск</p>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          ) : (
                            <input 
                              required
                              type="text" 
                              value={customerData.address}
                              onChange={e => setCustomerData({...customerData, address: e.target.value})}
                              className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-brand-light placeholder:text-brand-muted/50 text-sm mt-1"
                              placeholder={customerData.deliveryMethod === 'courier_grodno' ? 'ул. Ленина, д. 1, кв. 1' : 'Отделение №123 или полный адрес'}
                            />
                          )}
                        </motion.div>
                    </div>
                  </div>

                  {/* Оплата */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-brand-light border-b border-brand-border pb-2">3. Оплата</h3>
                    <div className="bg-brand-hover border border-brand-border rounded-xl p-4 flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-brand-light">Оплата при получении</p>
                        <p className="text-xs text-brand-muted mt-1">Оплата производится наличными или картой при получении заказа.</p>
                      </div>
                    </div>
                  </div>

                  {/* Комментарий */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-brand-light border-b border-brand-border pb-2">4. Комментарий к заказу</h3>
                    <textarea 
                      rows={3}
                      value={customerData.comment}
                      onChange={e => setCustomerData({...customerData, comment: e.target.value})}
                      className="w-full px-4 py-3 bg-brand-hover border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent outline-none text-brand-light placeholder:text-brand-muted/50 text-sm resize-none"
                      placeholder="Дополнительная информация (необязательно)"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {items.length === 0 ? (
                    <div className="text-center text-brand-muted mt-12">
                      {t('emptyCart')}
                    </div>
                  ) : (
                    items.map(item => {
                      const cartItemId = item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : `${item.id}`;
                      return (
                        <div key={cartItemId} className="flex gap-4">
                          <img src={item.imageUrl} alt={item.name} className="w-20 h-24 object-cover rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-brand-light">{item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-brand-muted">{item.brand}</p>
                                {item.selectedVariantSize && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-brand-muted rounded uppercase tracking-wider font-medium">
                                    {getVariantType(item.selectedVariantSize, language)} {item.selectedVariantSize}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center gap-3 border border-brand-border rounded-lg px-2 py-1">
                                <button onClick={() => updateQuantity(cartItemId, item.quantity - 1)} className="text-brand-muted hover:text-brand-accent"><Minus className="w-4 h-4" /></button>
                                <span className="text-sm font-medium text-brand-light w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(cartItemId, item.quantity + 1)} className="text-brand-muted hover:text-brand-accent"><Plus className="w-4 h-4" /></button>
                              </div>
                              <span className="font-medium text-brand-light">{item.price.toFixed(2)} {t('currency')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {items.length > 0 && !isSuccess && (
              <div className="p-6 border-t border-brand-border bg-brand-bg/95 backdrop-blur-sm shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-brand-muted">{t('total')}</span>
                  <span className="text-2xl font-serif text-brand-light">{total.toFixed(2)} {t('currency')}</span>
                </div>
                {isCheckingOut ? (
                  <button 
                    form="checkout-form"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-brand-accent text-white rounded-xl font-medium uppercase tracking-widest hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Подтвердить заказ'}
                  </button>
                ) : (
                  <motion.button 
                    onClick={() => setIsCheckingOut(true)}
                    animate={justAdded ? { scale: [1, 1.05, 1], transition: { repeat: 3, duration: 0.5 } } : {}}
                    className="w-full py-4 bg-brand-accent text-white rounded-xl font-medium uppercase tracking-widest hover:bg-brand-accent-hover transition-colors"
                  >
                    {t('checkout')}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
