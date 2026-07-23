/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Storefront from './pages/Storefront';
import AdminPanel from './pages/AdminPanel';
import ProductDetails from './pages/ProductDetails';
import Contacts from './pages/Contacts';
import Reviews from './pages/Reviews';
import About from './pages/About';
import Page from './pages/Page';
import Grodno from './pages/Grodno';
import Brands from './pages/Brands';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import ServerError from './pages/ServerError';
import { ThemeProvider } from './components/ThemeProvider';
import { LanguageProvider } from './components/LanguageProvider';
import { CartProvider } from './components/CartProvider';
import { WishlistProvider } from './components/WishlistProvider';
import Wishlist from './pages/Wishlist';

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
                    <Route path={adminPath} element={<AdminPanel />} />
                    <Route path="forbidden" element={<Forbidden />} />
                    <Route path="502" element={<ServerError />} />
                    <Route path="500" element={<ServerError />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}
