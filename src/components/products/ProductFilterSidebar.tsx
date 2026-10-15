import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Category } from '../../types';

interface ProductFilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  inStockOnly: boolean;
  onToggleInStock: (val: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  priceRange,
  onPriceChange,
  inStockOnly,
  onToggleInStock,
  sortBy,
  onSortChange,
  onResetFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Filter className="w-4 h-4 text-brand-primary" />
          <span>Filters</span>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs text-slate-500 hover:text-brand-primary flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
          Sort Order
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-brand-primary cursor-pointer"
        >
          <option value="featured">Featured Curations</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Customer Rating</option>
          <option value="newest">Recently Added</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
          Department
        </label>
        <div className="space-y-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
              selectedCategory === 'all'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Departments</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.name)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                selectedCategory.toLowerCase() === c.name.toLowerCase()
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[11px] opacity-75">{c.productCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Price Range
          </label>
          <span className="text-xs font-semibold text-brand-primary tabular-nums">
            ${priceRange[0]} - ${priceRange[1]}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="400"
          step="10"
          value={priceRange[1]}
          onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
          className="w-full cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400 mt-1 tabular-nums">
          <span>$0</span>
          <span>$200</span>
          <span>$400</span>
        </div>
      </div>

      {/* In Stock toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
          <span>Show In-Stock Only</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
