import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Users, FileText, Download, TrendingUp, DollarSign, BarChart3, ArrowUpRight, Award, Loader2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts';

interface ReportsViewProps {
  token: string;
}

interface SummaryData {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface ProductRevenue {
  name: string;
  quantity: number;
  revenue: number;
}

interface TrendItem {
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface ReportsState {
  daily: TrendItem[];
  weekly: TrendItem[];
  monthly: TrendItem[];
  summary: SummaryData;
  topProducts: ProductRevenue[];
}

export default function ReportsView({ token }: ReportsViewProps) {
  const [data, setData] = useState<ReportsState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/reports/sales', {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });
        if (!res.ok) {
          throw new Error('Не удалось загрузить данные отчёта');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Произошла непредвиденная ошибка');
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [token]);

  const exportData = async (type: string, format: string) => {
    window.open(`/api/admin/export/${type}?format=${format}&token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        <p className="text-sm text-brand-muted uppercase tracking-widest">Загрузка аналитических систем...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/5 text-center rounded-2xl max-w-lg mx-auto my-12">
        <p className="text-red-400 font-serif text-lg mb-4">Ошибка загрузки отчётов</p>
        <p className="text-xs text-brand-muted mb-6">{error || 'Попробуйте обновить страницу или авторизоваться заново.'}</p>
      </div>
    );
  }

  const { summary, topProducts } = data;
  const currentChartData = timeframe === 'daily' ? data.daily : timeframe === 'weekly' ? data.weekly : data.monthly;

  // Let's format names of labels for better look
  const formattedChartData = currentChartData.map(item => {
    let displayLabel = item.label;
    if (timeframe === 'monthly' && item.label) {
      // e.g. '2026-05' to readable 'Май 2026'
      const parts = item.label.split('-');
      if (parts.length === 2) {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          displayLabel = `${months[mIdx]} ${parts[0]}`;
        }
      }
    } else if (timeframe === 'weekly' && item.label) {
      displayLabel = item.label.replace('-W', ', Неделя ');
    }
    return { ...item, displayLabel };
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-2xl font-serif text-brand-light">Детализированные отчеты о продажах</h2>
        <p className="text-xs text-brand-muted mt-1">Интерактивный анализ финансовых показателей, выручки и маржинальности.</p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white/5 p-6 rounded-3xl border border-brand-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl group-hover:bg-brand-accent/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-brand-accent" />
          </div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Общая выручка</p>
          <h3 className="text-2xl font-serif text-brand-light mt-1.5 font-semibold leading-none">
            {summary.totalRevenue.toLocaleString()} BYN
          </h3>
          <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Весь период</span>
          </p>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white/5 p-6 rounded-3xl border border-brand-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Прибыль (Валовая)</p>
          <h3 className="text-2xl font-serif text-brand-light mt-1.5 font-semibold leading-none">
            {summary.totalProfit.toLocaleString()} BYN
          </h3>
          <p className="text-[10px] text-brand-muted mt-2">
            ≈ 65% маржинальности
          </p>
        </div>

        {/* Total Orders Count */}
        <div className="bg-white/5 p-6 rounded-3xl border border-brand-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 bg-indigo-400/10 rounded-xl flex items-center justify-center mb-4">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Оформлено заказов</p>
          <h3 className="text-2xl font-serif text-brand-light mt-1.5 font-semibold leading-none">
            {summary.totalOrders}
          </h3>
          <p className="text-[10px] text-brand-muted mt-2">
            Исключая отмененные
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white/5 p-6 rounded-3xl border border-brand-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
          <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">Средний чек (AOV)</p>
          <h3 className="text-2xl font-serif text-brand-light mt-1.5 font-semibold leading-none">
            {summary.averageOrderValue.toLocaleString()} BYN
          </h3>
          <p className="text-[10px] text-brand-muted mt-2">
            На одного покупателя
          </p>
        </div>

      </div>

      {/* DETAILED INTERACTIVE CHART BOARD */}
      <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-brand-border shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/40 pb-5">
          <div className="space-y-0.5">
            <h3 className="text-lg font-serif text-brand-light">Динамика выручки и чистой прибыли</h3>
            <p className="text-xs text-brand-muted font-light">Сопоставление общего дохода и маржинального остатка.</p>
          </div>
          
          {/* Timeframe selector controls */}
          <div className="inline-flex rounded-lg bg-black/30 p-1 border border-brand-border/40">
            {[
              { id: 'daily', label: 'По дням (30д)' },
              { id: 'weekly', label: 'По неделям' },
              { id: 'monthly', label: 'По месяцам' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id as any)}
                className={`px-4 py-2 rounded-md text-[11px] uppercase tracking-wider font-semibold transition-all ${
                  timeframe === tab.id 
                    ? 'bg-brand-accent text-white shadow-xs' 
                    : 'text-brand-muted hover:text-brand-light bg-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-96 w-full relative">
          {formattedChartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-brand-muted uppercase tracking-widest">
              Недостаточно данных для построения графика за выбранный период
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedChartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {/* Revenue Gradient */}
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(197, 160, 89)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="rgb(197, 160, 89)" stopOpacity={0}/>
                  </linearGradient>
                  {/* Profit Gradient */}
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis 
                  dataKey="displayLabel" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255, 255, 255, 0.5)' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255, 255, 255, 0.5)' }} 
                  unit=" BYN"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(24, 23, 21)', 
                    borderColor: 'rgba(255, 255, 255, 0.1)', 
                    color: '#FAF9F6',
                    borderRadius: '16px',
                    fontSize: '12px'
                  }} 
                  itemStyle={{ paddingBlock: '2px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area 
                  name="Выручка (BYN)" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="rgb(197, 160, 89)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  name="Прибыль (BYN)" 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="rgb(34, 197, 94)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* TWO COLUMN BENTO SECTION BELOW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP SELLING PRODUCTS */}
        <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-brand-border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-accent/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-brand-accent" />
              </div>
              <h3 className="text-lg font-serif text-brand-light">Лидеры продаж</h3>
            </div>
            <p className="text-xs text-brand-muted font-light">Самые востребованныe и прибыльные ароматы по объёмам за все время.</p>
            
            <div className="pt-4 space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-brand-muted uppercase tracking-widest">
                  Нет проданных товаров для отображения
                </div>
              ) : (
                topProducts.map((prod, idx) => {
                  const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1);
                  const widthPercent = (prod.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="space-y-1.5 text-left border-b border-brand-border/20 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between text-xs font-medium text-brand-light">
                        <span className="truncate max-w-[200px] xs:max-w-xs">{idx + 1}. {prod.name}</span>
                        <span className="shrink-0">{prod.revenue.toLocaleString()} BYN ({prod.quantity} шт.)</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${widthPercent}%` }} 
                          className="h-full bg-gradient-to-r from-brand-accent to-emerald-400 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* EXPORT ORIGINAL SECTION */}
        <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-brand-border shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-serif text-brand-light">Экспорт сырых данных</h3>
            <p className="text-xs text-brand-muted font-light">Выгружайте полные реестры и базы данных в удобных системных форматах.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Товары', type: 'products', icon: Package },
              { title: 'Заказы', type: 'orders', icon: ShoppingBag },
              { title: 'Клиенты', type: 'users', icon: Users },
            ].map(report => (
              <div key={report.type} className="bg-black/20 p-5 rounded-2xl border border-brand-border/60 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                    <report.icon className="w-4.5 h-4.5 text-brand-muted" />
                  </div>
                  <h4 className="text-xs font-serif text-brand-light truncate">{report.title}</h4>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => exportData(report.type, 'json')}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] uppercase tracking-wider font-semibold text-brand-light transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> JSON
                  </button>
                  <button 
                    onClick={() => exportData(report.type, 'csv')}
                    className="w-full py-2 bg-brand-accent hover:bg-brand-accent-hover rounded-xl text-[10px] uppercase tracking-wider font-semibold text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
