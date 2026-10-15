import React from 'react';
import { Category } from '../../types';
import { ArrowUpRight } from 'lucide-react';
import { getCleanImageUrl, handleImageError } from '../../utils/image';

interface CategoryPillsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Browse by Department
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Artisanal creations and precision instruments engineered to endure.
          </p>
        </div>

        <button
          onClick={() => onSelectCategory('all')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          View All Departments
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-brand-primary ring-2 ring-brand-primary shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Image Container with 4:3 Aspect Ratio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                <img
                  src={getCleanImageUrl(cat.image)}
                  alt={cat.name}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm leading-tight text-white group-hover:text-brand-hero-accent transition-colors">
                      {cat.name}
                    </h3>
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {cat.productCount ?? 0} {cat.productCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
