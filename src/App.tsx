import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Shield,
  LayoutDashboard,
  Boxes,
  Truck,
  FolderTree,
  Tag,
  Users,
  MessageSquare,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Product, Category, Order } from './types';
import { api } from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroBanner } from './components/home/HeroBanner';
import { CategoryPills } from './components/home/CategoryPills';
import { ProductCard } from './components/products/ProductCard';
import { ProductFilterSidebar } from './components/products/ProductFilterSidebar';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { WishlistDrawer } from './components/wishlist/WishlistDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderConfirmationModal } from './components/orders/OrderConfirmationModal';
import { UserAccountModal } from './components/account/UserAccountModal';
import { AuthModal } from './components/auth/AuthModal';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminCategories } from './components/admin/AdminCategories';
import { AdminCoupons } from './components/admin/AdminCoupons';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminReviews } from './components/admin/AdminReviews';

function MainApp() {
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();

  // Navigation & View Mode
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminTab, setAdminTab] = useState<
    'dashboard' | 'products' | 'orders' | 'categories' | 'coupons' | 'customers' | 'reviews'
  >('dashboard');

  // Storefront Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 400]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // Modals State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const catalogSectionRef = useRef<HTMLDivElement>(null);

  // Load Categories once
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch Products whenever filters, search, or pagination changes
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          q: searchQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
          maxPrice: priceRange[1] < 400 ? priceRange[1] : undefined,
          inStock: inStockOnly ? true : undefined,
          sortBy,
          page,
          limit: 8,
        });

        setProducts(res.products);
        setTotalProducts(res.total);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [searchQuery, selectedCategory, priceRange, inStockOnly, sortBy, page]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 400]);
    setInStockOnly(false);
    setSortBy('featured');
    setPage(1);
  };

  const scrollToCatalog = () => {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInstantBuy = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Primary Header */}
      <Header
        onSearch={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchQuery={searchQuery}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminView(true)}
        isAdminView={isAdminView}
        onExitAdmin={() => setIsAdminView(false)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setPage(1);
          scrollToCatalog();
        }}
      />

      {/* Main View Router: Storefront vs Admin Portal */}
      {!isAdminView ? (
        <main className="flex-1">
          {/* Hero Banner Section */}
          <HeroBanner
            onShopNow={scrollToCatalog}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
              scrollToCatalog();
            }}
          />

          {/* Department Cards Grid */}
          <CategoryPills
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setPage(1);
              scrollToCatalog();
            }}
          />

          {/* Product Catalog Section */}
          <section ref={catalogSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {selectedCategory === 'all' ? 'Curated Collection' : selectedCategory}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Showing {products.length} of {totalProducts} verified items
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>

              {/* Reset filter pill if active */}
              {(selectedCategory !== 'all' || searchQuery || inStockOnly || priceRange[1] < 400) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-slate-900 underline font-semibold transition-colors cursor-pointer self-start"
                >
                  Clear Active Filters
                </button>
              )}
            </div>

            {/* Split layout: Filters left + Product grid right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Left: Filter Sidebar */}
              <div className="lg:col-span-1 sticky top-24">
                <ProductFilterSidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(c) => {
                    setSelectedCategory(c);
                    setPage(1);
                  }}
                  priceRange={priceRange}
                  onPriceChange={(r) => {
                    setPriceRange(r);
                    setPage(1);
                  }}
                  inStockOnly={inStockOnly}
                  onToggleInStock={(val) => {
                    setInStockOnly(val);
                    setPage(1);
                  }}
                  sortBy={sortBy}
                  onSortChange={(s) => {
                    setSortBy(s);
                    setPage(1);
                  }}
                  onResetFilters={handleResetFilters}
                />
              </div>

              {/* Right: Products Grid */}
              <div className="lg:col-span-3 space-y-8">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse"
                      >
                        <div className="aspect-square bg-slate-100 rounded-xl" />
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      No products matched your criteria
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try broadening your price range, clearing the search query, or selecting another department.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onSelect={(prod) => setSelectedProduct(prod)}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-200">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page <= 1}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page >= totalPages}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* ADMIN CONSOLE VIEW */
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Admin Navigation Ribbon */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-1.5 shadow-xs">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'dashboard'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setAdminTab('products')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'products'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Products & Stock</span>
            </button>

            <button
              onClick={() => setAdminTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'orders'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Orders & Fulfillment</span>
            </button>

            <button
              onClick={() => setAdminTab('categories')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'categories'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Departments</span>
            </button>

            <button
              onClick={() => setAdminTab('coupons')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'coupons'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Promotions</span>
            </button>

            <button
              onClick={() => setAdminTab('customers')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'customers'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Base</span>
            </button>

            <button
              onClick={() => setAdminTab('reviews')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                adminTab === 'reviews'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reviews Moderation</span>
            </button>

            <div className="ml-auto pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsAdminView(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Return to Store</span>
              </button>
            </div>
          </div>

          {/* Sub Tab View */}
          {adminTab === 'dashboard' && <AdminDashboard onNavigateTab={(t) => setAdminTab(t)} />}
          {adminTab === 'products' && <AdminProducts />}
          {adminTab === 'orders' && <AdminOrders />}
          {adminTab === 'categories' && <AdminCategories />}
          {adminTab === 'coupons' && <AdminCoupons />}
          {adminTab === 'customers' && <AdminCustomers />}
          {adminTab === 'reviews' && <AdminReviews />}
        </main>
      )}

      {/* Global Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onInstantBuy={handleInstantBuy}
      />

      <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
      <WishlistDrawer />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(ord) => setCompletedOrder(ord)}
      />

      <OrderConfirmationModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
        onViewAccountOrders={() => setIsAccountOpen(true)}
      />

      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />

      <AuthModal />

      {/* Footer */}
      {!isAdminView && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <MainApp />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
