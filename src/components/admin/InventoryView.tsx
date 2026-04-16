import React, { useState } from 'react';
import { Product } from '../../types';
import { Search, Plus, Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductForm from './ProductForm';

interface InventoryViewProps {
  products: Product[];
  loading: boolean;
  token: string;
  onUpdate: () => void;
  onAuthError: () => void;
}

export default function InventoryView({ products, loading, token, onUpdate, onAuthError }: InventoryViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'>('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).sort();

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = filterBrand === 'all' || p.brand === filterBrand;
    return matchesSearch && matchesBrand;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name_asc': return a.name.localeCompare(b.name);
      case 'name_desc': return b.name.localeCompare(a.name);
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      default: return 0;
    }
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onUpdate();
      else if (res.status === 401) onAuthError();
    } catch (err) { console.error(err); }
  };

  if (isAdding || editingProduct) {
    return (
      <ProductForm 
        token={token}
        initialData={editingProduct}
        onSuccess={() => { setIsAdding(false); setEditingProduct(null); onUpdate(); }}
        onCancel={() => { setIsAdding(false); setEditingProduct(null); }}
        onAuthError={onAuthError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/5 p-4 rounded-2xl shadow-sm border border-brand-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Поиск товаров..." 
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-brand-border rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm text-brand-light placeholder:text-brand-muted"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={filterBrand}
            onChange={e => { setFilterBrand(e.target.value); setCurrentPage(1); }}
            className="flex-1 md:flex-none px-3 py-2 bg-transparent border border-brand-border rounded-xl text-sm outline-none text-brand-light"
          >
            <option value="all" className="bg-brand-bg">Все бренды</option>
            {uniqueBrands.map(brand => <option key={brand} value={brand} className="bg-brand-bg">{brand}</option>)}
          </select>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 md:flex-none px-4 py-2 bg-brand-accent text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-accent-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить товар</span>
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl shadow-sm border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Товар</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Бренд</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Цена</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">Остаток</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-muted text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-brand-muted"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Загрузка...</td></tr>
              ) : paginatedProducts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-brand-muted">Товары не найдены.</td></tr>
              ) : (
                paginatedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/10" referrerPolicy="no-referrer" />
                        <div className="font-medium text-brand-light">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-muted">{product.brand}</td>
                    <td className="px-6 py-4 font-medium text-brand-light">{product.price} BYN</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (product.variants?.reduce((acc: number, v: any) => acc + v.stock, 0) || 0) <= product.stockThreshold
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {product.variants?.reduce((acc: number, v: any) => acc + v.stock, 0) || 0} в наличии
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingProduct(product)} className="p-2 text-brand-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-brand-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white/5 border-t border-brand-border flex items-center justify-between">
            <div className="text-sm text-brand-muted">Страница {currentPage} из {totalPages}</div>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 text-brand-light"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 text-brand-light"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
