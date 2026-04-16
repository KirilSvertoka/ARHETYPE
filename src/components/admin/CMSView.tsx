import React, { useState, useRef } from 'react';
import { CMSPage, HomeConfig, GeneralSettings } from '../../types';
import { XCircle, Plus, Trash2, GripVertical, Image as ImageIcon, UploadCloud } from 'lucide-react';

interface CMSViewProps {
  pages: CMSPage[];
  homeConfig: HomeConfig | null;
  onUpdateHome: () => void;
  onUpdatePage: () => void;
  token: string;
  loading: boolean;
  activeSection: 'general' | 'home' | 'pages';
}

export default function CMSView({ pages, homeConfig, onUpdateHome, onUpdatePage, token, loading, activeSection }: CMSViewProps) {
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [localHomeConfig, setLocalHomeConfig] = useState<HomeConfig | null>(homeConfig);
  const [localGeneralSettings, setLocalGeneralSettings] = useState<GeneralSettings | null>(null);

  React.useEffect(() => {
    fetch('/api/settings/general')
      .then(res => res.json())
      .then(data => setLocalGeneralSettings(data))
      .catch(console.error);
  }, []);

  const saveGeneralSettings = async () => {
    if (!localGeneralSettings) return;
    try {
      const res = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(localGeneralSettings)
      });
      if (res.ok) {
        alert('Общие настройки успешно сохранены!');
      }
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла должен быть меньше 5 МБ');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Ошибка при загрузке');
      const data = await res.json();
      callback(data.url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const ImageDropzone = ({ 
    currentUrl, 
    onUpload, 
    label,
    className = ""
  }: { 
    currentUrl: string, 
    onUpload: (file: File) => void | Promise<void>, 
    label: string,
    className?: string
  }) => {
    const [isOver, setIsOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div className={`space-y-1 ${className}`}>
        <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">{label}</label>
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
          onDragLeave={() => setIsOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsOver(false);
            if (e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`relative group cursor-pointer border-2 border-dashed rounded-xl transition-all flex items-center gap-3 p-2 min-h-[60px] ${
            isOver ? 'border-brand-light bg-white/10' : 'border-brand-border hover:border-brand-muted'
          }`}
        >
          <input 
            type="file" 
            ref={inputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          
          <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {currentUrl ? (
              <img src={currentUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UploadCloud className="w-5 h-5 text-brand-muted" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-brand-light truncate">
              {currentUrl ? 'Нажмите для замены' : 'Нажмите или перетащите фото'}
            </p>
            {currentUrl && <p className="text-[8px] text-brand-muted truncate font-mono">{currentUrl}</p>}
          </div>
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    setLocalHomeConfig(homeConfig);
  }, [homeConfig]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-border border-t-brand-light rounded-full animate-spin"></div></div>;

  const savePage = async () => {
    if (!editingPage) return;
    try {
      const res = await fetch(`/api/admin/cms/${editingPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingPage)
      });
      if (res.ok) {
        setEditingPage(null);
        onUpdatePage();
      }
    } catch (err) { console.error(err); }
  };

  const saveHomeConfig = async () => {
    if (!localHomeConfig) return;
    try {
      const res = await fetch('/api/settings/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(localHomeConfig)
      });
      if (res.ok) {
        alert('Настройки главной страницы успешно сохранены!');
        onUpdateHome();
      }
    } catch (err) { console.error(err); }
  };

  const addSlide = () => {
    if (!localHomeConfig) return;
    setLocalHomeConfig({
      ...localHomeConfig,
      hero: {
        ...localHomeConfig.hero,
        slides: [
          ...localHomeConfig.hero.slides,
          { image: '', title: 'Новый слайд', subtitle: 'Описание', link: '/catalog' }
        ]
      }
    });
  };

  const updateSlide = (index: number, field: string, value: string) => {
    if (!localHomeConfig) return;
    const newSlides = [...localHomeConfig.hero.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setLocalHomeConfig({
      ...localHomeConfig,
      hero: { ...localHomeConfig.hero, slides: newSlides }
    });
  };

  const removeSlide = (index: number) => {
    if (!localHomeConfig) return;
    const newSlides = localHomeConfig.hero.slides.filter((_, i) => i !== index);
    setLocalHomeConfig({
      ...localHomeConfig,
      hero: { ...localHomeConfig.hero, slides: newSlides }
    });
  };

  const addPromoImage = () => {
    if (!localHomeConfig) return;
    setLocalHomeConfig({
      ...localHomeConfig,
      promoImages: [...localHomeConfig.promoImages, '']
    });
  };

  const updatePromoImage = (index: number, value: string) => {
    if (!localHomeConfig) return;
    const newImages = [...localHomeConfig.promoImages];
    newImages[index] = value;
    setLocalHomeConfig({
      ...localHomeConfig,
      promoImages: newImages
    });
  };

  const removePromoImage = (index: number) => {
    if (!localHomeConfig) return;
    setLocalHomeConfig({
      ...localHomeConfig,
      promoImages: localHomeConfig.promoImages.filter((_, i) => i !== index)
    });
  };

  const updateDynamicBlock = (index: number, field: string, value: any) => {
    if (!localHomeConfig) return;
    const newBlocks = [...localHomeConfig.dynamicBlocks];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    setLocalHomeConfig({
      ...localHomeConfig,
      dynamicBlocks: newBlocks
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {activeSection === 'general' && localGeneralSettings && (
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <h3 className="text-xl font-serif text-brand-light">Общие настройки</h3>
            <button onClick={saveGeneralSettings} className="px-6 py-2 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors">Сохранить настройки</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageDropzone 
              label="Фото для страницы 'О нас'"
              currentUrl={localGeneralSettings.aboutPhoto}
              onUpload={(file) => handleFileUpload(file, (url) => setLocalGeneralSettings({...localGeneralSettings, aboutPhoto: url}))}
            />
            <div className="space-y-4">
              <input type="text" value={localGeneralSettings.instagram} onChange={e => setLocalGeneralSettings({...localGeneralSettings, instagram: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Instagram URL" />
              <input type="text" value={localGeneralSettings.telegram} onChange={e => setLocalGeneralSettings({...localGeneralSettings, telegram: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Telegram URL" />
              <input type="text" value={localGeneralSettings.email} onChange={e => setLocalGeneralSettings({...localGeneralSettings, email: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Email" />
              <input type="text" value={localGeneralSettings.phone} onChange={e => setLocalGeneralSettings({...localGeneralSettings, phone: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Телефон" />
              <input type="text" value={localGeneralSettings.address} onChange={e => setLocalGeneralSettings({...localGeneralSettings, address: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Адрес (RU)" />
              <input type="text" value={localGeneralSettings.address_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, address_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Адрес (BE)" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-border">
            <div className="space-y-4">
              <input type="text" value={localGeneralSettings.aboutTitle} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutTitle: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок 'О нас' (RU)" />
              <input type="text" value={localGeneralSettings.aboutTitle_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutTitle_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок 'О нас' (BE)" />
              <textarea value={localGeneralSettings.aboutDescription} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutDescription: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Описание 'О нас' (RU)" rows={3} />
              <textarea value={localGeneralSettings.aboutDescription_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutDescription_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Описание 'О нас' (BE)" rows={3} />
            </div>
            <div className="space-y-4">
              <input type="text" value={localGeneralSettings.aboutArtTitle} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtTitle: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок 'Искусство' (RU)" />
              <input type="text" value={localGeneralSettings.aboutArtTitle_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtTitle_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок 'Искусство' (BE)" />
              <textarea value={localGeneralSettings.aboutArtText1} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText1: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 1 'Искусство' (RU)" rows={3} />
              <textarea value={localGeneralSettings.aboutArtText1_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText1_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 1 'Искусство' (BE)" rows={3} />
              <textarea value={localGeneralSettings.aboutArtText2} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText2: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 2 'Искусство' (RU)" rows={3} />
              <textarea value={localGeneralSettings.aboutArtText2_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText2_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 2 'Искусство' (BE)" rows={3} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-brand-border">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <input type="text" value={localGeneralSettings[`stat${i}Value` as keyof GeneralSettings] as string} onChange={e => setLocalGeneralSettings({...localGeneralSettings, [`stat${i}Value`]: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder={`Значение ${i}`} />
                <input type="text" value={localGeneralSettings[`stat${i}Label` as keyof GeneralSettings] as string} onChange={e => setLocalGeneralSettings({...localGeneralSettings, [`stat${i}Label`]: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder={`Лейбл ${i} (RU)`} />
                <input type="text" value={(localGeneralSettings[`stat${i}Label_be` as keyof GeneralSettings] as string) || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, [`stat${i}Label_be`]: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder={`Лейбл ${i} (BE)`} />
              </div>
            ))}
          </div>
        </div>
      )}
      {activeSection === 'home' && localHomeConfig && (
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm space-y-10">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <h3 className="text-xl font-serif text-brand-light">Настройки главной страницы</h3>
            <button onClick={saveHomeConfig} className="px-6 py-2 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors">Сохранить настройки</button>
          </div>

          {/* Announcement Bar */}
          <div className="space-y-4">
            <h4 className="font-medium text-brand-light flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-light"></span>
              Панель объявлений (Сверху)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-2xl border border-brand-border">
              <div className="sm:col-span-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="announcementActive"
                  checked={localHomeConfig.announcement.active}
                  onChange={e => setLocalHomeConfig({...localHomeConfig, announcement: {...localHomeConfig.announcement, active: e.target.checked}})}
                  className="w-4 h-4 rounded border-brand-border text-brand-light focus:ring-brand-light"
                />
                <label htmlFor="announcementActive" className="text-sm font-medium text-brand-light">Активно</label>
              </div>
              <div className="sm:col-span-10 space-y-2">
                <input 
                  type="text" 
                  value={localHomeConfig.announcement.text}
                  onChange={e => setLocalHomeConfig({...localHomeConfig, announcement: {...localHomeConfig.announcement, text: e.target.value}})}
                  className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted"
                  placeholder="Текст объявления (RU)..."
                />
                <input 
                  type="text" 
                  value={localHomeConfig.announcement.text_be || ''}
                  onChange={e => setLocalHomeConfig({...localHomeConfig, announcement: {...localHomeConfig.announcement, text_be: e.target.value}})}
                  className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted"
                  placeholder="Текст объявления (BE)..."
                />
              </div>
            </div>
          </div>

          {/* Hero Slides */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-brand-light flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-light"></span>
                Главный баннер (Слайды)
              </h4>
              <button onClick={addSlide} className="text-sm font-medium text-brand-muted hover:text-brand-light flex items-center gap-1">
                <Plus className="w-4 h-4" /> Добавить слайд
              </button>
            </div>
            
            <div className="space-y-4">
              {localHomeConfig.hero.slides.map((slide, idx) => (
                <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-brand-border relative">
                  <button onClick={() => removeSlide(idx)} className="absolute top-4 right-4 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Заголовок (RU)</label>
                      <input type="text" value={slide.title} onChange={e => updateSlide(idx, 'title', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Заголовок (BE)</label>
                      <input type="text" value={slide.title_be || ''} onChange={e => updateSlide(idx, 'title_be', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Подзаголовок (RU)</label>
                      <input type="text" value={slide.subtitle} onChange={e => updateSlide(idx, 'subtitle', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Подзаголовок (BE)</label>
                      <input type="text" value={slide.subtitle_be || ''} onChange={e => updateSlide(idx, 'subtitle_be', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <ImageDropzone 
                        label="Изображение слайда"
                        currentUrl={slide.image}
                        onUpload={(file) => handleFileUpload(file, (url) => updateSlide(idx, 'image', url))}
                      />
                      <input 
                        type="text" 
                        value={slide.image} 
                        onChange={e => updateSlide(idx, 'image', e.target.value)} 
                        className="w-full px-3 py-1.5 bg-transparent border border-brand-border rounded-lg text-[10px] font-mono mt-1 text-brand-light placeholder:text-brand-muted" 
                        placeholder="Или вставьте URL..." 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Ссылка кнопки</label>
                      <input type="text" value={slide.link || ''} onChange={e => updateSlide(idx, 'link', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Products */}
          <div className="space-y-4">
            <h4 className="font-medium text-brand-light flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-light"></span>
              Избранные товары
            </h4>
            <div className="bg-white/5 p-5 rounded-2xl border border-brand-border space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Заголовок секции (RU)</label>
                <input 
                  type="text" 
                  value={localHomeConfig.featuredProductsTitle}
                  onChange={e => setLocalHomeConfig({...localHomeConfig, featuredProductsTitle: e.target.value})}
                  className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">Заголовок секции (BE)</label>
                <input 
                  type="text" 
                  value={localHomeConfig.featuredProductsTitle_be || ''}
                  onChange={e => setLocalHomeConfig({...localHomeConfig, featuredProductsTitle_be: e.target.value})}
                  className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-brand-muted">ID товаров (через запятую)</label>
                <input 
                  type="text" 
                  value={localHomeConfig.featuredProductIds.join(', ')}
                  onChange={e => {
                    const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    setLocalHomeConfig({...localHomeConfig, featuredProductIds: ids});
                  }}
                  className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light"
                  placeholder="1, 2, 3"
                />
                <p className="text-xs text-brand-muted mt-1">Укажите ID товаров, которые нужно отобразить на главной.</p>
              </div>
            </div>
          </div>

          {/* Promo Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-brand-light flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-light"></span>
                Промо-изображения (Галерея)
              </h4>
              <button onClick={addPromoImage} className="text-sm font-medium text-brand-muted hover:text-brand-light flex items-center gap-1">
                <Plus className="w-4 h-4" /> Добавить фото
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {localHomeConfig.promoImages.map((img, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-brand-border relative group">
                  <button onClick={() => removePromoImage(idx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <ImageDropzone 
                    label={`Промо-фото ${idx + 1}`}
                    currentUrl={img}
                    onUpload={(file) => handleFileUpload(file, (url) => updatePromoImage(idx, url))}
                  />
                  <input 
                    type="text" 
                    value={img} 
                    onChange={e => updatePromoImage(idx, e.target.value)} 
                    className="w-full px-3 py-1.5 bg-transparent border border-brand-border rounded-lg text-[10px] font-mono mt-1 text-brand-light placeholder:text-brand-muted" 
                    placeholder="Или вставьте URL..." 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Blocks */}
          <div className="space-y-4">
            <h4 className="font-medium text-brand-light flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-light"></span>
              Динамические блоки товаров
            </h4>
            <div className="space-y-3">
              {localHomeConfig.dynamicBlocks.map((block, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-brand-border">
                  <div className="flex items-center gap-2 w-32">
                    <input 
                      type="checkbox" 
                      id={`block-${idx}`}
                      checked={block.active}
                      onChange={e => updateDynamicBlock(idx, 'active', e.target.checked)}
                      className="w-4 h-4 rounded border-brand-border text-brand-light focus:ring-brand-light"
                    />
                    <label htmlFor={`block-${idx}`} className="text-sm font-medium text-brand-light">{block.type}</label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={block.title}
                      onChange={e => updateDynamicBlock(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted"
                      placeholder="Заголовок блока (RU)..."
                    />
                    <input 
                      type="text" 
                      value={block.title_be || ''}
                      onChange={e => updateDynamicBlock(idx, 'title_be', e.target.value)}
                      className="w-full px-3 py-2 bg-transparent border border-brand-border rounded-lg text-sm text-brand-light placeholder:text-brand-muted"
                      placeholder="Заголовок блока (BE)..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeSection === 'pages' && (
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm">
          <h3 className="text-xl font-serif text-brand-light mb-6">Информационные страницы</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map(page => (
              <button 
                key={page.id}
                onClick={() => setEditingPage(page)}
                className="p-6 bg-white/5 rounded-2xl border border-brand-border text-left hover:border-brand-light transition-all"
              >
                <h4 className="font-medium text-brand-light">{page.title}</h4>
                <p className="text-xs text-brand-muted mt-1">Последнее обновление: {new Date(page.updatedAt).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingPage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-bg w-full max-w-4xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-brand-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif text-brand-light">Редактирование страницы: {editingPage.title}</h3>
              <button onClick={() => setEditingPage(null)}><XCircle className="w-6 h-6 text-brand-muted hover:text-brand-light" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Заголовок (RU)</label>
                <input 
                  type="text" 
                  value={editingPage.title}
                  onChange={e => setEditingPage({...editingPage, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-brand-border rounded-xl text-brand-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Заголовок (BE)</label>
                <input 
                  type="text" 
                  value={editingPage.title_be || ''}
                  onChange={e => setEditingPage({...editingPage, title_be: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-brand-border rounded-xl text-brand-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Контент (Markdown, RU)</label>
                <textarea 
                  rows={10}
                  value={editingPage.content}
                  onChange={e => setEditingPage({...editingPage, content: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-brand-border rounded-xl font-mono text-sm text-brand-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-brand-light">Контент (Markdown, BE)</label>
                <textarea 
                  rows={10}
                  value={editingPage.content_be || ''}
                  onChange={e => setEditingPage({...editingPage, content_be: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-brand-border rounded-xl font-mono text-sm text-brand-light"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingPage(null)} className="px-6 py-2 text-brand-muted hover:text-brand-light">Отмена</button>
                <button onClick={savePage} className="px-6 py-2 bg-brand-accent text-white rounded-xl hover:bg-brand-accent-hover">Сохранить изменения</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
