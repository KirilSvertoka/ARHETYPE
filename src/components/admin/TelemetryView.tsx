import React, { useState, useEffect } from 'react';
import { Activity, Globe, MousePointerClick, Eye, TrendingUp, Clock } from 'lucide-react';

interface TelemetryViewProps {
  token: string;
  onAuthError: () => void;
}

interface TelemetryData {
  visits: number;
  uniques: number;
  productViews: number;
  clicks: number;
  pages: { label: string; count: number }[];
  regions: { city: string; country: string; count: number }[];
  events: { name: string; count: number }[];
  recent: { ts_h: string; city: string; label: string }[];
}

const PERIODS = [
  { id: 'today', label: 'Сегодня' },
  { id: '7d', label: '7 дней' },
  { id: '30d', label: '30 дней' }
];

export default function TelemetryView({ token, onAuthError }: TelemetryViewProps) {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetch(`/api/admin/telemetry?period=${period}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { onAuthError(); throw new Error('auth'); }
        return r.json();
      })
      .then(d => { if (live) setData(d); })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [period, token]);

  const statCard = (label: string, value: number | string, icon: React.ReactNode) => (
    <div className="bg-white/5 rounded-3xl border border-brand-border p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-brand-muted">{label}</div>
        <div className="text-2xl font-semibold text-brand-light tabular-nums">{value}</div>
      </div>
    </div>
  );

  const topList = (title: string, rows: { label: string; sub?: string; count: number }[], accent = false) => (
    <div className="bg-white/5 rounded-3xl border border-brand-border p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-light mb-4">{title}</h3>
      {(!rows || rows.length === 0) && <p className="text-sm text-brand-muted">Пока нет данных.</p>}
      {rows && rows.length > 0 && (
        <div className="space-y-2.5">
          {rows.map((r, i) => {
            const max = rows[0].count || 1;
            return (
              <div key={i} className="text-sm">
                <div className="flex justify-between gap-3 items-baseline">
                  <span className="text-brand-light truncate">{accent && <span className="text-brand-accent mr-1.5">{i + 1}.</span>}{r.label}</span>
                  {r.sub && <span className="text-[10px] text-brand-muted shrink-0">{r.sub}</span>}
                  <span className="text-brand-accent font-medium tabular-nums shrink-0">{r.count}</span>
                </div>
                <div className="mt-1 h-0.5 bg-brand-border/40 relative overflow-hidden rounded-full">
                  <div className="absolute left-0 top-0 h-full bg-brand-accent/60" style={{ width: `${Math.max(6, Math.round((r.count / max) * 100))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
              period === p.id
                ? 'bg-brand-accent text-white border-brand-accent'
                : 'bg-white/5 text-brand-muted border-brand-border/60 hover:text-brand-light'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-brand-muted">
          <Activity className="w-3.5 h-3.5" /> Телеметрия сайта
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-border border-t-brand-accent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCard('Посещения', data?.visits ?? 0, <Eye className="w-5 h-5" />)}
            {statCard('Посетители', data?.uniques ?? 0, <Globe className="w-5 h-5" />)}
            {statCard('Просмотры товаров', data?.productViews ?? 0, <TrendingUp className="w-5 h-5" />)}
            {statCard('Клики (события)', data?.clicks ?? 0, <MousePointerClick className="w-5 h-5" />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topList('Самые посещаемые страницы', (data?.pages || []).map(p => ({ label: p.label, count: p.count })), true)}
            {topList('Регионы посетителей', (data?.regions || []).map(r => ({ label: [r.city, r.country].filter(Boolean).join(', '), count: r.count })))}
            {topList('Куда нажимали (события)', (data?.events || []).map(e => ({ label: e.name, count: e.count })))}
            <div className="bg-white/5 rounded-3xl border border-brand-border p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-light mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-accent" /> Последние визиты
              </h3>
              {(!data?.recent || data.recent.length === 0) && <p className="text-sm text-brand-muted">Пока нет данных.</p>}
              {data?.recent && data.recent.length > 0 && (
                <div className="space-y-2">
                  {data.recent.map((r, i) => (
                    <div key={i} className="flex justify-between gap-3 text-sm">
                      <span className="text-brand-light truncate">{r.label}</span>
                      <span className="text-brand-muted text-xs shrink-0">{r.city} · {r.ts_h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
