import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, CheckCircle2, ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react';
import { api } from '../../services/api';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    try {
      const res = await api.subscribeNewsletter(email);
      setStatus('success');
      setMessage(res.message);
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Subscription failed. Please try again.');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900 mt-20">
      {/* Trust badging row */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 text-amber-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">Complimentary Delivery</p>
                <p className="text-[11px] text-slate-400">On all qualifying orders over $50</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">Guaranteed Authentic</p>
                <p className="text-[11px] text-slate-400">Direct from artisan studios</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 text-amber-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">30-Day Hassle-Free Returns</p>
                <p className="text-[11px] text-slate-400">Full refunds on intact items</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs">Bank-Grade 256-Bit SSL</p>
                <p className="text-[11px] text-slate-400">Card & COD payments secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand & Newsletter column (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">GoCart</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Curated everyday essentials, high-fidelity acoustic gear, artisan ceramics, and timeless garments engineered with purpose and care.
            </p>

            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-200 mb-2">
                Stay updated with seasonal drops & exclusive private releases
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {status === 'loading' ? 'Joining...' : 'Subscribe'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
              {status === 'success' && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {message}
                </p>
              )}
              {status === 'error' && (
                <p className="text-xs text-rose-400 mt-2">{message}</p>
              )}
            </div>
          </div>

          {/* Catalog Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Catalog
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><span className="hover:text-white transition-colors cursor-pointer">Audio & Tech</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Apparel & Goods</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Home & Living</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Grooming & Wellness</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Seasonal Drops</span></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><span className="hover:text-white transition-colors cursor-pointer">Order Tracking</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Shipping & Logistics</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Returns & Exchanges</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Warranty & Authenticity</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact Care Team</span></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><span className="hover:text-white transition-colors cursor-pointer">Our Craft Story</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Cookie Preferences</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Sustainability Report</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & payment icons representation */}
        <div className="pt-10 mt-10 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} GoCart Inc. All rights reserved.</p>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <span>VISA</span>
            <span>·</span>
            <span>MASTERCARD</span>
            <span>·</span>
            <span>AMEX</span>
            <span>·</span>
            <span>CASH ON DELIVERY</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
