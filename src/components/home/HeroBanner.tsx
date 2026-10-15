import React from 'react';
import { ArrowRight, Sparkles, Tag } from 'lucide-react';
import { getCleanImageUrl, handleImageError } from '../../utils/image';

interface HeroBannerProps {
  onShopNow: () => void;
  onSelectCategory?: (category: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow }) => {
  return (
    <section className="relative overflow-hidden bg-brand-hero rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 text-white shadow-xl transition-colors duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px]">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10">
          <div>
            {/* Promo banner note */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-brand-hero-accent text-xs font-semibold mb-6">
              <Tag className="w-3.5 h-3.5" />
              <span>Spring Curation · Use code <strong>GOCART20</strong> for 20% off</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15] text-balance">
              Precision Crafted Everyday Goods.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-200 max-w-lg leading-relaxed">
              From beryllium acoustic transducers to hand-thrown reduction ceramics and vintage-loomed selvedge denim. Curated with unyielding attention to substance and timeless form.
            </p>
          </div>

          <div className="mt-8 pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={onShopNow}
              className="px-6 py-3.5 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>Explore The Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
              <Sparkles className="w-4 h-4 text-brand-hero-accent" />
              <span>Complimentary shipping on orders over $50</span>
            </div>
          </div>
        </div>

        {/* Right Column: High Fidelity Hero Imagery */}
        <div className="lg:col-span-6 relative min-h-[320px] lg:min-h-full">
          <img
            src={getCleanImageUrl('/images/hero_gocart_lifestyle_1791788713972.jpg')}
            alt="GoCart Curated Goods"
            onError={handleImageError}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Subtle gradient overlay for balanced contrast */}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-brand-hero via-brand-hero/40 to-transparent" />
        </div>
      </div>
    </section>
  );
};
