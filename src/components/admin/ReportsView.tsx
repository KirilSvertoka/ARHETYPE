import React from 'react';
import { Package, ShoppingBag, Users, FileText, Download } from 'lucide-react';

interface ReportsViewProps {
  token: string;
}

export default function ReportsView({ token }: ReportsViewProps) {
  const exportData = async (type: string, format: string) => {
    window.open(`/api/admin/export/${type}?format=${format}&token=${token}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { title: 'Отчет по товарам', type: 'products', icon: Package },
        { title: 'Отчет по заказам', type: 'orders', icon: ShoppingBag },
        { title: 'Отчет по клиентам', type: 'users', icon: Users },
      ].map(report => (
        <div key={report.type} className="bg-white/5 p-8 rounded-3xl border border-brand-border shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
              <report.icon className="w-6 h-6 text-brand-muted" />
            </div>
            <h3 className="text-xl font-serif text-brand-light">{report.title}</h3>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => exportData(report.type, 'json')}
              className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-medium text-brand-light hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> JSON
            </button>
            <button 
              onClick={() => exportData(report.type, 'csv')}
              className="flex-1 py-3 bg-brand-accent text-white rounded-xl text-sm font-medium hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
