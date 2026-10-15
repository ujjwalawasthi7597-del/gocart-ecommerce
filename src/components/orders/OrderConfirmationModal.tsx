import React from 'react';
import {
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  Printer,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { Order } from '../../types';
import { getCleanImageUrl, handleImageError } from '../../utils/image';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewAccountOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewAccountOrders,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-6 bg-emerald-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Order Confirmed!</h2>
              <p className="text-xs text-emerald-100">Order Reference: {order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-slate-600">
          {/* Status Timeline */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-900 font-semibold mb-3">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Estimated Fulfillment: In Preparation</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {order.orderStatus}
              </span>
            </div>

            {/* Stepper bar */}
            <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-medium">
              <div className="text-emerald-700 font-bold">
                <div className="h-1.5 bg-emerald-600 rounded-full mb-1" />
                Placed
              </div>
              <div className="text-emerald-700 font-bold">
                <div className="h-1.5 bg-emerald-600 rounded-full mb-1" />
                Confirmed
              </div>
              <div className="text-slate-400">
                <div className="h-1.5 bg-slate-200 rounded-full mb-1" />
                Shipped
              </div>
              <div className="text-slate-400">
                <div className="h-1.5 bg-slate-200 rounded-full mb-1" />
                Delivered
              </div>
            </div>
          </div>

          {/* Purchased Items */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">
              Purchased Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <img
                    src={getCleanImageUrl(item.image)}
                    alt={item.name}
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Qty: {item.quantity} · ${item.price} each
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Details 2-Column: Delivery Address & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Shipping Address</span>
              </div>
              <p className="font-semibold text-slate-800">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-slate-400 font-mono">{order.shippingAddress.phone}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Payment Summary</span>
              </div>
              <p>
                Method: <strong className="capitalize text-slate-800">{order.paymentMethod}</strong>
              </p>
              <p>
                Payment Status:{' '}
                <strong className="text-emerald-700 capitalize">{order.paymentStatus}</strong>
              </p>
              <p className="text-slate-400 font-mono text-[11px]">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Calculation summary */}
          <div className="border-t border-slate-200 pt-3 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied</span>
                <span className="font-mono tabular-nums">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-mono tabular-nums">
                {order.shippingFee === 0 ? 'Complimentary' : `$${order.shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span className="font-mono tabular-nums">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="tabular-nums">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-8 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onViewAccountOrders();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              View Order History
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
