import React from 'react';
import { Order } from '../../types';
import Pagination from './Pagination';

interface OrdersViewProps {
  orders: Order[];
  token: string;
  onUpdate: () => void;
  loading: boolean;
  pagination: { page: number; total: number; limit: number };
  onPageChange: (page: number) => void;
}

export default function OrdersView({ orders, token, onUpdate, loading, pagination, onPageChange }: OrdersViewProps) {
  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) onUpdate();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-border border-t-brand-light rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-white/5 rounded-3xl border border-brand-border shadow-sm overflow-hidden">
      {/* Mobile Grid/Card View */}
      <div className="block md:hidden divide-y divide-brand-border">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-brand-muted">Заказы не найдены.</div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-light block">#{order.id.toString().padStart(6, '0')}</span>
                  <p className="text-xs text-brand-muted mt-0.5">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-brand-accent font-mono block">{order.total} BYN</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${
                    order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {order.status === 'New' ? 'Новый' :
                     order.status === 'Processing' ? 'В обработке' :
                     order.status === 'Shipped' ? 'Отправлен' :
                     order.status === 'Delivered' ? 'Доставлен' :
                     order.status === 'Cancelled' ? 'Отменен' : order.status}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white/[0.02] border border-brand-border/40 rounded-xl space-y-1">
                <p className="text-xs font-medium text-brand-light truncate">{order.customerName}</p>
                <p className="text-[10px] text-brand-muted truncate">{order.customerEmail}</p>
                {order.items && order.items.length > 0 && (
                  <p className="text-[10px] text-brand-muted font-mono mt-1 border-t border-brand-border/20 pt-1">
                    {order.items.map((it: any) => `${it.brand} ${it.name} (${it.size}) x${it.quantity}`).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-brand-muted">Статус:</span>
                <select 
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as any)}
                  className="text-xs bg-black/40 text-brand-light border border-brand-border rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-accent"
                >
                  <option value="New" className="bg-brand-bg">Новый</option>
                  <option value="Processing" className="bg-brand-bg">В обработке</option>
                  <option value="Shipped" className="bg-brand-bg">Отправлен</option>
                  <option value="Delivered" className="bg-brand-bg">Доставлен</option>
                  <option value="Cancelled" className="bg-brand-bg">Отменен</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 border-b border-brand-border">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">ID заказа</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Клиент</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Сумма</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Статус</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-brand-light">#{order.id.toString().padStart(6, '0')}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-brand-light">{order.customerName}</div>
                  <div className="text-xs text-brand-muted">{order.customerEmail}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-brand-light">{order.total} BYN</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {order.status === 'New' ? 'Новый' :
                     order.status === 'Processing' ? 'В обработке' :
                     order.status === 'Shipped' ? 'Отправлен' :
                     order.status === 'Delivered' ? 'Доставлен' :
                     order.status === 'Cancelled' ? 'Отменен' : order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as any)}
                    className="text-xs bg-white/10 text-brand-light border-none rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="New" className="bg-brand-bg">Новый</option>
                    <option value="Processing" className="bg-brand-bg">В обработке</option>
                    <option value="Shipped" className="bg-brand-bg">Отправлен</option>
                    <option value="Delivered" className="bg-brand-bg">Доставлен</option>
                    <option value="Cancelled" className="bg-brand-bg">Отменен</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={pagination.page} 
        totalItems={pagination.total} 
        itemsPerPage={pagination.limit} 
        onPageChange={onPageChange} 
      />
    </div>
  );
}
