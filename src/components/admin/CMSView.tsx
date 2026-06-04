import React, { useState, useRef } from 'react';
import { CMSPage, HomeConfig, GeneralSettings } from '../../types';
import { XCircle, Plus, Trash2, GripVertical, Image as ImageIcon, UploadCloud, ArrowUp, ArrowDown, Eye, EyeOff, ChevronLeft, ChevronRight, Monitor, Smartphone, Globe, ArrowRight, Play, Sparkles } from 'lucide-react';
import { uploadImageChunks } from '../../utils/uploadUtils';
import FAQManager from './FAQManager';

interface CMSViewProps {
  pages: CMSPage[];
  homeConfig: HomeConfig | null;
  onUpdateHome: () => void;
  onUpdatePage: () => void;
  token: string;
  loading: boolean;
  activeSection: 'general' | 'home' | 'pages' | 'contacts';
}

export default function CMSView({ pages, homeConfig, onUpdateHome, onUpdatePage, token, loading, activeSection }: CMSViewProps) {
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [localHomeConfig, setLocalHomeConfig] = useState<HomeConfig | null>(homeConfig);
  const [localGeneralSettings, setLocalGeneralSettings] = useState<GeneralSettings | null>(null);

  // States for live interactive hero slides preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [previewLang, setPreviewLang] = useState<'ru' | 'be'>('ru');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

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
    // No size limit

    try {
      const url = await uploadImageChunks(file, token);
      callback(url);
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
      const isNew = isCreatingPage;
      const url = isNew ? '/api/admin/cms' : `/api/admin/cms/${editingPage.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingPage)
      });
      if (res.ok) {
        setEditingPage(null);
        setIsCreatingPage(false);
        onUpdatePage();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Произошла ошибка при сохранении');
      }
    } catch (err) { console.error(err); }
  };

  const deletePage = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту страницу? Это действие необратимо.')) return;
    try {
      const res = await fetch(`/api/admin/cms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onUpdatePage();
        if (editingPage?.id === id) {
          setEditingPage(null);
          setIsCreatingPage(false);
        }
      } else {
        alert('Ошибка при удалении');
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

  const addPopularBrand = () => {
    if (!localHomeConfig) return;
    const currentBrands = localHomeConfig.popularBrands || [
      {
        name: 'Byredo',
        name_be: 'Byredo',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
        desc: 'Шведский авангард и поэзия',
        desc_be: 'Швэдскі авангард і паэзія',
        active: true
      },
      {
        name: 'Le Labo',
        name_be: 'Le Labo',
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
        desc: 'Индустриальная эстетика Нью-Йорка',
        desc_be: 'Індустрыяльная эстэтыка Нью-Ёрка',
        active: true
      },
      {
        name: 'Tom Ford',
        name_be: 'Tom Ford',
        image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=800&auto=format&fit=crop',
        desc: 'Роскошь, смелость и чувственность',
        desc_be: 'Раскоша, смеласць і пачуццёвасць',
        active: true
      },
      {
        name: 'Creed',
        name_be: 'Creed',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
        desc: 'Монархическое величие и классика',
        desc_be: 'Манархічная веліч і класіка',
        active: true
      },
      {
        name: 'Kilian',
        name_be: 'Kilian',
        image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
        desc: 'Ночные тайны и парижский шик',
        desc_be: 'Начныя тайны і парыжскі шык',
        active: true
      },
      {
        name: 'Maison Francis Kurkdjian',
        name_be: 'Maison Francis Kurkdjian',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        desc: 'Ювелирная точность ароматов',
        desc_be: 'Ювелірная дакладнасць водараў',
        active: true
      }
    ];
    setLocalHomeConfig({
      ...localHomeConfig,
      popularBrands: [
        ...currentBrands,
        { name: 'Новый бренд', name_be: 'Новы брэнд', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop', desc: 'Описание бренда', desc_be: 'Апісанне брэнда', active: true }
      ]
    });
  };

  const updatePopularBrand = (index: number, field: string, value: any) => {
    if (!localHomeConfig) return;
    const currentBrands = localHomeConfig.popularBrands || [
      {
        name: 'Byredo',
        name_be: 'Byredo',
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
        desc: 'Шведский авангард и поэзия',
        desc_be: 'Швэдскі авангард і паэзія',
        active: true
      },
      {
        name: 'Le Labo',
        name_be: 'Le Labo',
        image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
        desc: 'Индустриальная эстетика Нью-Йорка',
        desc_be: 'Індустрыяльная эстэтыка Нью-Ёрка',
        active: true
      },
      {
        name: 'Tom Ford',
        name_be: 'Tom Ford',
        image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=800&auto=format&fit=crop',
        desc: 'Роскошь, смелость и чувственность',
        desc_be: 'Раскоша, смеласць і пачуццёвасць',
        active: true
      },
      {
        name: 'Creed',
        name_be: 'Creed',
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
        desc: 'Монархическое величие и классика',
        desc_be: 'Манархічная веліч і класіка',
        active: true
      },
      {
        name: 'Kilian',
        name_be: 'Kilian',
        image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop',
        desc: 'Ночные тайны и парижский шик',
        desc_be: 'Начныя тайны і парыжскі шык',
        active: true
      },
      {
        name: 'Maison Francis Kurkdjian',
        name_be: 'Maison Francis Kurkdjian',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
        desc: 'Ювелирная точность ароматов',
        desc_be: 'Ювелірная дакладнасць водараў',
        active: true
      }
    ];
    const newBrands = [...currentBrands];
    newBrands[index] = { ...newBrands[index], [field]: value };
    setLocalHomeConfig({
      ...localHomeConfig,
      popularBrands: newBrands
    });
  };

  const removePopularBrand = (index: number) => {
    if (!localHomeConfig) return;
    const currentBrands = localHomeConfig.popularBrands || [];
    const newBrands = currentBrands.filter((_, i) => i !== index);
    setLocalHomeConfig({
      ...localHomeConfig,
      popularBrands: newBrands
    });
  };

  const movePopularBrand = (index: number, direction: 'up' | 'down') => {
    if (!localHomeConfig) return;
    const currentBrands = localHomeConfig.popularBrands || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentBrands.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newBrands = [...currentBrands];
    const temp = newBrands[index];
    newBrands[index] = newBrands[targetIdx];
    newBrands[targetIdx] = temp;
    setLocalHomeConfig({
      ...localHomeConfig,
      popularBrands: newBrands
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {activeSection === 'general' && localGeneralSettings && (
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <h3 className="text-xl font-serif text-brand-light">О компании и статистика</h3>
            <button onClick={saveGeneralSettings} className="px-6 py-2 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors">Сохранить</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageDropzone 
              label="Фото для страницы 'О нас'"
              currentUrl={localGeneralSettings.aboutPhoto}
              onUpload={(file) => handleFileUpload(file, (url) => setLocalGeneralSettings({...localGeneralSettings, aboutPhoto: url}))}
            />
            <div className="space-y-4">
              <input type="text" value={localGeneralSettings.aboutTitle} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutTitle: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок 'О нас' (RU)" />
              <input type="text" value={localGeneralSettings.aboutTitle_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutTitle_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок 'О нас' (BE)" />
              <textarea value={localGeneralSettings.aboutDescription} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutDescription: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Описание 'О нас' (RU)" rows={3} />
              <textarea value={localGeneralSettings.aboutDescription_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutDescription_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Описание 'О нас' (BE)" rows={3} />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-brand-border">
            <h4 className="text-sm font-medium text-brand-muted uppercase tracking-wider">Наша философия (Раздел Art)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input type="text" value={localGeneralSettings.aboutArtTitle} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtTitle: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок (RU)" />
                <input type="text" value={localGeneralSettings.aboutArtTitle_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtTitle_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Заголовок (BE)" />
              </div>
              <div className="space-y-4">
                <textarea value={localGeneralSettings.aboutArtText1} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText1: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 1 (RU)" rows={3} />
                <textarea value={localGeneralSettings.aboutArtText1_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText1_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 1 (BE)" rows={3} />
                <textarea value={localGeneralSettings.aboutArtText2} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText2: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 2 (RU)" rows={3} />
                <textarea value={localGeneralSettings.aboutArtText2_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, aboutArtText2_be: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Текст 2 (BE)" rows={3} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-brand-border">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2 bg-white/5 p-4 rounded-2xl border border-brand-border">
                <p className="text-[10px] uppercase tracking-widest text-brand-muted mb-2 font-bold">Статистика {i}</p>
                <input type="text" value={localGeneralSettings[`stat${i}Value` as keyof GeneralSettings] as string} onChange={e => setLocalGeneralSettings({...localGeneralSettings, [`stat${i}Value`]: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Значение (напр. 50+)" />
                <input type="text" value={localGeneralSettings[`stat${i}Label` as keyof GeneralSettings] as string} onChange={e => setLocalGeneralSettings({...localGeneralSettings, [`stat${i}Label`]: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Лейбл (RU)" />
                <input type="text" value={(localGeneralSettings[`stat${i}Label_be` as keyof GeneralSettings] as string) || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, [`stat${i}Label_be`]: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Лейбл (BE)" />
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-brand-border">
            <h4 className="border-l-2 border-brand-accent pl-4 text-sm font-medium text-brand-muted uppercase tracking-wider">SEO по умолчанию (если не задано на странице)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-5 rounded-2xl">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-brand-muted">SEO Заголовок по умолчанию</label>
                <input type="text" value={localGeneralSettings.seoTitle || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, seoTitle: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-brand-muted">SEO Описание по умолчанию</label>
                <textarea value={localGeneralSettings.seoDescription || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, seoDescription: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light" rows={2} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-brand-border">
            <h4 className="border-l-2 border-brand-accent pl-4 text-sm font-medium text-brand-muted uppercase tracking-wider">Интеграция с Поисковыми Системами (Яндекс / Google)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-5 rounded-2xl text-left">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-brand-muted block">Верификация Яндекс.Вебмастер</label>
                <input 
                  type="text" 
                  value={localGeneralSettings.yandexVerification || ''} 
                  onChange={e => setLocalGeneralSettings({...localGeneralSettings, yandexVerification: e.target.value})} 
                  placeholder="напр. 6e3fdf89b9d4e21a" 
                  className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted focus:border-brand-accent outline-none animate-none" 
                  id="seo_yandex_verify"
                />
                <span className="text-[9px] text-brand-muted leading-tight block mt-1">Отобразится в meta-теге, а также будет отвечать по ссылке /yandex_[код].html</span>
              </div>
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-brand-muted block">Верификация Google Search Console</label>
                <input 
                  type="text" 
                  value={localGeneralSettings.googleVerification || ''} 
                  onChange={e => setLocalGeneralSettings({...localGeneralSettings, googleVerification: e.target.value})} 
                  placeholder="напр. AaBbCcDdEeFf_GgHhIiJj" 
                  className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted focus:border-brand-accent outline-none animate-none" 
                  id="seo_google_verify"
                />
                <span className="text-[9px] text-brand-muted leading-tight block mt-1">Отобразится в meta-теге, а также будет отвечать по ссылке /google[код].html</span>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-brand-muted block">Номер счетчика Яндекс.Метрика</label>
                <input 
                  type="text" 
                  value={localGeneralSettings.yandexMetrica || ''} 
                  onChange={e => setLocalGeneralSettings({...localGeneralSettings, yandexMetrica: e.target.value})} 
                  placeholder="напр. 98765432" 
                  className="w-full px-4 py-2.5 bg-transparent border border-brand-border rounded-xl text-sm text-brand-light placeholder:text-brand-muted focus:border-brand-accent outline-none animate-none" 
                  id="seo_yandex_counter"
                />
                <span className="text-[9px] text-brand-muted leading-tight block mt-1">Подключит аналитику и Вебвизор, что ускорит индексацию в Яндекс и повысит позиции за счет отслеживания поведенческих факторов.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'contacts' && localGeneralSettings && (
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-serif text-brand-light tracking-wide uppercase">Контакты и Соцсети</h3>
            </div>
            <button onClick={saveGeneralSettings} className="px-8 py-2.5 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-all shadow-lg hover:shadow-brand-accent/20 active:scale-[0.98]">
              Обновить контакты
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                Текст главной секции 'Контактов'
              </h4>
              <div className="grid gap-4">
                <div className="space-y-1.5 border border-brand-border rounded-xl p-4 bg-white/5">
                  <label className="text-[10px] font-bold text-brand-muted uppercase mb-1 block">Заголовок (RU / BE)</label>
                  <input type="text" value={localGeneralSettings.contactsTitle || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, contactsTitle: e.target.value})} className="w-full px-4 py-2 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light mb-2" placeholder="Свяжитесь с нами" />
                  <input type="text" value={localGeneralSettings.contactsTitle_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, contactsTitle_be: e.target.value})} className="w-full px-4 py-2 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Звяжыцеся з намі" />
                </div>
                <div className="space-y-1.5 border border-brand-border rounded-xl p-4 bg-white/5">
                  <label className="text-[10px] font-bold text-brand-muted uppercase mb-1 block">Описание (RU / BE)</label>
                  <textarea value={localGeneralSettings.contactsDescription || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, contactsDescription: e.target.value})} className="w-full px-4 py-2 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light mb-2" placeholder="Мы будем рады ответить..." rows={2} />
                  <textarea value={localGeneralSettings.contactsDescription_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, contactsDescription_be: e.target.value})} className="w-full px-4 py-2 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Мы будзем рады адказаць..." rows={2} />
                </div>
              </div>

              <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-4 mt-8 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                Связь с нами
              </h4>
              <div className="grid gap-4">
                <div className="space-y-1.5 p-4 bg-white/5 border border-brand-border rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-brand-muted uppercase">Телефон</label>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={localGeneralSettings.showContactsPhone !== false} onChange={e => setLocalGeneralSettings({...localGeneralSettings, showContactsPhone: e.target.checked})} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${localGeneralSettings.showContactsPhone !== false ? 'bg-brand-accent' : 'bg-brand-muted/30'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localGeneralSettings.showContactsPhone !== false ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-2 text-xs text-brand-muted">Отображать на стр. Контакты</span>
                    </label>
                  </div>
                  <input type="text" value={localGeneralSettings.phone} onChange={e => setLocalGeneralSettings({...localGeneralSettings, phone: e.target.value})} className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light focus:border-brand-accent transition-colors" placeholder="+375 (...)" />
                </div>
                <div className="space-y-1.5 p-4 bg-white/5 border border-brand-border rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-brand-muted uppercase">Email</label>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={localGeneralSettings.showContactsEmail !== false} onChange={e => setLocalGeneralSettings({...localGeneralSettings, showContactsEmail: e.target.checked})} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${localGeneralSettings.showContactsEmail !== false ? 'bg-brand-accent' : 'bg-brand-muted/30'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localGeneralSettings.showContactsEmail !== false ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-2 text-xs text-brand-muted">Отображать на стр. Контакты</span>
                    </label>
                  </div>
                  <input type="text" value={localGeneralSettings.email} onChange={e => setLocalGeneralSettings({...localGeneralSettings, email: e.target.value})} className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light focus:border-brand-accent transition-colors" placeholder="hello@arhetip.by" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-muted uppercase px-1">Время работы (RU)</label>
                    <input type="text" value={localGeneralSettings.workingHours} onChange={e => setLocalGeneralSettings({...localGeneralSettings, workingHours: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light focus:border-brand-accent transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-brand-muted uppercase px-1">Час працы (BE)</label>
                    <input type="text" value={localGeneralSettings.workingHours_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, workingHours_be: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light focus:border-brand-accent transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em]">Мессенджеры и Соцсети</h4>
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer" title="Отображать блок на странице контактов">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={localGeneralSettings.showContactsSocials !== false} onChange={e => setLocalGeneralSettings({...localGeneralSettings, showContactsSocials: e.target.checked})} />
                      <div className={`block w-8 h-4 rounded-full transition-colors ${localGeneralSettings.showContactsSocials !== false ? 'bg-brand-accent' : 'bg-brand-muted/30'}`}></div>
                      <div className={`dot absolute left-1 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${localGeneralSettings.showContactsSocials !== false ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-brand-muted">На странице</span>
                  </label>
                  <button 
                    onClick={() => {
                      const links = localGeneralSettings.socialLinks || [];
                      setLocalGeneralSettings({
                        ...localGeneralSettings,
                        socialLinks: [...links, { platform: 'instagram', url: '', active: true }]
                      });
                    }}
                    className="text-[10px] font-bold text-brand-accent uppercase tracking-wider hover:text-brand-accent-hover transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Добавить
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Legacy Fields (Automatically sync back if changed, but we prefer socialLinks) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" value={localGeneralSettings.instagram} onChange={e => setLocalGeneralSettings({...localGeneralSettings, instagram: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Instagram URL (Legacy)" />
                  <input type="text" value={localGeneralSettings.telegram} onChange={e => setLocalGeneralSettings({...localGeneralSettings, telegram: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Telegram URL (Legacy)" />
                </div>

                {/* Dynamic Social Links */}
                <div className="space-y-3 pt-4 border-t border-brand-border/30">
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-2 font-medium">Дополнительные и настраиваемые ссылки:</p>
                  {(localGeneralSettings.socialLinks || []).map((link, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-brand-border group">
                      <select 
                        value={link.platform}
                        onChange={(e) => {
                          const links = [...(localGeneralSettings.socialLinks || [])];
                          links[idx].platform = e.target.value as any;
                          setLocalGeneralSettings({...localGeneralSettings, socialLinks: links});
                        }}
                        className="bg-brand-bg text-xs text-brand-light px-2 py-1.5 rounded-lg border border-brand-border outline-none focus:border-brand-accent"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="telegram">Telegram</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="viber">Viber</option>
                        <option value="vkontakte">VK</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="other">Другое</option>
                      </select>
                      
                      <input 
                        type="text" 
                        value={link.url}
                        onChange={(e) => {
                          const links = [...(localGeneralSettings.socialLinks || [])];
                          links[idx].url = e.target.value;
                          setLocalGeneralSettings({...localGeneralSettings, socialLinks: links});
                        }}
                        placeholder="https://..."
                        className="flex-1 bg-transparent border-none text-sm text-brand-light placeholder:text-brand-muted outline-none"
                      />

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const links = [...(localGeneralSettings.socialLinks || [])];
                            links[idx].active = !links[idx].active;
                            setLocalGeneralSettings({...localGeneralSettings, socialLinks: links});
                          }}
                          title={link.active ? "Скрыть" : "Показать"}
                          className={`p-1.5 rounded-lg transition-colors ${link.active ? 'text-green-400 bg-green-400/10' : 'text-brand-muted bg-white/5'}`}
                        >
                          {link.active ? <Plus className="w-3.5 h-3.5 rotate-45" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => {
                            const links = (localGeneralSettings.socialLinks || []).filter((_, i) => i !== idx);
                            setLocalGeneralSettings({...localGeneralSettings, socialLinks: links});
                          }}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(localGeneralSettings.socialLinks || []).length === 0 && (
                    <p className="text-xs text-brand-muted text-center py-4">Нет дополнительных ссылок. Нажмите "Добавить ссылку", чтобы расширить блок в шапке и подвале.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-brand-border">
            <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-6 underline decoration-brand-accent/30 underline-offset-8">Юридические данные</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 p-4 bg-white/5 border border-brand-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-medium text-brand-muted uppercase">Юридический адрес и Студия</label>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={localGeneralSettings.showContactsAddress !== false} onChange={e => setLocalGeneralSettings({...localGeneralSettings, showContactsAddress: e.target.checked})} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${localGeneralSettings.showContactsAddress !== false ? 'bg-brand-accent' : 'bg-brand-muted/30'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localGeneralSettings.showContactsAddress !== false ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-2 text-xs text-brand-muted">Отображать на стр. Контакты</span>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-muted uppercase px-1">Адрес (RU)</label>
                  <input type="text" value={localGeneralSettings.address} onChange={e => setLocalGeneralSettings({...localGeneralSettings, address: e.target.value})} className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light focus:border-brand-accent transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-muted uppercase px-1">Адрас (BE)</label>
                  <input type="text" value={localGeneralSettings.address_be || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, address_be: e.target.value})} className="w-full px-4 py-3 bg-brand-bg/50 border border-brand-border rounded-xl text-sm text-brand-light focus:border-brand-accent transition-colors" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-brand-muted uppercase px-1">УНП / Реквизиты</label>
                  <div className="flex gap-4">
                    <input type="text" value={localGeneralSettings.unp || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, unp: e.target.value})} className="w-1/3 px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light" placeholder="УНП" />
                    <input type="text" value={localGeneralSettings.bankDetails || ''} onChange={e => setLocalGeneralSettings({...localGeneralSettings, bankDetails: e.target.value})} className="w-2/3 px-4 py-3 bg-white/5 border border-brand-border rounded-xl text-sm text-brand-light" placeholder="Банковские реквизиты" />
                  </div>
                </div>
              </div>
            </div>
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
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="hideHeroTitles"
                    checked={localHomeConfig.hero.hideTitles || false}
                    onChange={e => setLocalHomeConfig({
                      ...localHomeConfig, 
                      hero: { ...localHomeConfig.hero, hideTitles: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-brand-border text-brand-light focus:ring-brand-light"
                  />
                  <label htmlFor="hideHeroTitles" className="text-sm font-medium text-brand-light">Скрыть надписи</label>
                </div>
                
                {/* Banner Preview Button */}
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                    isPreviewOpen
                      ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30 rounded-lg'
                      : 'text-brand-muted hover:text-brand-light border border-transparent'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Предпросмотр</span>
                </button>

                <button onClick={addSlide} className="text-sm font-medium text-brand-muted hover:text-brand-light flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Добавить слайд
                </button>
              </div>
            </div>

            {/* Premium Interactive Live Preview Section */}
            {isPreviewOpen && (
              <div className="bg-white/5 border border-brand-border p-6 rounded-2xl space-y-6">
                {/* Simulator controls header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border/40 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
                    </span>
                    <span className="text-xs uppercase tracking-[0.12em] font-mono text-brand-light font-semibold">
                      Живой интерактивный предпросмотр баннера
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Device select */}
                    <div className="flex items-center bg-black/40 border border-brand-border rounded-lg p-1 text-[11px] gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                          previewDevice === 'desktop'
                            ? 'bg-brand-accent text-white font-medium'
                            : 'text-brand-muted hover:text-brand-light'
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Десктоп</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
                          previewDevice === 'mobile'
                            ? 'bg-brand-accent text-white font-medium'
                            : 'text-brand-muted hover:text-brand-light'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Мобильный</span>
                      </button>
                    </div>

                    {/* Language select */}
                    <div className="flex items-center bg-black/40 border border-brand-border rounded-lg p-1 text-[11px] gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewLang('ru')}
                        className={`px-2.5 py-1 rounded transition-all ${
                          previewLang === 'ru'
                            ? 'bg-brand-accent/20 text-brand-accent font-medium border border-brand-accent/30'
                            : 'text-brand-muted hover:text-brand-light border border-transparent'
                        }`}
                      >
                        RU
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewLang('be')}
                        className={`px-2.5 py-1 rounded transition-all ${
                          previewLang === 'be'
                            ? 'bg-brand-accent/20 text-brand-accent font-medium border border-brand-accent/30'
                            : 'text-brand-muted hover:text-brand-light border border-transparent'
                        }`}
                      >
                        BE
                      </button>
                    </div>
                  </div>
                </div>

                {/* Banner canvas */}
                <div className="flex justify-center bg-black/30 p-4 border border-brand-border/30 rounded-xl overflow-hidden min-h-[300px] items-center">
                  <div
                    className={`relative bg-neutral-950 transition-all duration-300 overflow-hidden shadow-2xl ${
                      previewDevice === 'desktop'
                        ? 'w-full aspect-[21/9] min-h-[220px] max-h-[360px] border border-brand-border/40'
                        : 'w-[260px] sm:w-[300px] h-[440px] rounded-[32px] border-[8px] border-neutral-800 relative shadow-2xl'
                    }`}
                  >
                    {/* Simulated screen inside device */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
                      {localHomeConfig.hero.slides.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-brand-muted text-xs p-6 text-center">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                          <span>Добавьте слайды, чтобы увидеть превью баннера</span>
                        </div>
                      ) : (() => {
                        const totalSlides = localHomeConfig.hero.slides.length;
                        const validIndex = Math.min(previewSlide, totalSlides - 1);
                        const actIndex = validIndex >= 0 ? validIndex : 0;
                        const s = localHomeConfig.hero.slides[actIndex];
                        if (!s) return null;
                        const displayImg = (previewDevice === 'mobile' && s.mobileImage) ? s.mobileImage : s.image;
                        const displaySubtitle = previewLang === 'be' ? (s.subtitle_be || s.subtitle) : s.subtitle;
                        const displayTitle = previewLang === 'be' ? (s.title_be || s.title) : s.title;

                        return (
                          <div className="w-full h-full bg-neutral-900 flex flex-col justify-end text-center relative">
                            {displayImg ? (
                              <>
                                <img
                                  src={displayImg}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover brightness-[0.7] transform scale-102 transition-all duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45 transition-all" />
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 border border-brand-border/30 text-brand-muted text-[10px] px-4 text-center">
                                <ImageIcon className="w-8 h-8 opacity-45 mb-1" />
                                <span>[Изображение не добавлено / Нет ссылки]</span>
                              </div>
                            )}

                            {/* Text content overlay */}
                            <div className="absolute inset-x-0 bottom-[14%] px-4 z-10 flex flex-col items-center justify-end text-center">
                              {!localHomeConfig.hero.hideTitles && (
                                <div className="text-center max-w-full space-y-1.5 mb-3.5 sm:mb-5">
                                  {displaySubtitle && (
                                    <p className="text-[7px] sm:text-[9px] font-semibold tracking-[0.3em] text-brand-accent uppercase">
                                      {displaySubtitle}
                                    </p>
                                  )}
                                  {displayTitle && (
                                    <h1 className="text-[10px] sm:text-sm md:text-base text-white font-sans font-light tracking-[0.14em] leading-snug uppercase break-keep line-clamp-2 px-1">
                                      {displayTitle}
                                    </h1>
                                  )}
                                </div>
                              )}

                              {/* Shop collections button */}
                              <div className="inline-flex items-center gap-1 bg-brand-accent text-white px-4 py-2 text-[7px] sm:text-[9px] font-semibold uppercase tracking-[0.2em]">
                                <span>В каталог</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </div>
                            </div>

                            {/* Simulator pagination dots */}
                            {totalSlides > 1 && (
                              <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 z-20 flex gap-1.5 items-center">
                                {localHomeConfig.hero.slides.map((_, dotIdx) => (
                                  <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={() => setPreviewSlide(dotIdx)}
                                    className={`h-[2px] rounded-none transition-all duration-300 ${
                                      actIndex === dotIdx ? 'w-5 bg-brand-accent' : 'w-1.5 bg-white/20 hover:bg-white/40'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Simulator left/right controls inside banner */}
                            {totalSlides > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
                                  className="absolute left-[3%] top-1/2 -translate-y-1/2 z-25 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-1.5 rounded-full transition-all"
                                  title="Предыдущий слайд"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewSlide((prev) => (prev + 1) % totalSlides)}
                                  className="absolute right-[3%] top-1/2 -translate-y-1/2 z-25 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-1.5 rounded-full transition-all"
                                  title="Следующий слайд"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-[9px] text-brand-muted">
                  * Изменения в слайдах (названия, фото, ссылки) отображаются моментально. Проверьте обе версии, затем нажмите «Сохранить настройки» вверху для публикации.
                </div>
              </div>
            )}

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
                    <div className="space-y-1">
                      <ImageDropzone 
                        label="Десктоп (основное)"
                        currentUrl={slide.image}
                        onUpload={(file) => handleFileUpload(file, (url) => updateSlide(idx, 'image', url))}
                      />
                      <input 
                        type="text" 
                        value={slide.image} 
                        onChange={e => updateSlide(idx, 'image', e.target.value)} 
                        className="w-full px-3 py-1.5 bg-transparent border border-brand-border rounded-lg text-[10px] font-mono mt-1 text-brand-light placeholder:text-brand-muted" 
                        placeholder="URL десктоп..." 
                      />
                    </div>
                    <div className="space-y-1">
                      <ImageDropzone 
                        label="Мобильная версия (постер)"
                        currentUrl={slide.mobileImage || ''}
                        onUpload={(file) => handleFileUpload(file, (url) => updateSlide(idx, 'mobileImage', url))}
                      />
                      <input 
                        type="text" 
                        value={slide.mobileImage || ''} 
                        onChange={e => updateSlide(idx, 'mobileImage', e.target.value)} 
                        className="w-full px-3 py-1.5 bg-transparent border border-brand-border rounded-lg text-[10px] font-mono mt-1 text-brand-light placeholder:text-brand-muted" 
                        placeholder="URL мобильный..." 
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

          {/* Popular Brands (Collections) Controller */}
          <div className="space-y-4 pt-6 border-t border-brand-border">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-brand-light flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                Карточки селективных брендов / Коллекций
              </h4>
              <button
                type="button"
                onClick={addPopularBrand}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent hover:text-white transition-all text-xs font-semibold uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                Добавить бренд
              </button>
            </div>
            
            <p className="text-xs text-brand-muted leading-relaxed">
              Здесь вы можете полностью контролировать отображение плитки брендов (коллекций) на главной странице. Меняйте порядок стрелками, включайте/выключайте, редактируйте тексты на русском и белорусском языках и загружайте изображения.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
              {((localHomeConfig.popularBrands && localHomeConfig.popularBrands.length > 0)
                ? localHomeConfig.popularBrands
                : [
                    { name: 'Byredo', name_be: 'Byredo', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop', desc: 'Шведский авангард и поэзия', desc_be: 'Швэдскі авангард і паэзія', active: true },
                    { name: 'Le Labo', name_be: 'Le Labo', image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop', desc: 'Индустриальная эстетика Нью-Йорка', desc_be: 'Індустрыяльная эстэтыка Нью-Ёрка', active: true },
                    { name: 'Tom Ford', name_be: 'Tom Ford', image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=800&auto=format&fit=crop', desc: 'Роскошь, смелость и чувственность', desc_be: 'Раскоша, смеласць і пачуццёвасць', active: true },
                    { name: 'Creed', name_be: 'Creed', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop', desc: 'Монархическое величие и классика', desc_be: 'Манархічная веліч і класіка', active: true },
                    { name: 'Kilian', name_be: 'Kilian', image: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=800&auto=format&fit=crop', desc: 'Ночные тайны и парижский шик', desc_be: 'Начныя тайны і парыжскі шык', active: true },
                    { name: 'Maison Francis Kurkdjian', name_be: 'Maison Francis Kurkdjian', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop', desc: 'Ювелирная точность ароматов', desc_be: 'Ювелірная дакладнасць водараў', active: true }
                  ]
              ).map((brand, bIdx) => (
                <div key={bIdx} className="bg-white/5 border border-brand-border rounded-2xl p-5 flex flex-col gap-4 relative group/item">
                  {/* Top bar control buttons */}
                  <div className="flex justify-between items-center pb-3 border-b border-brand-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-brand-muted uppercase bg-brand-light/5 px-2.5 py-1">
                        Бренд #{bIdx + 1}
                      </span>
                      {brand.active === false ? (
                        <span className="text-[9px] bg-red-950/40 border border-red-900/40 text-red-400 px-2 py-0.5 font-medium rounded">
                          Выключен
                        </span>
                      ) : (
                        <span className="text-[9px] bg-green-950/40 border border-green-900/40 text-green-400 px-2 py-0.5 font-medium rounded">
                          Активен
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => movePopularBrand(bIdx, 'up')}
                        disabled={bIdx === 0}
                        className="p-1.5 hover:bg-white/10 text-brand-light disabled:opacity-30 rounded transition-colors"
                        title="Переместить выше"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => movePopularBrand(bIdx, 'down')}
                        disabled={bIdx === (((localHomeConfig.popularBrands || []).length || 6) - 1)}
                        className="p-1.5 hover:bg-white/10 text-brand-light disabled:opacity-30 rounded transition-colors"
                        title="Переместить ниже"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => updatePopularBrand(bIdx, 'active', brand.active === false ? true : false)}
                        className={`p-1.5 rounded transition-colors ${brand.active === false ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-green-900/20 text-green-400'}`}
                        title={brand.active === false ? "Включить отображение" : "Выключить отображение"}
                      >
                        {brand.active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removePopularBrand(bIdx)}
                        className="p-1.5 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                        title="Удалить карточку"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Brand Grid Layout: Image preview left, fields right */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Left: Image with Mini Uploader */}
                    <div className="sm:col-span-4 flex flex-col gap-2">
                      <div className="aspect-[4/3] w-full bg-black/40 border border-brand-border/60 overflow-hidden relative">
                        {brand.image ? (
                          <img
                            src={brand.image}
                            alt="Brand Preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs text-brand-muted">
                            <ImageIcon className="w-6 h-6 mb-1 text-brand-muted/40" />
                            Нет фото
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Input Overlay Button */}
                      <label className="cursor-pointer text-center bg-white/5 border border-brand-border/60 hover:border-brand-accent/40 hover:bg-brand-accent/5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-brand-light transition-all flex items-center justify-center gap-1.5 hover:text-brand-accent">
                        <UploadCloud className="w-3.5 h-3.5" />
                        Загрузить
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], (url) => updatePopularBrand(bIdx, 'image', url));
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Right: Fields */}
                    <div className="sm:col-span-8 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-brand-muted">Название (RU)</label>
                          <input
                            type="text"
                            value={brand.name}
                            onChange={(e) => updatePopularBrand(bIdx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-brand-bg/40 border border-brand-border rounded-lg text-xs text-brand-light"
                            placeholder="например, Byredo"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-brand-muted">Название (BE)</label>
                          <input
                            type="text"
                            value={brand.name_be || ''}
                            onChange={(e) => updatePopularBrand(bIdx, 'name_be', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-brand-bg/40 border border-brand-border rounded-lg text-xs text-brand-light"
                            placeholder="например, Byredo"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-brand-muted">Описание (RU)</label>
                        <input
                          type="text"
                          value={brand.desc}
                          onChange={(e) => updatePopularBrand(bIdx, 'desc', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-brand-bg/40 border border-brand-border rounded-lg text-xs text-brand-light"
                          placeholder="Шведский авангард и поэзия"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-brand-muted">Описание (BE)</label>
                        <input
                          type="text"
                          value={brand.desc_be || ''}
                          onChange={(e) => updatePopularBrand(bIdx, 'desc_be', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-brand-bg/40 border border-brand-border rounded-lg text-xs text-brand-light"
                          placeholder="Швэдскі авангард і паэзія"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-brand-muted">Ссылка на изображение URL</label>
                        <input
                          type="text"
                          value={brand.image}
                          onChange={(e) => updatePopularBrand(bIdx, 'image', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-brand-bg/40 border border-brand-border rounded-lg text-[10px] text-brand-light/70 font-mono text-ellipsis overflow-hidden"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-brand-border">
            <h4 className="font-medium text-brand-light flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
              SEO настройки Главной страницы
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-accent/5 p-6 rounded-2xl border border-brand-accent/20">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-brand-muted">SEO Заголовок (Title)</label>
                <input type="text" value={localHomeConfig.seoTitle || ''} onChange={e => setLocalHomeConfig({...localHomeConfig, seoTitle: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-white" placeholder="АРХЕТИП | Элитная парфюмерия и отливанты" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-brand-muted">SEO Описание (Meta Description)</label>
                <textarea value={localHomeConfig.seoDescription || ''} onChange={e => setLocalHomeConfig({...localHomeConfig, seoDescription: e.target.value})} className="w-full px-4 py-2 bg-transparent border border-brand-border rounded-xl text-sm text-white" rows={2} placeholder="Опишите ваш магазин для поисковых систем..." />
              </div>
            </div>
          </div>

        </div>
      )}

      {activeSection === 'pages' && (
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif text-brand-light">Информационные страницы</h3>
            <button
              onClick={() => {
                setEditingPage({ id: '', title: '', content: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
                setIsCreatingPage(true);
              }}
              className="px-4 py-2 bg-brand-accent text-white rounded-xl hover:bg-brand-accent-hover text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Создать страницу
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map(page => (
              <div
                key={page.id}
                className="p-6 bg-white/5 rounded-2xl border border-brand-border text-left hover:border-brand-light transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-medium text-brand-light">{page.title}</h4>
                  <p className="text-xs text-brand-muted mt-1 font-mono">/{page.id}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => { setEditingPage(page); setIsCreatingPage(false); }} className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-brand-border rounded-lg text-sm transition-colors text-brand-light">
                    Редактировать
                  </button>
                  <button onClick={() => deletePage(page.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors" title="Удалить">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <FAQManager token={token} />
        </div>
      )}

      {editingPage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-bg w-full max-w-4xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-brand-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif text-brand-light">
                {isCreatingPage ? 'Новая страница' : `Редактирование: ${editingPage.title}`}
              </h3>
              <button onClick={() => { setEditingPage(null); setIsCreatingPage(false); }}><XCircle className="w-6 h-6 text-brand-muted hover:text-brand-light" /></button>
            </div>
            <div className="space-y-4">
              {isCreatingPage && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-brand-light">URL код (slug)</label>
                  <input 
                    type="text" 
                    value={editingPage.id}
                    onChange={e => setEditingPage({...editingPage, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                    className="w-full px-4 py-2 bg-white/5 border border-brand-border rounded-xl text-brand-light font-mono"
                    placeholder="напр. about-us, delivery-info"
                  />
                  <p className="text-xs text-brand-muted mt-1">Допускаются только латинские буквы, цифры и дефис.</p>
                </div>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-brand-border pt-4 mt-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted">SEO Заголовок</label>
                  <input type="text" value={editingPage.seoTitle || ''} onChange={e => setEditingPage({...editingPage, seoTitle: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted">SEO Описание</label>
                  <textarea value={editingPage.seoDescription || ''} onChange={e => setEditingPage({...editingPage, seoDescription: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-brand-border rounded-lg text-sm text-brand-light" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setEditingPage(null); setIsCreatingPage(false); }} className="px-6 py-2 text-brand-muted hover:text-brand-light">Отмена</button>
                <button onClick={savePage} className="px-6 py-2 bg-brand-accent text-white rounded-xl hover:bg-brand-accent-hover">
                  {isCreatingPage ? 'Создать страницу' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
