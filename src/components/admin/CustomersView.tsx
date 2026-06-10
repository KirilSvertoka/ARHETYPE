import React from 'react';
import { User } from '../../types';
import Pagination from './Pagination';

interface CustomersViewProps {
  users: User[];
  loading: boolean;
  pagination: { page: number; total: number; limit: number };
  onPageChange: (page: number) => void;
}

export default function CustomersView({ users, loading, pagination, onPageChange }: CustomersViewProps) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-border border-t-brand-light rounded-full animate-spin"></div></div>;

  return (
    <div className="bg-white/5 rounded-3xl border border-brand-border shadow-sm overflow-hidden">
      {/* Mobile Grid/Card View */}
      <div className="block md:hidden divide-y divide-brand-border">
        {users.length === 0 ? (
          <div className="p-8 text-center text-brand-muted">Клиенты не найдены.</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="p-4 space-y-2.5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="font-semibold text-brand-light text-sm">{user.name}</h4>
                  <p className="text-xs text-brand-muted">{user.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                  user.loyaltyStatus === 'VIP' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/15' :
                  user.loyaltyStatus === 'Premium' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/15' :
                  'bg-brand-light/10 text-brand-muted border border-brand-border'
                }`}>
                  {user.loyaltyStatus || 'Regular'}
                </span>
              </div>

              {user.notes && (
                <div className="p-2.5 bg-black/25 text-xs text-brand-muted italic rounded-xl border border-brand-border/40">
                  "{user.notes}"
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-white/[0.02] border border-brand-border/40 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-brand-muted block">Заказы</span>
                  <span className="text-sm font-bold text-brand-light">{user.orderCount || 0}</span>
                </div>
                <div className="p-2 bg-white/[0.02] border border-brand-border/40 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-brand-muted block">LTV</span>
                  <span className="text-sm font-bold text-brand-light font-mono text-[11px] truncate block">{user.ltv?.toFixed(1) || '0.0'} BYN</span>
                </div>
                <div className="p-2 bg-white/[0.02] border border-brand-border/40 rounded-xl">
                  <span className="text-[9px] font-mono uppercase text-brand-muted block">Ср. Чек</span>
                  <span className="text-sm font-bold text-brand-light font-mono text-[11px] truncate block">{user.avgOrderValue?.toFixed(1) || '0.0'} BYN</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-brand-muted pt-1">
                <span>Регистрация:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
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
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Клиент</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Статус</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Заказы</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">LTV</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Ср. чек</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted text-right">Регистрация</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-brand-light">{user.name}</div>
                  <div className="text-xs text-brand-muted">{user.email}</div>
                  {user.notes && <div className="text-xs text-brand-muted mt-1 italic">"{user.notes}"</div>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    user.loyaltyStatus === 'VIP' ? 'bg-amber-500/20 text-amber-400' :
                    user.loyaltyStatus === 'Premium' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-brand-light/10 text-brand-light'
                  }`}>
                    {user.loyaltyStatus || 'Regular'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-brand-light">{user.orderCount || 0}</td>
                <td className="px-6 py-4 text-sm font-medium text-brand-light">{user.ltv?.toFixed(2) || '0.00'} BYN</td>
                <td className="px-6 py-4 text-sm text-brand-light">{user.avgOrderValue?.toFixed(2) || '0.00'} BYN</td>
                <td className="px-6 py-4 text-right text-xs text-brand-muted">
                  {new Date(user.createdAt).toLocaleDateString()}
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
