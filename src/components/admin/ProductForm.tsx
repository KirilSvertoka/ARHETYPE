import React, { useState, useEffect, useRef } from 'react';
import { Product, Note, ProductVariant } from '../../types';
import { UploadCloud, RefreshCw, Plus, Trash2, Image as ImageIcon, Tag, Layers, Search, Check, Sparkles, Box, Package, Droplets, FileText, Megaphone, ChevronDown, ChevronRight } from 'lucide-react';
import NoteBuilder from './NoteBuilder';
import { translateNote } from '../../data/notesDictionary';

import { uploadImageChunks, UploadAuthError } from '../../utils/uploadUtils';

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
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.files?.length) onUpload(e.target.files);
            e.target.value = '';
          }}
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
              <p className="text-[10px] text-brand-muted mt-1">PNG, JPG</p>
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
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([]);
  const [nameSuggestOpen, setNameSuggestOpen] = useState(false);
  const nameSelectedRef = useRef(false);
  const [notesLookup, setNotesLookup] = useState('');
  const [notesResults, setNotesResults] = useState<any[]>([]);
  const [notesSearching, setNotesSearching] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const notesDebounce = useRef<number | null>(null);
  const nameDebounce = useRef<number | null>(null);


  const searchNotes = (q: string) => {
    setNotesLookup(q);
    if (notesDebounce.current) window.clearTimeout(notesDebounce.current);
    if (q.trim().length < 2) { setNotesResults([]); setNotesOpen(false); return; }
    notesDebounce.current = window.setTimeout(async () => {
      setNotesSearching(true);
      try {
        const brandName = (formData.brand || '').split(' ')[0];
        const res = await fetch(`/api/admin/notes-lookup?q=${encodeURIComponent(q.trim())}&brand=${encodeURIComponent(brandName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) { onAuthError(); return; }
        const data = await res.json();
        setNotesResults(preferBrand(data.results || []));
        setNotesOpen(true);
      } catch (e) { console.error(e); }
      finally { setNotesSearching(false); }
    }, 350);
  };

  // Match dataset brands loosely: ignore accents/case, accept any word of
  // the entered brand ("Initio Parfums Prives" == "Initio").
  const brandMatches = (datasetBrand: string): boolean => {
    const entered = formData.brand || '';
    if (!entered.trim()) return true;
    const deacc = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nb = deacc(datasetBrand.toLowerCase()).trim();
    const ne = deacc(entered.toLowerCase()).trim();
    if (nb.includes(ne) || ne.includes(nb)) return true;
    const words = ne.split(/\s+/).filter(w => w.length >= 3);
    return words.some(w => nb.includes(w));
  };

  /** Prefer fragrances of the entered brand; fall back to all if none match. */
  const preferBrand = (results: any[]): any[] => {
    const branded = results.filter(r => brandMatches(r.brand));
    return branded.length ? branded : results;
  };

  const toNotes = (names: string[]): any[] => names.map(n => ({ name: translateNote(n, 'ru'), name_be: translateNote(n, 'be') === n ? '' : translateNote(n, 'be'), value: 50, icon: 'Leaf' }));
  const toAccords = (names: string[]): any[] => names.map(n => ({ name: translateNote(n, 'ru'), name_be: '', value: 0, icon: '' }));

  const CONC_MAP: Record<string, string> = {
    'eau de parfum': 'EDP', 'edp': 'EDP', 'parfum': 'Parfum', 'extrait de parfum': 'Parfum',
    'eau de toilette': 'EDT', 'edt': 'EDT', 'eau de cologne': 'Cologne', 'cologne': 'Cologne', 'edc': 'Cologne'
  };
  // Rough starting values — the dataset has no longevity/sillage; adjust sliders if needed.
  const LONGEVITY_BY_CONC: Record<string, number> = { Parfum: 85, EDP: 70, EDT: 55, Cologne: 45 };
  const SILLAGE_BY_CONC: Record<string, number> = { Parfum: 80, EDP: 65, EDT: 50, Cologne: 40 };

  const applyNameSuggestion = (r: any) => {
    const concKey = String(r.concentration || '').toLowerCase().trim();
    const conc = CONC_MAP[concKey];
    setFormData(prev => ({
      ...prev,
      name: r.name,
      topNotes: toNotes(r.top || []),
      heartNotes: toNotes(r.middle || []),
      baseNotes: toNotes(r.base || []),
      accords: toAccords(r.accords || []),
      ...(conc ? { concentration: conc as any } : {}),
      ...(conc && LONGEVITY_BY_CONC[conc] ? { longevity: String(LONGEVITY_BY_CONC[conc]) } : {}),
      ...(conc && SILLAGE_BY_CONC[conc] ? { sillage: String(SILLAGE_BY_CONC[conc]) } : {})
    }));
    nameSelectedRef.current = true;
    setNameSuggestOpen(false);
  };

  const searchNameSuggestions = (q: string) => {
    nameSelectedRef.current = false;
    if (nameDebounce.current) window.clearTimeout(nameDebounce.current);
    if (q.trim().length < 2) { setNameSuggestions([]); setNameSuggestOpen(false); return; }
    nameDebounce.current = window.setTimeout(async () => {
      try {
        const brandName = (formData.brand || '').split(' ')[0];
        const res = await fetch(`/api/admin/notes-lookup?q=${encodeURIComponent(q.trim())}&brand=${encodeURIComponent(brandName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) { onAuthError(); return; }
        const data = await res.json();
        setNameSuggestions(preferBrand(data.results || []));
        setNameSuggestOpen((data.results || []).length > 0);
      } catch (e) { console.error(e); }
    }, 400);
  };

  const applyNotesResult = (r: any) => {
    setFormData(prev => ({
      ...prev,
      topNotes: toNotes(r.top || []),
      heartNotes: toNotes(r.middle || []),
      baseNotes: toNotes(r.base || []),
      accords: toAccords(r.accords || [])
    }));
    setNotesOpen(false);
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    description: initialData?.description || '',
    description_be: initialData?.description_be || '',
    imageUrl: initialData?.imageUrl || '',
    images: initialData?.images || [],
    price: initialData?.price?.toString() || '',
    price_per_ml: initialData?.price_per_ml != null ? String(initialData.price_per_ml) : '',
    decant_max_ml: String(initialData?.decant_max_ml ?? 10),
    remainder_enabled: !!(initialData?.variants || []).some(v => v.variant_type === 'remainder'),
    discountPercent: String(initialData?.discountPercent ?? 0),
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
    variants: initialData?.variants || [],
    topNotesDuration: (initialData as any)?.topNotesDuration || '',
    topNotesDuration_be: (initialData as any)?.topNotesDuration_be || '',
    heartNotesDuration: (initialData as any)?.heartNotesDuration || '',
    heartNotesDuration_be: (initialData as any)?.heartNotesDuration_be || '',
    baseNotesDuration: (initialData as any)?.baseNotesDuration || '',
    baseNotesDuration_be: (initialData as any)?.baseNotesDuration_be || '',
    setItems: initialData?.setItems || []
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'description' | 'scent' | 'variants' | 'seo' | 'builder'>('basic');

  // Admin Set builder states
  const [inventProducts, setInventProducts] = useState<Product[]>([]);
  const [inventSearch, setInventSearch] = useState('');
  const [selectedBundleItems, setSelectedBundleItems] = useState<{ product: Product; variant: ProductVariant }[]>([]);

  const [customSetName, setCustomSetName] = useState(initialData?.setItems && initialData?.setItems.length > 0 ? initialData.name : '');
  const [customSetPrice, setCustomSetPrice] = useState(initialData?.setItems && initialData?.setItems.length > 0 ? initialData.price?.toString() : '');
  const [customSetVolumeLabel, setCustomSetVolumeLabel] = useState(initialData?.setItems && initialData?.setItems.length > 0 ? (initialData.variants?.[0]?.size || '') : '');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data.products || []);
        setInventProducts(items);

        if (initialData?.setItems && initialData.setItems.length > 0) {
          const loadedBundleItems = initialData.setItems.map(setItem => {
            const matchedProduct = items.find((p: any) => p.id === setItem.id);
            if (matchedProduct) {
              const matchedVariant = (matchedProduct.variants || []).find((v: any) => v.size === setItem.size) || {
                id: Math.floor(Math.random() * 1000000),
                productId: setItem.id,
                size: setItem.size || '5мл',
                price: matchedProduct.price || 0,
                stock: 50,
                sku: ''
              };
              return {
                product: matchedProduct,
                variant: {
                  ...matchedVariant,
                  size: setItem.size
                }
              };
            } else {
              return {
                product: {
                  id: setItem.id,
                  brand: setItem.brand,
                  name: setItem.name,
                  price: 0,
                  imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
                  description: '', topNotes: [], heartNotes: [], baseNotes: [], slug: '', gender: 'Unisex', scentFamilies: [], concentration: 'EDP', stockThreshold: 10, tags: []
                } as any,
                variant: {
                  productId: setItem.id,
                  size: setItem.size,
                  price: 0,
                  stock: 50,
                  sku: ''
                }
              };
            }
          });
          setSelectedBundleItems(loadedBundleItems);
        }
      })
      .catch(err => console.error('Error fetching inventory products in form:', err));
  }, [initialData]);

  const handleAutoPopulateSet = () => {
    if (selectedBundleItems.length === 0) {
      alert('Пожалуйста, выберите хотя бы один отливант для включения в набор!');
      return;
    }

    // 1. Title
    const brandsInBundle = Array.from(new Set(selectedBundleItems.map(item => item.product.brand)));
    
    // Auto title naming
    const autoTitle = customSetName || `Набор отливантов: ${brandsInBundle.join(' & ')} (${selectedBundleItems.length} шт.)`;

    // 2. Explanations/Description
    const itemsListText = selectedBundleItems.map(item => `• ${item.product.brand} — ${item.product.name} (${item.variant.size})`).join('\n');
    const autoDescription = `Эксклюзивный подарочный набор оригинальной нишевой парфюмерии, бережно укомплектованный нашими аромастилистами.\n\nКаждый отливант снабжен надежным распылителем и информативной карточкой с описанием.\n\nСостав набора:\n${itemsListText}\n\nОтличный вариант для знакомства с легендарными композициями!`;
    const autoDescriptionBe = `Эксклюзіўны падарункавы набор арыгінальнай нішавай парфумерыі, беражліва укамплектаваны нашымі аромастылістамі.\n\nКожны адлівант забяспечаны надзейным распыляльнікам і інфарматыўнай карткай з апісаннем.\n\nСклад набору:\n${itemsListText}\n\nВыдатны варыянт для знаёмства з легендарнымі кампазіцыямі!`;

    // 3. Merging notes
    let mergedTop: Note[] = [];
    let mergedHeart: Note[] = [];
    let mergedBase: Note[] = [];
    let mergedAccords: any[] = [];

    selectedBundleItems.forEach(item => {
      const p = item.product;
      p.topNotes?.forEach(note => {
        if (!mergedTop.some(n => n.name.toLowerCase() === note.name.toLowerCase())) {
          mergedTop.push(note);
        }
      });
      p.heartNotes?.forEach(note => {
        if (!mergedHeart.some(n => n.name.toLowerCase() === note.name.toLowerCase())) {
          mergedHeart.push(note);
        }
      });
      p.baseNotes?.forEach(note => {
        if (!mergedBase.some(n => n.name.toLowerCase() === note.name.toLowerCase())) {
          mergedBase.push(note);
        }
      });
      p.accords?.forEach(accord => {
        if (!mergedAccords.some(a => a.name.toLowerCase() === accord.name.toLowerCase())) {
          mergedAccords.push(accord);
        }
      });
    });

    mergedTop = mergedTop.slice(0, 6);
    mergedHeart = mergedHeart.slice(0, 6);
    mergedBase = mergedBase.slice(0, 6);
    mergedAccords = mergedAccords.slice(0, 5);

    // 4. Calculating variant info and automatic variant listing
    const parsedPrice = parseFloat(customSetPrice);
    if (!customSetPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Пожалуйста, укажите цену набора в поле "Стоимость (BYN)". Ценообразование наборов контролируется только администратором!');
      return;
    }

    const finalPrice = parsedPrice;

    const autoSizeLabel = customSetVolumeLabel || `Сет ${selectedBundleItems.length} шт (${selectedBundleItems[0]?.variant?.size || '2мл'})`;

    const newVariant: ProductVariant = {
      productId: initialData?.id || 0,
      size: autoSizeLabel,
      price: finalPrice,
      stock: 50,
      sku: `SET-${selectedBundleItems.length}S-${Date.now()}`,
      variant_type: 'decant'
    };

    const setItemsToSave = selectedBundleItems.map(item => ({
      id: item.product.id,
      brand: item.product.brand,
      name: item.product.name,
      size: item.variant.size
    }));

    // Update form state
    setFormData(prev => ({
      ...prev,
      name: autoTitle,
      brand: 'Archetype Selection',
      description: autoDescription,
      description_be: autoDescriptionBe,
      imageUrl: selectedBundleItems[0]?.product.imageUrl || prev.imageUrl,
      price: finalPrice.toString(),
      topNotes: mergedTop,
      heartNotes: mergedHeart,
      baseNotes: mergedBase,
      accords: mergedAccords,
      tags: 'set, набор, подарок, отливанты',
      tags_be: 'set, набор, падарунак, адліванты',
      scentFamilies: Array.from(new Set(selectedBundleItems.flatMap(item => item.product.scentFamilies || []))),
      variants: [newVariant],
      setItems: setItemsToSave
    }));

    // Switch tab showing results!
    setActiveTab('basic');
    alert(`Набор собран! Настройки набора применены в основную форму (Проверьте поля на вкладке Основное и Варианты).`);
  };

  const handleFilesUpload = async (files: FileList | File[], targetField: 'imageUrl' | 'gallery' | number) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = fileArray.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`Файл ${file.name} не является изображением`);
        }
        // No size limit

        return await uploadImageChunks(file, token);
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
      if (err instanceof UploadAuthError || err?.status === 401) {
        onAuthError();
      }
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
      sku: '',
      variant_type: 'decant'
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

    // Custom form validations to prevent silent browser failures when tabs are inactive
    if (!formData.name || formData.name.trim().length < 2) {
      setActiveTab('basic');
      alert('Пожалуйста, введите название товара (минимум 2 символа).');
      return;
    }

    if (!formData.brand || formData.brand.trim().length < 2) {
      setActiveTab('basic');
      alert('Пожалуйста, введите название бренда (минимум 2 символа).');
      return;
    }



    if (!formData.stockThreshold || formData.stockThreshold.toString().trim().length === 0) {
      setActiveTab('basic');
      alert('Пожалуйста, укажите порог остатка.');
      return;
    }

    // Validate variants if any exist
    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      if (!variant.size || variant.size.trim().length === 0) {
        setActiveTab('variants');
        alert(`Пожалуйста, укажите объем для варианта №${i + 1}.`);
        return;
      }
      if (variant.price === undefined || variant.price === null || variant.price.toString().trim().length === 0) {
        setActiveTab('variants');
        alert(`Пожалуйста, укажите цену для варианта №${i + 1}.`);
        return;
      }
      if (variant.stock === undefined || variant.stock === null || variant.stock.toString().trim().length === 0) {
        setActiveTab('variants');
        alert(`Пожалуйста, укажите остаток для варианта №${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      ...formData,
      price: formData.price,
      price_per_ml: formData.price_per_ml && !isNaN(parseFloat(formData.price_per_ml)) ? parseFloat(formData.price_per_ml) : null,
      decant_max_ml: parseInt(formData.decant_max_ml, 10) > 0 ? parseInt(formData.decant_max_ml, 10) : 10,
      discountPercent: Math.min(90, Math.max(0, parseInt(formData.discountPercent, 10) || 0)),
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
      variants: (() => {
        const list = formData.variants.filter(v => v.variant_type !== 'remainder' || formData.remainder_enabled);
        if (formData.remainder_enabled && !list.some(v => v.variant_type === 'remainder')) {
          list.push({
            size: 'Остаток',
            price: '0',
            stock: 1,
            sku: `remainder-${initialData?.id || Date.now()}`,
            variant_type: 'remainder'
          } as any);
        }
        return list.map(v => ({ ...v, price: v.price, stock: typeof v.stock === 'string' ? parseInt(v.stock) : v.stock }));
      })(),
      setItems: formData.setItems || []
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border/60 pb-3 pt-3 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-xl font-serif text-brand-light">{initialData ? 'Редактировать аромат' : 'Новый аромат'}</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button type="button" onClick={onCancel} className="flex-1 md:flex-none text-center text-sm text-brand-muted hover:text-brand-light px-4 min-h-[44px] border border-brand-border rounded-xl whitespace-nowrap">Отмена</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 md:flex-none justify-center px-6 min-h-[44px] bg-brand-accent text-white rounded-xl text-sm font-medium hover:bg-brand-accent-hover transition-colors disabled:opacity-70 flex items-center gap-2 whitespace-nowrap"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Сохранить</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {[
            { id: 'basic', label: 'Основное', icon: Package },
            { id: 'scent', label: 'Аромат', icon: Droplets },
            { id: 'media', label: 'Медиа', icon: ImageIcon },
            { id: 'variants', label: 'Варианты', icon: Layers },
            { id: 'description', label: 'Описание', icon: FileText },
            { id: 'builder', label: 'Набор', icon: Box },
            { id: 'seo', label: 'SEO', icon: Megaphone },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-brand-accent text-white'
                    : 'bg-white/5 text-brand-muted hover:text-brand-light hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 gap-8">
          {/* Basic Info */}
          <div className="space-y-6 max-w-3xl">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Название товара</label>
            <div className="relative">
              <input type="text" value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); searchNameSuggestions(e.target.value); }} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="напр. Santal 33" />
              {nameSuggestOpen && nameSuggestions.length > 0 && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-xl max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-brand-accent font-semibold bg-brand-hover/50">
                    Выберите аромат — ноты подтянутся автоматически
                  </div>
                  {nameSuggestions.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyNameSuggestion(r)}
                      className="w-full text-left px-4 py-3 hover:bg-brand-hover border-b border-brand-border/40 last:border-0 cursor-pointer"
                    >
                      <div className="flex justify-between gap-3">
                        <span className="text-sm font-medium text-brand-light">{r.name}</span>
                        <span className="text-[11px] text-brand-muted shrink-0">{r.brand}{r.year ? `, ${r.year}` : ''}{r.concentration ? ` · ${r.concentration}` : ''}</span>
                      </div>
                      <div className="text-[11px] text-brand-muted mt-0.5 truncate">
                        {[(r.top || []).slice(0, 3).join(', '), (r.middle || []).slice(0, 2).join(', '), (r.base || []).slice(0, 2).join(', ')].filter(Boolean).join(' → ')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Бренд</label>
            <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="напр. Le Labo" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Базовая цена (BYN, необязательно)</label>
              <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="320.00 или 'Уточняйте'" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Порог остатка</label>
              <input type="number" min="0" value={formData.stockThreshold} onChange={e => setFormData({...formData, stockThreshold: e.target.value})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="10" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Цена за 1 мл (BYN)</label>
              <input type="text" inputMode="decimal" value={formData.price_per_ml} onChange={e => setFormData({...formData, price_per_ml: e.target.value})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="напр. 12.50 (для распива)" />
              <label className="flex items-center gap-2 text-[11px] text-brand-muted cursor-pointer mt-2">
                <input type="checkbox" checked={formData.remainder_enabled} onChange={e => setFormData({...formData, remainder_enabled: e.target.checked})} className="w-3.5 h-3.5 accent-[#660010] cursor-pointer" />
                Включить вариант «Остаток во флаконе»
              </label>
              <div className="mt-1.5">
                <label className="text-[10px] uppercase font-semibold text-brand-muted block ml-0.5">Макс. объём распива (мл)</label>
                <input type="number" min="2" max="200" value={formData.decant_max_ml} onChange={e => setFormData({...formData, decant_max_ml: e.target.value})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted" placeholder="10" />
                <p className="text-[10px] text-brand-muted mt-1 ml-0.5">Покупатель сможет выбрать любой объём от 2 мл до этого значения.</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Скидка (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={formData.discountPercent}
                onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light placeholder:text-brand-muted"
                placeholder="0"
              />
              <p className="text-[10px] text-brand-muted ml-1">0 — без скидки. Применяется ко всем ценам товара (включая варианты).</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Пол</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light appearance-none">
                <option value="Unisex" className="bg-brand-bg">Унисекс</option>
                <option value="Male" className="bg-brand-bg">Мужской</option>
                <option value="Female" className="bg-brand-bg">Женский</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Концентрация</label>
              <select value={formData.concentration} onChange={e => setFormData({...formData, concentration: e.target.value as any})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light focus:border-transparent outline-none text-brand-light appearance-none">
                <option value="EDP" className="bg-brand-bg">Парфюмерная вода (EDP)</option>
                <option value="EDT" className="bg-brand-bg">Туалетная вода (EDT)</option>
                <option value="Parfum" className="bg-brand-bg">Духи (Parfum)</option>
                <option value="Cologne" className="bg-brand-bg">Одеколон (Cologne)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className={activeTab === 'media' ? 'block' : 'hidden'}>
        {/* Image Upload */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Изображения товара</label>
            <div className="flex gap-2">
              {uploading && <RefreshCw className="w-3 h-3 animate-spin text-brand-muted" />}
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: [...prev.images, ''] }))} className="text-xs font-medium text-brand-light flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Добавить поле
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className={activeTab === 'description' ? 'block' : 'hidden'}>
        {/* Description & Tags */}
        <div className="grid grid-cols-1 gap-8 max-w-4xl">
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
      </div>

      <div className={activeTab === 'scent' ? 'block' : 'hidden'}>
      {/* Scent Profile */}
      <div className="bg-transparent p-6 rounded-3xl border border-brand-border space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-serif text-brand-light">Пирамида аромата</h3>
        </div>
        <div className="relative pb-2">
          <label className="text-xs font-medium uppercase tracking-wider text-brand-accent ml-1 block mb-1.5">Подтянуть ноты из базы</label>
          <div className="relative">
            <input
              type="text"
              value={notesLookup}
              onChange={e => searchNotes(e.target.value)}
              onFocus={() => { if (notesResults.length) setNotesOpen(true); }}
              placeholder="Начните вводить название аромата, напр. Sauvage Elixir..."
              className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-accent/40 rounded-xl focus:ring-2 focus:ring-brand-accent/30 outline-none text-brand-light placeholder:text-brand-muted/70 text-sm"
            />
            {notesSearching && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-brand-border border-t-brand-accent rounded-full animate-spin" />}
          </div>
          {notesOpen && notesResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-xl max-h-72 overflow-y-auto">
              {notesResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyNotesResult(r)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-hover border-b border-brand-border/40 last:border-0 cursor-pointer"
                >
                  <div className="flex justify-between gap-3">
                    <span className="text-sm font-medium text-brand-light">{r.name}</span>
                    <span className="text-[11px] text-brand-muted shrink-0">{r.brand}{r.year ? `, ${r.year}` : ''}</span>
                  </div>
                  <div className="text-[11px] text-brand-muted mt-0.5 truncate">
                    {[(r.top || []).slice(0, 3).join(', '), (r.middle || []).slice(0, 2).join(', '), (r.base || []).slice(0, 2).join(', ')].filter(Boolean).join(' → ')}
                  </div>
                </button>
              ))}
            </div>
          )}
          {notesOpen && !notesSearching && notesLookup.trim().length >= 2 && notesResults.length === 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-xl px-4 py-3 text-sm text-brand-muted">
              Ничего не найдено. Введите ноты вручную ниже.
            </div>
          )}
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

        {/* Custom Scent Disclosure Times */}
        <details className="pt-4 border-t border-brand-border group/dur">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold uppercase tracking-wider text-brand-muted hover:text-brand-light select-none list-none py-2">
            <ChevronRight className="w-4 h-4 transition-transform group-open/dur:rotate-90" />
            Время раскрытия нот (необязательно)
          </summary>
          <p className="text-xs text-brand-muted leading-relaxed pb-2">
            Оставьте пустым — время задастся автоматически. Переопределяйте, только если знаете точные значения.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Верхние ноты (RU)</label>
              <input 
                type="text" 
                value={formData.topNotesDuration} 
                onChange={e => setFormData({...formData, topNotesDuration: e.target.value})} 
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none text-brand-light text-sm placeholder:text-brand-muted/50" 
                placeholder="Автоматически: Звучат первые 10–15 минут" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Верхнія ноты (BE)</label>
              <input 
                type="text" 
                value={formData.topNotesDuration_be} 
                onChange={e => setFormData({...formData, topNotesDuration_be: e.target.value})} 
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none text-brand-light text-sm placeholder:text-brand-muted/50" 
                placeholder="Аўтаматычна: Гучаць першыя 10–15 хвілін" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Средние ноты / Сердце (RU)</label>
              <input 
                type="text" 
                value={formData.heartNotesDuration} 
                onChange={e => setFormData({...formData, heartNotesDuration: e.target.value})} 
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none text-brand-light text-sm placeholder:text-brand-muted/50" 
                placeholder="Автоматически: Звучат на протяжении 2–4 часов" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Сярэднія ноты / Сэрца (BE)</label>
              <input 
                type="text" 
                value={formData.heartNotesDuration_be} 
                onChange={e => setFormData({...formData, heartNotesDuration_be: e.target.value})} 
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none text-brand-light text-sm placeholder:text-brand-muted/50" 
                placeholder="Аўтаматычна: Гучаць на працягу 2–4 гадзін" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Базовые ноты / Шлейф (RU)</label>
              <input 
                type="text" 
                value={formData.baseNotesDuration} 
                onChange={e => setFormData({...formData, baseNotesDuration: e.target.value})} 
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none text-brand-light text-sm placeholder:text-brand-muted/50" 
                placeholder="Автоматически: Шлейф раскрывается до 10–12 часов" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Базавыя ноты / Шлейф (BE)</label>
              <input 
                type="text" 
                value={formData.baseNotesDuration_be} 
                onChange={e => setFormData({...formData, baseNotesDuration_be: e.target.value})} 
                className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none text-brand-light text-sm placeholder:text-brand-muted/50" 
                placeholder="Аўтаматычна: Шлейф раскрываецца да 10–12 гадзін" 
              />
            </div>
          </div>
        </details>

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
      </div>

      <div className={activeTab === 'builder' ? 'block' : 'hidden'}>
        {/* Scent Set Builder Constructor (Admin Tool) */}
        <div className="bg-white p-6 rounded-3xl border border-brand-border/80 shadow-[0_4px_24px_rgba(17,17,17,0.02)] space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-accent" />
                <h3 className="text-xl font-serif text-brand-light">Конструктор парфюмерных наборов</h3>
              </div>
              <p className="text-xs text-brand-muted mt-1">Облегчите составление сетов! Выберите комплектующие продукты, и система сама назовет набор, соберет описание, объединит все их ароматические ноты и добавит готовые варианты в форму.</p>
            </div>
            
            <button
              type="button"
              onClick={handleAutoPopulateSet}
              disabled={selectedBundleItems.length === 0}
              className="px-5 py-2.5 bg-brand-accent text-white hover:bg-brand-accent-hover text-xs uppercase tracking-wider font-semibold rounded-xl flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Автозаполнить всё</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left side: Selected list */}
            <div className="md:col-span-12 lg:col-span-5 space-y-4">
              {/* Custom Set Configuration Panel */}
              <div className="bg-[#111111]/[0.02] border border-brand-border p-5 rounded-2xl space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-accent flex items-center gap-2">
                  <span>⚙️</span> Настройка результирующей карточки:
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-brand-muted block ml-1">Название набора:</label>
                    <input
                      type="text"
                      value={customSetName}
                      onChange={e => setCustomSetName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-brand-light placeholder:text-brand-muted/45 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all shadow-sm"
                      placeholder="Например: Аромабокс Люксовые Ароматы"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-brand-muted block ml-1">Стоимость (BYN):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={customSetPrice}
                        onChange={e => setCustomSetPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-brand-light placeholder:text-brand-muted/45 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all shadow-sm"
                        placeholder="Укажите цену..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-brand-muted block ml-1">Объем / Вариант-лейбл:</label>
                      <input
                        type="text"
                        value={customSetVolumeLabel}
                        onChange={e => setCustomSetVolumeLabel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-brand-light placeholder:text-brand-muted/45 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all shadow-sm"
                        placeholder="Например: Сет 5 шт x 2мл"
                      />
                    </div>
                  </div>

                  {selectedBundleItems.length > 0 && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const brandsInBundle = Array.from(new Set(selectedBundleItems.map(item => item.product.brand)));
                          const autoTitle = `Набор отливантов: ${brandsInBundle.join(' & ')} (${selectedBundleItems.length} шт.)`;
                          const autoSizeLabel = `Сет ${selectedBundleItems.length} шт (${selectedBundleItems[0]?.variant?.size || '5мл'})`;
                          
                          setCustomSetName(autoTitle);
                          setCustomSetVolumeLabel(autoSizeLabel);
                        }}
                        className="px-3 py-1.5 bg-brand-bg hover:bg-white text-brand-muted hover:text-brand-light text-[10px] uppercase tracking-wider font-mono rounded-lg border border-brand-border hover:border-brand-muted/30 transition-all cursor-pointer font-semibold shadow-sm"
                      >
                        🔄 Сбросить имя и объем к авто-значениям
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted ml-1 pt-2">Выбранные отливанты в наборе ({selectedBundleItems.length} шт):</h4>
              
              <div className="p-5 bg-black/[0.015] border border-brand-border rounded-2xl min-h-[300px] flex flex-col justify-between shadow-inner">
                <div className="space-y-3">
                  {selectedBundleItems.length === 0 ? (
                    <div className="text-center py-16 text-xs text-brand-muted uppercase tracking-widest font-medium">
                      Набор пуст.<br/>Выберите отливанты справа ↗
                    </div>
                  ) : (
                    selectedBundleItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col p-4 bg-white border border-brand-border rounded-xl space-y-3 text-left shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] uppercase font-semibold tracking-wider text-brand-muted">{item.product.brand}</p>
                            <h5 className="text-xs text-brand-light font-semibold truncate mt-0.5">{item.product.name}</h5>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedBundleItems(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 px-3 bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-all text-[9.5px] font-bold border-none uppercase cursor-pointer shrink-0"
                          >
                            Удалить
                          </button>
                        </div>

                        {/* Interactive Adaptation of Volumes and Prices */}
                        <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-brand-border/60">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-brand-muted block ml-0.5">Объем в наборе:</span>
                            <input
                              type="text"
                              value={item.variant.size}
                              onChange={e => {
                                const val = e.target.value;
                                setSelectedBundleItems(prev => prev.map((it, i) => i === idx ? { ...it, variant: { ...it.variant, size: val } } : it));
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-brand-border rounded-lg text-xs text-brand-light placeholder:text-brand-muted/30 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                              placeholder="Например: 5мл"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-brand-muted block ml-0.5">Цена за ед. (BYN):</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.variant.price}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setSelectedBundleItems(prev => prev.map((it, i) => i === idx ? { ...it, variant: { ...it.variant, price: val } } : it));
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-brand-border rounded-lg text-xs text-brand-light placeholder:text-brand-muted/30 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                              placeholder="Например: 35"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedBundleItems.length > 0 && (
                  <div className="border-t border-brand-border pt-4 mt-6 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-brand-muted font-medium">
                      <span>Суммарная стоимость отливантов:</span>
                      <span className="font-bold text-sm text-brand-light">
                        {selectedBundleItems.reduce((sum, item) => sum + (typeof item.variant.price === 'number' ? item.variant.price : parseFloat(item.variant.price) || 0), 0).toFixed(2)} BYN
                      </span>
                    </div>
                    <div className="p-3 bg-brand-bg border border-brand-border rounded-lg text-[10px] text-brand-muted leading-relaxed">
                      ℹ️ <strong className="text-brand-light">Внимание:</strong> Скидки общего порядка и автоматическое ценообразование отключены. Итоговая цена набора устанавливается администратором вручную в поле <strong className="text-brand-light">«Стоимость (BYN)»</strong> выше.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Catalog search & select */}
            <div className="md:col-span-12 lg:col-span-7 space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-brand-muted/70">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={inventSearch}
                  onChange={e => setInventSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all shadow-sm"
                  placeholder="Быстрый поиск парфюмерии по названию или бренду..."
                />
              </div>

              <div className="bg-black/[0.015] border border-brand-border rounded-2xl p-4 max-h-[460px] overflow-y-auto custom-scrollbar space-y-2.5 shadow-inner">
                {inventProducts
                  .filter(p => !inventSearch || p.name.toLowerCase().includes(inventSearch.toLowerCase()) || p.brand.toLowerCase().includes(inventSearch.toLowerCase()))
                  .slice(0, 30) // Show up to 30 matching products
                  .map(product => {
                    // Extract decant variants
                    const variants = (product.variants || []).filter(v => v.variant_type === 'decant' || v.variant_type === 'splitting' || v.size.toLowerCase().includes('ml'));
                    
                    return (
                      <div key={product.id} className="p-3.5 bg-white hover:bg-brand-bg/40 border border-brand-border rounded-xl space-y-2 transition-all shadow-sm">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="text-[10px] text-brand-muted uppercase font-semibold tracking-wider">{product.brand}</span>
                            <h5 className="text-xs font-semibold text-brand-light leading-tight mt-0.5">{product.name}</h5>
                          </div>
                        </div>

                        {variants.length === 0 ? (
                          <p className="text-[10px] text-brand-muted pl-1">Нет доступных отливантов-вариантов</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {variants.map(variant => {
                              const isSelected = selectedBundleItems.some(item => item.variant.id === variant.id);
                              return (
                                <button
                                  key={variant.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedBundleItems(prev => prev.filter(item => item.variant.id !== variant.id));
                                    } else {
                                      setSelectedBundleItems(prev => [...prev, { product, variant }]);
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono tracking-wider transition-all flex items-center gap-1 cursor-pointer select-none border ${
                                    isSelected 
                                      ? 'bg-brand-accent/10 text-brand-accent border-brand-accent font-semibold shadow-sm' 
                                      : 'bg-brand-bg/40 text-brand-muted hover:text-brand-light border-brand-border hover:border-brand-muted/40 transition-colors'
                                  }`}
                                >
                                  {variant.size} — {(typeof variant.price === 'number' ? variant.price : parseFloat(variant.price as any)).toFixed(0)} BYN 
                                  {isSelected && <Check className="w-3 h-3 ml-0.5 text-brand-accent animate-scale-in" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
      {/* SEO */}
      <div className="bg-white/5 p-6 rounded-3xl border border-brand-border space-y-6">
        <h3 className="text-lg font-serif text-brand-light">SEO Настройки <span className="text-xs font-sans text-brand-muted">(необязательно — сгенерируется автоматически)</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">SEO Title</label>
            <input type="text" value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} className="w-full px-4 py-3 bg-transparent text-base sm:text-sm border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted" placeholder="Заголовок для поисковиков" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">SEO Description</label>
            <textarea rows={3} value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} className="w-full px-4 py-3 bg-transparent border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-light outline-none resize-none text-brand-light placeholder:text-brand-muted" placeholder="Описание для поисковиков" />
          </div>
        </div>
      </div>
      </div>

      <div className={activeTab === 'variants' ? 'block' : 'hidden'}>
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
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-4 bg-transparent rounded-2xl border border-brand-border items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Объем</label>
                  <input type="text" value={variant.size} onChange={e => updateVariant(idx, 'size', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="100ml" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Тип</label>
                  <select 
                    value={variant.variant_type || 'decant'} 
                    onChange={e => updateVariant(idx, 'variant_type', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light outline-none"
                  >
                    <option value="decant">Отливант ( Decant )</option>
                    <option value="splitting">Распив ( Splitting )</option>
                    <option value="full">Флакон ( Full Bottle )</option>
                    <option value="tester">Тестер ( Tester )</option>
                    <option value="remainder">Остаток во флаконе</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Цена (BYN)</label>
                  <input type="text" value={variant.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="290.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-brand-muted">Остаток</label>
                  <input type="number" value={variant.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted" placeholder="50" />
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
      </div>
    </form>
  );
}
