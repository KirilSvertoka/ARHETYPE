/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Storefront from './pages/Storefront';

// Below-the-fold and rarely-visited pages are code-split so the main
// bundle (first paint) stays small. AdminPanel pulls recharts (~400 KB).
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Reviews = lazy(() => import('./pages/Reviews'));
const About = lazy(() => import('./pages/About'));
const Page = lazy(() => import('./pages/Page'));
const Grodno = lazy(() => import('./pages/Grodno'));
const Brands = lazy(() => import('./pages/Brands'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const ServerError = lazy(() => import('./pages/ServerError'));
import { ThemeProvider } from './components/ThemeProvider';
import { LanguageProvider } from './components/LanguageProvider';
import { CartProvider } from './components/CartProvider';
import { WishlistProvider } from './components/WishlistProvider';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
}

/** Remove server-injected crawler HTML once React has mounted (meta/JSON-LD stay in head). */
function ClearSeoPrerender() {
  useEffect(() => {
    const el = document.getElementById('seo-prerender');
    if (el) el.remove();
  }, []);
  return null;
}

export default function App() {
  const adminPath = (import.meta as any).env.VITE_ADMIN_PATH?.replace(/^\//, '') || 'admin';

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
        <LanguageProvider>
          <WishlistProvider>
            <CartProvider>
              <BrowserRouter>
                <ScrollToTop />
                <ClearSeoPrerender />
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand-border border-t-brand-accent rounded-full animate-spin" />
                  </div>
                }>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="catalog" element={<Storefront />} />
                    <Route path="catalog/:slug" element={<ProductDetails />} />
                    <Route path="brand/:brandSlug" element={<Storefront />} />
                    <Route path="brands" element={<Brands />} />
                    <Route path="grodno" element={<Grodno />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="about" element={<About />} />
                    <Route path="p/:id" element={<Page />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="payment" element={<PaymentResult />} />
                    <Route path={adminPath} element={<AdminPanel />} />
                    <Route path="forbidden" element={<Forbidden />} />
                    <Route path="502" element={<ServerError />} />
                    <Route path="500" element={<ServerError />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
                </Suspense>
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}
