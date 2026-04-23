import React, { useState, useEffect } from 'react';
import { Product, Order, User, Review, CMSPage, HomeConfig } from '../types';
import { LogOut, Lock, LayoutDashboard, ShoppingBag, Package, Users, MessageSquare, FileText, BarChart3, AlertCircle, RefreshCw, Settings, Home, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../components/ThemeProvider';

// Modular View Components
import DashboardView from '../components/admin/DashboardView';
import OrdersView from '../components/admin/OrdersView';
import InventoryView from '../components/admin/InventoryView';
import CustomersView from '../components/admin/CustomersView';
import ReviewsView from '../components/admin/ReviewsView';
import CMSView from '../components/admin/CMSView';
import ReportsView from '../components/admin/ReportsView';
import PromoCodesView from '../components/admin/PromoCodesView';
import AbandonedCartsView from '../components/admin/AbandonedCartsView';
import { Tag, ShoppingCart } from 'lucide-react';

export default function AdminPanel() {
  const { theme } = useTheme();
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'orders' | 'customers' | 'reviews' | 'cms-general' | 'cms-home' | 'cms-pages' | 'reports' | 'promo' | 'carts'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cmsPages, setCmsPages] = useState<CMSPage[]>([]);
  const [homeConfig, setHomeConfig] = useState<HomeConfig | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    orders: { page: 1, total: 0, limit: 10 },
    customers: { page: 1, total: 0, limit: 10 },
    reviews: { page: 1, total: 0, limit: 10 }
  });

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      if (!res.ok) throw new Error('Неверные учетные данные');
      const data = await res.json();
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Не удалось загрузить товары');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDashboardData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchOrders = async (page = pagination.orders.page) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=${pagination.orders.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setOrders(result.data);
        setPagination(prev => ({
          ...prev,
          orders: { ...prev.orders, page: result.page, total: result.total }
        }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async (page = pagination.customers.page) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=${pagination.customers.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setUsers(result.data);
        setPagination(prev => ({
          ...prev,
          customers: { ...prev.customers, page: result.page, total: result.total }
        }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchReviews = async (page = pagination.reviews.page) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=${pagination.reviews.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setReviews(result.data);
        setPagination(prev => ({
          ...prev,
          reviews: { ...prev.reviews, page: result.page, total: result.total }
        }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCMSData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cmsRes, homeRes] = await Promise.all([
        fetch('/api/admin/cms', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/settings/home')
      ]);
      
      if (cmsRes.ok) setCmsPages(await cmsRes.json());
      if (homeRes.ok) setHomeConfig(await homeRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      switch (activeTab) {
        case 'dashboard': fetchDashboardData(); break;
        case 'inventory': fetchProducts(); break;
        case 'orders': fetchOrders(); break;
        case 'customers': fetchUsers(); break;
        case 'reviews': fetchReviews(); break;
        case 'cms-general':
        case 'cms-home':
        case 'cms-pages': fetchCMSData(); break;
      }
    }
  }, [token, activeTab]);

  if (!token) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-24 bg-white/5 p-8 rounded-3xl shadow-sm border border-brand-border mx-4 sm:mx-auto"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-brand-light" />
          </div>
          <h1 className="text-2xl font-serif text-brand-light">Доступ администратора</h1>
          <p className="text-brand-muted text-sm mt-2">Пожалуйста, войдите для управления магазином.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Имя пользователя</label>
            <input 
              type="text" 
              required 
              minLength={3}
              value={loginData.username} 
              onChange={e => setLoginData({...loginData, username: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none text-brand-light" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-brand-muted ml-1">Пароль</label>
            <input 
              type="password" 
              required 
              minLength={6}
              value={loginData.password} 
              onChange={e => setLoginData({...loginData, password: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-brand-border rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none text-brand-light" 
            />
          </div>

          {loginError && (
            <p className="text-red-500 dark:text-red-400 text-sm text-center py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{loginError}</p>
          )}

          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full py-4 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent-hover transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Войти'}
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-bg text-brand-light relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-brand-border flex flex-col bg-brand-bg transform transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex`}>
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <h1 className="text-xl font-serif text-brand-light">Панель управления</h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-brand-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Сводка', icon: LayoutDashboard },
            { id: 'orders', label: 'Заказы', icon: ShoppingBag },
            { id: 'inventory', label: 'Товары', icon: Package },
            { id: 'customers', label: 'Клиенты', icon: Users },
            { id: 'promo', label: 'Промокоды', icon: Tag },
            { id: 'carts', label: 'Брошенные корзины', icon: ShoppingCart },
            { id: 'reports', label: 'Отчеты', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === tab.id ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}

          <div className="pt-6 mt-6 border-t border-brand-border">
            <p className="px-4 text-xs font-medium uppercase tracking-wider text-brand-muted mb-3">Контент</p>
            {[
              { id: 'cms-general', label: 'Общие настройки', icon: Settings },
              { id: 'cms-home', label: 'Главная страница', icon: Home },
              { id: 'cms-pages', label: 'Информационные', icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === tab.id ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-white hover:bg-white/5'}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen w-full">
        {/* Header */}
        <header className="h-16 border-b border-brand-border flex items-center justify-between px-4 md:px-8 bg-brand-bg sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-brand-muted hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-medium text-brand-light hidden sm:block">
              {activeTab === 'dashboard' && 'Сводка'}
              {activeTab === 'orders' && 'Заказы'}
              {activeTab === 'inventory' && 'Товары'}
              {activeTab === 'customers' && 'Клиенты'}
              {activeTab === 'promo' && 'Промокоды'}
              {activeTab === 'carts' && 'Брошенные корзины'}
              {activeTab === 'reports' && 'Отчеты'}
              {activeTab === 'cms-general' && 'Общие настройки'}
              {activeTab === 'cms-home' && 'Главная страница'}
              {activeTab === 'cms-pages' && 'Информационные страницы'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                switch (activeTab) {
                  case 'dashboard': fetchDashboardData(); break;
                  case 'inventory': fetchProducts(); break;
                  case 'orders': fetchOrders(); break;
                  case 'customers': fetchUsers(); break;
                  case 'reviews': fetchReviews(); break;
                  case 'cms-general':
                  case 'cms-home':
                  case 'cms-pages': fetchCMSData(); break;
                }
              }}
              className="p-2 text-brand-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Обновить"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-brand-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView data={dashboardData} loading={loading} />}
              {activeTab === 'orders' && (
                <OrdersView 
                  orders={orders} 
                  token={token!} 
                  onUpdate={fetchOrders} 
                  loading={loading}
                  pagination={pagination.orders}
                  onPageChange={(page) => fetchOrders(page)}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryView 
                  products={products} 
                  loading={loading} 
                  token={token!} 
                  onUpdate={fetchProducts} 
                  onAuthError={handleLogout} 
                />
              )}
              {activeTab === 'customers' && (
                <CustomersView 
                  users={users} 
                  loading={loading}
                  pagination={pagination.customers}
                  onPageChange={(page) => fetchUsers(page)}
                />
              )}
              {activeTab === 'promo' && <PromoCodesView token={token!} />}
              {activeTab === 'carts' && <AbandonedCartsView token={token!} />}
              {activeTab === 'cms-general' && <CMSView pages={cmsPages} homeConfig={homeConfig} onUpdateHome={fetchCMSData} onUpdatePage={fetchCMSData} token={token!} loading={loading} activeSection="general" />}
              {activeTab === 'cms-home' && <CMSView pages={cmsPages} homeConfig={homeConfig} onUpdateHome={fetchCMSData} onUpdatePage={fetchCMSData} token={token!} loading={loading} activeSection="home" />}
              {activeTab === 'cms-pages' && <CMSView pages={cmsPages} homeConfig={homeConfig} onUpdateHome={fetchCMSData} onUpdatePage={fetchCMSData} token={token!} loading={loading} activeSection="pages" />}
              {activeTab === 'reports' && <ReportsView token={token!} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
