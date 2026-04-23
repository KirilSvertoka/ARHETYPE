import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { language } = useLanguage();
  
  return (
    <nav className="flex items-center space-x-2 text-xs md:text-sm text-brand-muted mb-6 overflow-x-auto no-scrollbar whitespace-nowrap pb-1" aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="flex items-center hover:text-brand-light transition-colors"
      >
        <Home className="w-3 h-3 md:w-4 h-4 mr-1" />
        <span className="sr-only font-medium uppercase tracking-wider">{language === 'be' ? 'Галоўная' : 'Главная'}</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 md:w-4 h-4 flex-shrink-0" />
          {item.path ? (
            <Link 
              to={item.path} 
              className="hover:text-brand-light transition-colors font-medium uppercase tracking-wider"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-brand-light font-medium uppercase tracking-wider cursor-default">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
