import React, { useState, useEffect, useRef } from 'react';
import { Product, Note, ProductVariant } from '../../types';
import { UploadCloud, RefreshCw, Plus, Trash2, Image as ImageIcon, Tag, Layers } from 'lucide-react';
import NoteBuilder from './NoteBuilder';

interface ProductFormProps {
  token: string;
  initialData?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
  onAuthError: () => void;
}

interface ImageDropzoneProps {
  key?: React.Key;
  currentUrl: string;
  onUpload: (files: FileList | File[]) => void | Promise<void>;
  label: string;
  onRemove?: () => void;
  isMain?: boolean;
  onUrlChange?: (url: string) => void;
  multiple?: boolean;
}

const ImageDropzone = ({ 
  currentUrl, 
  onUpload, 
  label, 
  onRemove,
  isMain = false,
  onUrlChange,
  multiple = false
}: ImageDropzoneProps) => {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase text-brand-muted ml-1">{label}</label>
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-3 p-4 min-h-[120px] ${
          isOver ? 'border-brand-light bg-white/10' : 'border-brand-border hover:border-brand-muted'
        }`}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*"
          multiple={multiple}
          onChange={(e) => e.target.files?.length && onUpload(e.target.files)}
        />
        
        {currentUrl ? (
          <div className="relative w-full aspect-square max-h-[150px] rounded-xl overflow-hidden">
            <img src={currentUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-white" />
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-brand-muted" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-brand-light">Нажмите или перетащите</p>
              <p className="text-[10px] text-brand-muted mt-1">PNG, JPG до 5MB</p>
            </div>
          </>
        )}

        {!isMain && onRemove && (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <input 
        type="text" 
        value={currentUrl} 
        onChange={e => onUrlChange?.(e.target.value)}
        className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-[10px] font-mono text-brand-light placeholder:text-brand-muted" 
        placeholder="Или вставьте URL..." 
      />
    </div>
  );
};

export default function ProductForm({ token, initialData, onSuccess, onCancel, onAuthError }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    description: initialData?.description || '',
    description_be: initialData?.description_be || '',
    imageUrl: initialData?.imageUrl || '',
    images: initialData?.images || [],
    price: initialData?.price?.toString() || '',
    gender: initialData?.gender || 'Unisex',
    concentration: initialData?.concentration || 'EDP',
    stockThreshold: initialData?.stockThreshold?.toString() || '10',
    topNotes: initialData?.topNotes || [],
    heartNotes: initialData?.heartNotes || [],
    baseNotes: initialData?.baseNotes || [],
    accords: initialData?.accords || [],
    longevity: initialData?.longevity?.toString() || '70',
    sillage: initialData?.sillage?.toString() || '60',
    scentFamilies: initialData?.scentFamilies || [],
    scentFamilies_be: initialData?.scentFamilies_be || [],
    tags: initialData?.tags?.join(', ') || '',
    tags_be: initialData?.tags_be?.join(', ') || '',
    season: initialData?.season?.join(', ') || '',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    variants: initialData?.variants || []
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = async (files: FileList | File[], targetField: 'imageUrl' | 'gallery' | number) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`Файл ${file.name} не является изображением`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Файл ${file.name} слишком большой (макс. 5МБ)`);
        }

        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataUpload
        });

        if (!res.ok) throw new Error(`Ошибка при загрузке ${file.name}`);
        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      
      if (targetField === 'imageUrl') {
        setFormData(prev => ({ ...prev, imageUrl: urls[0] }));
      } else if (targetField === 'gallery') {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      } else {
        setFormData(prev => {
          const newImages = [...prev.images];
          newImages[targetField as number] = urls[0];
          return { ...prev, images: newImages };
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      productId: initialData?.id || 0,
      size: '',
      price: parseFloat(formData.price) || 0,
      stock: 0,
      sku: ''
    };
    setFormData(prev => ({ ...prev, variants: [...prev.variants, newVariant] }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      stockThreshold: parseInt(formData.stockThreshold),
      topNotes: formData.topNotes,
      heartNotes: formData.heartNotes,
      baseNotes: formData.baseNotes,
      accords: formData.accords,
      longevity: parseInt(formData.longevity),
      sillage: parseInt(formData.sillage),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      tags_be: formData.tags_be.split(',').map(t => t.trim()).filter(t => t !== ''),
      season: formData.season.split(',').map(t => t.trim()).filter(t => t !== ''),
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
      variants: formData.variants.map(v => ({
        ...v,
        price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
        stock: typeof v.stock === 'string' ? parseInt(v.stock) : v.stock
      }))
    };

    try {
      const url = initialData ? `/api/products/${initialData.id}` : '/api/products';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          throw new Error('Сессия истекла');
        }
        throw new Error(initialData ? 'Не удалось обновить товар' : 'Не удалось создать товар');
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <h2 className="text-xl font-serif text-brand-light">{initialData ? 'Редактировать аромат' : 'Новый аромат'}</h2>
        <button type="button" onClick={onCancel} className="text-sm text-brand-muted hover:text-brand-light">Отмена</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Название товара</label>
            <input required type="text" minLength={2} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="напр. Santal 33" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Бренд</label>
            <input required type="text" minLength={2} value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="напр. Le Labo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Базовая цена (BYN)</label>
              <input required type="number" min="0.01" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="320.00" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Порог остатка</label>
              <input required type="number" min="0" value={formData.stockThreshold} onChange={e => setFormData({...formData, stockThreshold: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Пол</label>
              <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light appearance-none">
                <option value="Unisex" className="bg-brand-bg">Унисекс</option>
                <option value="Male" className="bg-brand-bg">Мужской</option>
                <option value="Female" className="bg-brand-bg">Женский</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Концентрация</label>
              <select required value={formData.concentration} onChange={e => setFormData({...formData, concentration: e.target.value as any})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light appearance-none">
                <option value="EDP" className="bg-brand-bg">Парфюмерная вода (EDP)</option>
                <option value="EDT" className="bg-brand-bg">Туалетная вода (EDT)</option>
                <option value="Parfum" className="bg-brand-bg">Духи (Parfum)</option>
                <option value="Cologne" className="bg-brand-bg">Одеколон (Cologne)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Изображения товара</label>
            <div className="flex gap-2">
              {uploading && <RefreshCw className="w-3 h-3 animate-spin text-brand-muted" />}
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: [...prev.images, ''] }))} className="text-xs font-medium text-brand-light flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Добавить поле
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <ImageDropzone 
              label="Главное изображение"
              currentUrl={formData.imageUrl}
              onUpload={(files) => handleFilesUpload(files, 'imageUrl')}
              onUrlChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              isMain={true}
            />

            <ImageDropzone 
              label="Загрузить в галерею (оптом)"
              currentUrl=""
              multiple={true}
              onUpload={(files) => handleFilesUpload(files, 'gallery')}
            />

            {formData.images.map((img, idx) => (
              <ImageDropzone 
                key={idx}
                label={`Доп. фото ${idx + 1}`}
                currentUrl={img}
                onUpload={(files) => handleFilesUpload(files, idx)}
                onUrlChange={(url) => setFormData(prev => {
                  const newImages = [...prev.images];
                  newImages[idx] = url;
                  return { ...prev, images: newImages };
                })}
                onRemove={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Description & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Описание (RU)</label>
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none resize-none text-brand-light placeholder:text-brand-muted" placeholder="Опишите историю и характер аромата..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Описание (BE)</label>
            <textarea rows={4} value={formData.description_be} onChange={e => setFormData({...formData, description_be: e.target.value})} className="w-full px-4 py-3 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none resize-none text-brand-light placeholder:text-brand-muted" placeholder="Апішыце гісторыю і характар водару..." />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Теги (RU, через запятую)</label>
            <textarea rows={4} value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-4 py-3 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none resize-none text-brand-light placeholder:text-brand-muted" placeholder="напр. ниша, бестселлер, зима, вечер" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Теги (BE, через запятую)</label>
            <textarea rows={4} value={formData.tags_be} onChange={e => setFormData({...formData, tags_be: e.target.value})} className="w-full px-4 py-3 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none resize-none text-brand-light placeholder:text-brand-muted" placeholder="напр. ніша, бестселер, зіма, вечар" />
          </div>
        </div>
      </div>

      {/* Scent Profile */}
      <div className="bg-transparent p-6 rounded-3xl border border-brand-border space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-serif text-brand-light">Пирамида аромата</h3>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <NoteBuilder 
            title="Верхние ноты" 
            notes={formData.topNotes as Note[]} 
            onChange={(notes) => setFormData({...formData, topNotes: notes})} 
          />
          <NoteBuilder 
            title="Средние ноты" 
            notes={formData.heartNotes as Note[]} 
            onChange={(notes) => setFormData({...formData, heartNotes: notes})} 
          />
          <NoteBuilder 
            title="Базовые ноты" 
            notes={formData.baseNotes as Note[]} 
            onChange={(notes) => setFormData({...formData, baseNotes: notes})} 
          />
        </div>

        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-brand-border">
          <div className="space-y-1 mt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Стойкость (0-100)</label>
            <div className="flex items-center gap-4">
              <input type="range" min="0" max="100" value={formData.longevity} onChange={e => setFormData({...formData, longevity: e.target.value})} className="flex-1 accent-brand-accent h-1.5 bg-brand-border rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-accent [&::-webkit-slider-thumb]:rounded-full" />
              <span className="text-brand-light font-medium w-8 text-right">{formData.longevity}%</span>
            </div>
          </div>
          <div className="space-y-1 mt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Шлейф (0-100)</label>
            <div className="flex items-center gap-4">
              <input type="range" min="0" max="100" value={formData.sillage} onChange={e => setFormData({...formData, sillage: e.target.value})} className="flex-1 accent-brand-accent h-1.5 bg-brand-border rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-accent [&::-webkit-slider-thumb]:rounded-full" />
              <span className="text-brand-light font-medium w-8 text-right">{formData.sillage}%</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-brand-border mt-4">
          <div className="flex justify-between items-center mb-4">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Основные аккорды (визуальные бары)</label>
            <button
              type="button"
              onClick={() => setFormData({...formData, accords: [...formData.accords, { name: '', name_be: '', color: '#ff6b35', value: 80 }]})}
              className="text-xs flex items-center gap-1 text-brand-accent hover:text-white"
            >
              <Plus className="w-4 h-4" /> Добавить аккорд
            </button>
          </div>
          <div className="space-y-3">
            {formData.accords.map((accord, i) => (
              <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-brand-hover p-3 rounded-xl border border-brand-border/50">
                <input
                  type="text"
                  value={accord.name}
                  onChange={e => {
                    const copy = [...formData.accords];
                    copy[i].name = e.target.value;
                    setFormData({...formData, accords: copy});
                  }}
                  className="flex-1 px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm"
                  placeholder="Название (RU)"
                />
                <input
                  type="text"
                  value={accord.name_be}
                  onChange={e => {
                    const copy = [...formData.accords];
                    copy[i].name_be = e.target.value;
                    setFormData({...formData, accords: copy});
                  }}
                  className="flex-1 px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm"
                  placeholder="Название (BE)"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accord.color}
                    onChange={e => {
                      const copy = [...formData.accords];
                      copy[i].color = e.target.value;
                      setFormData({...formData, accords: copy});
                    }}
                    className="w-10 h-10 p-1 rounded-lg bg-transparent border border-brand-border cursor-pointer shrink-0"
                  />
                  <div className="w-32 flex flex-col gap-1">
                    <span className="text-[10px] text-brand-muted uppercase">Значение</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={accord.value}
                      onChange={e => {
                        const copy = [...formData.accords];
                        copy[i].value = parseInt(e.target.value);
                        setFormData({...formData, accords: copy});
                      }}
                      className="w-full accent-brand-accent h-1.5 bg-brand-border rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-accent [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...formData.accords];
                    copy.splice(i, 1);
                    setFormData({...formData, accords: copy});
                  }}
                  className="p-2 text-brand-muted hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-brand-border mt-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1 mb-3 block">Семейства ароматов (RU)</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'familyFloral', label: 'Цветочные' },
                { id: 'familyOriental', label: 'Восточные' },
                { id: 'familyWoody', label: 'Древесные' },
                { id: 'familyFresh', label: 'Свежие' },
                { id: 'familyCitrus', label: 'Цитрусовые' },
                { id: 'familySpicy', label: 'Пряные' },
                { id: 'familyLeather', label: 'Кожаные' },
                { id: 'familyGourmand', label: 'Гурманские' },
                { id: 'familyChypre', label: 'Шипровые' },
                { id: 'familyFougere', label: 'Фужерные' }
              ].map(family => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => {
                    const newFamilies = formData.scentFamilies.includes(family.id)
                      ? formData.scentFamilies.filter(f => f !== family.id)
                      : [...formData.scentFamilies, family.id];
                    setFormData({...formData, scentFamilies: newFamilies});
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                    formData.scentFamilies.includes(family.id)
                      ? 'bg-brand-accent text-white border-brand-accent'
                      : 'bg-transparent text-brand-muted border-brand-border hover:border-brand-light hover:text-brand-light'
                  }`}
                >
                  {family.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1 mb-3 block">Семейства ароматов (BE)</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'familyFloral', label: 'Кветкавыя' },
                { id: 'familyOriental', label: 'Усходнія' },
                { id: 'familyWoody', label: 'Драўняныя' },
                { id: 'familyFresh', label: 'Свежыя' },
                { id: 'familyCitrus', label: 'Цытрусавыя' },
                { id: 'familySpicy', label: 'Вострыя' },
                { id: 'familyLeather', label: 'Скураныя' },
                { id: 'familyGourmand', label: 'Гурманскія' },
                { id: 'familyChypre', label: 'Шыправыя' },
                { id: 'familyFougere', label: 'Фужэрныя' }
              ].map(family => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => {
                    const newFamilies = formData.scentFamilies_be.includes(family.id)
                      ? formData.scentFamilies_be.filter(f => f !== family.id)
                      : [...formData.scentFamilies_be, family.id];
                    setFormData({...formData, scentFamilies_be: newFamilies});
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                    formData.scentFamilies_be.includes(family.id)
                      ? 'bg-brand-accent text-white border-brand-accent'
                      : 'bg-transparent text-brand-muted border-brand-border hover:border-brand-light hover:text-brand-light'
                  }`}
                >
                  {family.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1 mb-3 block">Сезонность</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'spring', label: 'Весна' },
              { id: 'summer', label: 'Лето' },
              { id: 'autumn', label: 'Осень' },
              { id: 'winter', label: 'Зима' },
              { id: 'all_season', label: 'Всесезонный' }
            ].map(season => (
              <button
                key={season.id}
                type="button"
                onClick={() => {
                  const newSeasons = formData.season.includes(season.id)
                    ? formData.season.split(',').map(s => s.trim()).filter(s => s !== season.id).join(', ')
                    : [...formData.season.split(',').map(s => s.trim()).filter(Boolean), season.id].join(', ');
                  setFormData({...formData, season: newSeasons});
                }}
                className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                  formData.season.includes(season.id)
                    ? 'bg-brand-accent text-white border-brand-accent'
                    : 'bg-transparent text-brand-muted border-brand-border hover:border-brand-light hover:text-brand-light'
                }`}
              >
                {season.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white/5 p-6 rounded-3xl border border-brand-border space-y-6">
        <h3 className="text-lg font-serif text-brand-light">SEO Настройки</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">SEO Title</label>
            <input type="text" value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted" placeholder="Заголовок для поисковиков" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">SEO Description</label>
            <textarea rows={3} value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} className="w-full px-4 py-3 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none resize-none text-brand-light placeholder:text-brand-muted" placeholder="Описание для поисковиков" />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white/5 p-6 rounded-3xl border border-brand-border space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-muted" />
            <h3 className="text-lg font-serif text-brand-light">Варианты товара</h3>
          </div>
          <button type="button" onClick={addVariant} className="text-sm font-medium text-brand-light flex items-center gap-1 hover:underline">
            <Plus className="w-4 h-4" /> Добавить вариант
          </button>
        </div>

        <div className="space-y-4">
          {formData.variants.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-4">Нет добавленных вариантов. Будет использована базовая цена.</p>
          ) : (
            formData.variants.map((variant, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-transparent rounded-2xl border border-brand-border items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Объем</label>
                  <input required type="text" value={variant.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="100ml" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Цена (BYN)</label>
                  <input required type="number" step="0.01" value={variant.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="290.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Остаток</label>
                  <input required type="number" value={variant.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="50" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] font-bold uppercase text-brand-muted">Артикул</label>
                    <input type="text" value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="SKU-001" />
                  </div>
                  <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 gap-4">
        <button type="button" onClick={onCancel} className="px-8 py-3 text-brand-muted font-medium hover:text-brand-light transition-colors">Отмена</button>
        <button 
          type="submit" 
          disabled={submitting}
          className="px-10 py-3 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-black/10"
        >
          {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{initialData ? 'Обновить товар' : 'Создать товар'}</span>
        </button>
      </div>
    </form>
  );
}
