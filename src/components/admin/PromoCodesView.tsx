import React, { useState, useEffect } from 'react';
import { PromoCode } from '../../types';
import { Plus, Trash2, Edit2, RefreshCw, Tag } from 'lucide-react';

interface PromoCodesViewProps {
  token: string;
}

export default function PromoCodesView({ token }: PromoCodesViewProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    status: 'Active'
  });

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/promo-codes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch promo codes');
      const data = await res.json();
      setPromoCodes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/promo-codes/${editingId}` : '/api/promo-codes';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        usageLimit: parseInt(formData.usageLimit) || 0
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save promo code');
      
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({
        code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '',
        validFrom: '', validUntil: '', usageLimit: '', status: 'Active'
      });
      fetchPromoCodes();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить промокод?')) return;
    try {
      const res = await fetch(`/api/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPromoCodes();
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleEdit = (code: PromoCode) => {
    setFormData({
      code: code.code,
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      minOrderAmount: code.minOrderAmount?.toString() || '',
      validFrom: code.validFrom ? new Date(code.validFrom).toISOString().slice(0, 16) : '',
      validUntil: code.validUntil ? new Date(code.validUntil).toISOString().slice(0, 16) : '',
      usageLimit: code.usageLimit?.toString() || '',
      status: code.status
    });
    setEditingId(code.id);
    setIsFormOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin text-brand-muted" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-brand-light">Промокоды</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '',
              validFrom: '', validUntil: '', usageLimit: '', status: 'Active'
            });
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-xl hover:bg-brand-accent-hover transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Создать промокод
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white/5 p-6 rounded-3xl border border-brand-border">
          <h3 className="text-lg font-serif text-brand-light mb-6">{editingId ? 'Редактировать' : 'Новый промокод'}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Код</label>
                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted uppercase" placeholder="SUMMER2026" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Тип скидки</label>
                <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light">
                  <option value="percentage" className="bg-brand-bg">Процент (%)</option>
                  <option value="fixed" className="bg-brand-bg">Фиксированная сумма (BYN)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Значение скидки</label>
                <input required type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted" placeholder="15" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Мин. сумма заказа (BYN)</label>
                <input type="number" step="0.01" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted" placeholder="100" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Действует с</label>
                <input type="datetime-local" value={formData.validFrom} onChange={e => setFormData({...formData, validFrom: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Действует до</label>
                <input type="datetime-local" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Лимит использований</label>
                <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted" placeholder="0 = без лимита" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Статус</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light">
                  <option value="Active" className="bg-brand-bg">Активен</option>
                  <option value="Inactive" className="bg-brand-bg">Неактивен</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 border border-brand-border text-brand-light rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Отмена</button>
              <button type="submit" className="px-6 py-2 bg-brand-accent text-white rounded-xl hover:bg-brand-accent-hover transition-colors text-sm font-medium">Сохранить</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/5 rounded-3xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-light">
            <thead className="bg-white/5 text-xs uppercase text-brand-muted font-medium">
              <tr>
                <th className="px-6 py-4">Код</th>
                <th className="px-6 py-4">Скидка</th>
                <th className="px-6 py-4">Мин. заказ</th>
                <th className="px-6 py-4">Срок действия</th>
                <th className="px-6 py-4">Использования</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {promoCodes.map((code) => (
                <tr key={code.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold">{code.code}</td>
                  <td className="px-6 py-4">
                    {code.discountType === 'percentage' ? `${code.discountValue}%` : `${code.discountValue} BYN`}
                  </td>
                  <td className="px-6 py-4">{code.minOrderAmount ? `${code.minOrderAmount} BYN` : '—'}</td>
                  <td className="px-6 py-4 text-brand-muted text-xs">
                    {code.validFrom ? new Date(code.validFrom).toLocaleDateString() : '—'}
                    {' - '}
                    {code.validUntil ? new Date(code.validUntil).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {code.usedCount} / {code.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                      code.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {code.status === 'Active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(code)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-muted hover:text-brand-light">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(code.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-brand-muted hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-brand-muted">
                    Промокоды не найдены
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
