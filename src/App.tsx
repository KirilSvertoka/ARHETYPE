/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import Home from './pages/Home';
import Storefront from './pages/Storefront';
import AdminPanel from './pages/AdminPanel';
import ProductDetails from './pages/ProductDetails';
import Contacts from './pages/Contacts';
import Reviews from './pages/Reviews';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
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

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <WishlistProvider>
            <CartProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="catalog" element={<Storefront />} />
                    <Route path="catalog/:slug" element={<ProductDetails />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="about" element={<About />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="admin" element={<AdminPanel />} />
                    <Route path="forbidden" element={<Forbidden />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
