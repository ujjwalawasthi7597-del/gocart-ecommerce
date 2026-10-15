import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, Address } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, subtotal, discount, shippingFee, tax, total, appliedCoupon, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New address form
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      api.getAddresses().then((addrs) => {
        setAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingNewAddress(true);
        }
      });
    } else if (isOpen && !user) {
      setIsAddingNewAddress(true);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      let finalShippingAddress: Omit<Address, 'id' | 'userId' | 'isDefault'>;

      if (!isAddingNewAddress && selectedAddressId) {
        const found = addresses.find((a) => a.id === selectedAddressId);
        if (!found) throw new Error('Please select a shipping address.');
        finalShippingAddress = {
          fullName: found.fullName,
          phone: found.phone,
          street: found.street,
          city: found.city,
          state: found.state,
          zipCode: found.zipCode,
          country: found.country,
        };
      } else {
        if (
          !newAddress.fullName ||
          !newAddress.phone ||
          !newAddress.street ||
          !newAddress.city ||
          !newAddress.state ||
          !newAddress.zipCode
        ) {
          throw new Error('Please fill in all required shipping address fields.');
        }

        // Save new address to user profile
        const saved = await api.createAddress({
          ...newAddress,
          isDefault: addresses.length === 0,
        });
        setAddresses((prev) => [...prev, saved]);
        finalShippingAddress = newAddress;
      }

      // 1. Create order on backend (authoritative stock deduction & price recalculation)
      const res = await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: finalShippingAddress,
        couponCode: appliedCoupon?.code,
        paymentMethod,
      });

      let completedOrder = res.order;

      // 2. If payment is card, simulate processing via sandbox gateway
      if (paymentMethod === 'card') {
        const payRes = await api.payOrder(completedOrder.id, {
          cardNumber,
          cardExp,
          cardCvc,
        });
        completedOrder = payRes.order;
      }

      // 3. Clear cart
      clearCart();

      // 4. Trigger confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onOrderSuccess(completedOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Secure Express Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <form onSubmit={handlePlaceOrder} className="overflow-y-auto p-6 sm:p-8 space-y-8">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Step 1: Delivery Address */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">1. Shipping Address</h3>
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
                >
                  {isAddingNewAddress ? 'Select Saved Address' : '+ Add New Address'}
                </button>
              )}
            </div>

            {!isAddingNewAddress && addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-brand-primary bg-brand-primary-light ring-2 ring-brand-primary/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span>{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{addr.street}</p>
                    <p className="text-slate-600">
                      {addr.city}, {addr.state} {addr.zipCode}
                    </p>
                    <p className="text-slate-500 font-mono mt-1">{addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="123 Artisan Way, Apt 4"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-slate-900" />
              <h3 className="text-sm font-bold text-slate-900">2. Payment Method</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-brand-primary bg-brand-primary-light ring-2 ring-brand-primary/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-slate-900" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Card Payment</p>
                  <p className="text-[11px] text-slate-500">Stripe Sandbox</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-brand-primary bg-brand-primary-light ring-2 ring-brand-primary/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5 text-slate-900" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">Cash on Delivery</p>
                  <p className="text-[11px] text-slate-500">Pay at doorstep</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-200">
                  <span>Development Test Sandbox Active</span>
                  <span className="font-mono text-emerald-700">Test Card: 4242 4242 4242 4242</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Expiration (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      placeholder="12/28"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Security CVC
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Confirmation */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 mb-2">Order Items ({items.length})</h4>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between items-center text-slate-600">
                  <span className="truncate max-w-[280px]">
                    {i.quantity}x {i.product.name}
                  </span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    ${(i.product.price * i.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900 tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono tabular-nums">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-mono text-slate-900 tabular-nums">
                  {shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="font-mono text-slate-900 tabular-nums">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-brand-accent-light" />
            <span>
              {isSubmitting
                ? 'Processing Authorization...'
                : `Authorize & Place Order · $${total.toFixed(2)}`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
