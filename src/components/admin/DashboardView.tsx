import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, TrendingUp, BarChart3, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  data: any;
  loading: boolean;
}

export default function DashboardView({ data, loading }: DashboardViewProps) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-border border-t-brand-light rounded-full animate-spin"></div></div>;
  if (!data) return <div className="flex justify-center py-12 text-brand-muted">Нет данных для отображения.</div>;

    const metrics = [
      { label: 'Продажи сегодня', value: `${data.metrics.salesToday} BYN`, icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
      { label: 'Активные корзины', value: data.metrics.activeCarts, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      { label: 'Конверсия', value: `${data.metrics.conversion}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
      { label: 'Продажи за месяц', value: `${data.metrics.salesMonth} BYN`, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 p-6 rounded-3xl border border-brand-border shadow-sm"
          >
            <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-4`}>
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <p className="text-sm font-medium text-brand-muted">{m.label}</p>
            <h3 className="text-2xl font-serif text-brand-light mt-1">{m.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm">
          <h3 className="text-lg font-serif text-brand-light mb-6">Системные уведомления</h3>
          <div className="space-y-4">
            {data.alerts.lowStock.length > 0 ? (
              data.alerts.lowStock.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-red-400/10 rounded-2xl border border-red-400/20">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Мало на складе: {item.name}</p>
                    <p className="text-xs text-red-500">{item.size} - Осталось {item.stock} (Порог: {item.stockThreshold})</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-4 p-4 bg-emerald-400/10 rounded-2xl border border-emerald-400/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-400">Все запасы в норме.</p>
              </div>
            )}
            {data.alerts.pendingReviews > 0 && (
              <div className="flex items-center gap-4 p-4 bg-amber-400/10 rounded-2xl border border-amber-400/20">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <p className="text-sm font-medium text-amber-400">{data.alerts.pendingReviews} отзывов ожидают модерации.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm">
          <h3 className="text-lg font-serif text-brand-light mb-6">Тенденция продаж</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesTrend && data.salesTrend.length > 0 ? data.salesTrend : [{name: 'Нет данных', sales: 0}]}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-accent)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-brand-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'rgba(255,255,255,0.5)'}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-brand-bg)', borderColor: 'rgba(255,255,255,0.1)', color: '#fdfbfb' }} itemStyle={{ color: 'var(--color-brand-accent)' }} />
                <Area type="monotone" dataKey="sales" stroke="var(--color-brand-accent)" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
