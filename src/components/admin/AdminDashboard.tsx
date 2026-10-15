import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Package,
  Users,
  Boxes,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Shield,
  Truck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AdminMetrics } from '../../types';
import { api } from '../../services/api';
import { getCleanImageUrl, handleImageError } from '../../utils/image';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'products' | 'orders' | 'categories' | 'coupons' | 'customers' | 'reviews') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading real-time enterprise metrics...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="py-20 text-center text-xs text-rose-500">
        Failed to load administration metrics.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-brand-hero rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2 text-brand-hero-accent text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Store Executive Overview</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Operations Command Center</h2>
          <p className="text-xs text-slate-200 mt-1 max-w-lg">
            Real-time aggregate telemetry across database catalog, inventory reserves, payment settlement, and customer order fulfillment.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigateTab('products')}
            className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            + Add Product
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-4 py-2 bg-white/10 text-white font-semibold text-xs rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            View Orders
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settled Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Settled Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              ${metrics.totalSales.toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Real settled transactions
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.totalOrders}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all fulfillment stages</p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.totalCustomers}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Verified customer profiles</p>
          </div>
        </div>

        {/* Catalog Items & Low stock alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inventory Catalog
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.totalProducts}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" /> {metrics.lowStockCount} items below threshold
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Selling & Category Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics.topSelling.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No product sales recorded yet.</p>
            ) : (
              metrics.topSelling.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getCleanImageUrl(prod.image)}
                      alt={prod.name}
                      onError={handleImageError}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover bg-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {prod.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-xs font-mono text-slate-900 tabular-nums">
                    ${prod.revenue.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Revenue by Department</h3>
            <button
              onClick={() => onNavigateTab('categories')}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View Categories</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {Object.keys(metrics.categorySales).length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No department revenue recorded yet.</p>
            ) : (
              Object.entries(metrics.categorySales).map(([cat, rev]) => {
                const percentage =
                  metrics.totalSales > 0 ? Math.round((rev / metrics.totalSales) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        ${rev.toFixed(2)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-slate-900 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Live feed of most recent customer orders</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All Orders ({metrics.totalOrders})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {metrics.recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="py-3 font-medium text-slate-800">{ord.customerName}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        ord.orderStatus === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.orderStatus === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[11px] font-medium uppercase font-mono ${
                        ord.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ${ord.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
