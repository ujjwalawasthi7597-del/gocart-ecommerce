import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  Shield,
  LogOut,
  Package,
  MapPin,
  SlidersHorizontal,
  Palette,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  isAdminView: boolean;
  onExitAdmin: () => void;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  onOpenAccount,
  onOpenAdmin,
  isAdminView,
  onExitAdmin,
  onSelectCategory,
}) => {
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const { itemCount, subtotal, openCart } = useCart();
  const { wishlist, openWishlist } = useWishlist();
  const { currentTheme, setTheme, themes } = useTheme();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    onSearch('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top utility alert if admin */}
      {isAdmin && (
        <div className="bg-slate-900 text-white text-xs py-1.5 px-4 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Logged in with Administrator Privileges ({user?.email})</span>
            </span>
            <button
              onClick={isAdminView ? onExitAdmin : onOpenAdmin}
              className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              {isAdminView ? 'Switch to Storefront View' : 'Go to Admin Console'}
            </button>
          </div>
        </div>
      )}

      {/* Primary Navigation Row (3-zone contract) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-18">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (isAdminView) onExitAdmin();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-sm hover:opacity-90 transition-all">
                <ShoppingBag className="w-5 h-5 text-brand-accent-light" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">GoCart</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-brand-primary tracking-wider uppercase">
                  Store
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links or Inline Search */}
          {!isAdminView ? (
            <div className="hidden md:flex items-center gap-8 flex-1 max-w-xl mx-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search audio, apparel, ceramics, wellness..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    onSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-brand-primary transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary bg-brand-primary-light px-2.5 py-1 rounded-md">
                Admin Control Room
              </span>
            </div>
          )}

          {/* Zone 3: Actions (Theme Selector, Wishlist, Cart, Account, Mobile toggle) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Palette Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsThemeMenuOpen(!isThemeMenuOpen);
                  setIsUserMenuOpen(false);
                }}
                title="Change Color Theme"
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Palette className="w-5 h-5 text-brand-primary" />
                <span className="hidden xl:inline text-xs font-semibold text-slate-600 capitalize">
                  {themes.find((t) => t.id === currentTheme)?.name.split(' ')[1] || 'Theme'}
                </span>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Select Color Theme
                    </p>
                  </div>
                  {themes.map((th) => {
                    const isActive = th.id === currentTheme;
                    return (
                      <button
                        key={th.id}
                        onClick={() => {
                          setTheme(th.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isActive ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center -space-x-1">
                            <span
                              className="w-4 h-4 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: th.primaryColor }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: th.accentColor }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{th.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{th.description}</p>
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!isAdminView && (
              <>
                {/* Wishlist button */}
                <button
                  onClick={openWishlist}
                  aria-label="Wishlist"
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                {/* Cart button */}
                <button
                  onClick={openCart}
                  aria-label="Shopping Cart"
                  className="flex items-center gap-2 px-3.5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors cursor-pointer shadow-sm"
                >
                  <div className="relative">
                    <ShoppingBag className="w-4 h-4 text-brand-accent-light" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 px-1 bg-brand-accent text-white text-[10px] font-black rounded-full leading-tight">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold tabular-nums hidden sm:inline">
                    ${subtotal.toFixed(2)}
                  </span>
                </button>
              </>
            )}

            {/* Account dropdown */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsThemeMenuOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-sm font-medium"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center font-bold text-xs uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden lg:inline truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Account & Profile
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        Order History
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Saved Addresses
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                          Admin Console
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar & Links */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  onSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </form>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-medium text-slate-700">
              <button
                onClick={() => {
                  onSelectCategory?.('all');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 text-left bg-slate-50 rounded-lg hover:bg-slate-100"
              >
                All Products
              </button>
              <button
                onClick={() => {
                  onSelectCategory?.('Audio & Electronics');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 text-left bg-slate-50 rounded-lg hover:bg-slate-100"
              >
                Audio & Tech
              </button>
              <button
                onClick={() => {
                  onSelectCategory?.('Apparel & Goods');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 text-left bg-slate-50 rounded-lg hover:bg-slate-100"
              >
                Apparel & Goods
              </button>
              <button
                onClick={() => {
                  onSelectCategory?.('Home & Living');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2 text-left bg-slate-50 rounded-lg hover:bg-slate-100"
              >
                Home & Living
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
