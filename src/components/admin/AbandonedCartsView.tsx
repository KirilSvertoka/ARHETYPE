import React, { useState, useEffect } from 'react';
import { ShoppingCart, Mail, RefreshCw } from 'lucide-react';

interface AbandonedCartsViewProps {
  token: string;
}

export default function AbandonedCartsView({ token }: AbandonedCartsViewProps) {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCarts = async () => {
    try {
      const res = await fetch('/api/admin/abandoned-carts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch abandoned carts');
      const data = await res.json();
      setCarts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [token]);

  const handleSendReminder = async (email: string) => {
    // In a real app, this would trigger an email via backend
    alert(`Напоминание отправлено на ${email}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-brand-muted" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-brand-light">Брошенные корзины</h2>
        <button onClick={fetchCarts} className="p-2 text-brand-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white/5 rounded-3xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-light">
            <thead className="bg-white/5 text-xs uppercase text-brand-muted font-medium">
              <tr>
                <th className="px-6 py-4">Клиент</th>
                <th className="px-6 py-4">Товары</th>
                <th className="px-6 py-4">Сумма</th>
                <th className="px-6 py-4">Последняя активность</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {carts.map((cart) => {
                const total = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                return (
                  <tr key={cart.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {cart.userName ? (
                        <div>
                          <div className="font-medium">{cart.userName}</div>
                          <div className="text-xs text-brand-muted">{cart.userEmail}</div>
                        </div>
                      ) : (
                        <span className="text-brand-muted italic">Гость</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-brand-muted" />
                        <span>{cart.items.length} позиций</span>
                      </div>
                      <div className="text-xs text-brand-muted mt-1">
                        {cart.items.slice(0, 2).map((i: any) => i.name).join(', ')}
                        {cart.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{total.toFixed(2)} BYN</td>
                    <td className="px-6 py-4 text-brand-muted">
                      {new Date(cart.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cart.userEmail && (
                        <button 
                          onClick={() => handleSendReminder(cart.userEmail)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-light/10 text-brand-light rounded-lg hover:bg-brand-light/20 transition-colors ml-auto text-xs font-medium"
                        >
                          <Mail className="w-3 h-3" />
                          Напомнить
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {carts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-muted">
                    Брошенных корзин не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
