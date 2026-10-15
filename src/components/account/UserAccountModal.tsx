import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import { Order, Address } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getCleanImageUrl, handleImageError } from '../../utils/image';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'orders' | 'addresses' | 'profile';
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'orders',
}) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>(initialTab);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false,
  });

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setOrdersLoading(true);
      api.getOrders()
        .then(setOrders)
        .finally(() => setOrdersLoading(false));

      api.getAddresses().then(setAddresses);
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be immediately restored.')) {
      return;
    }

    setCancellingId(orderId);
    try {
      const res = await api.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await api.createAddress({
        ...newAddr,
        isDefault: addresses.length === 0 || newAddr.isDefault,
      });
      setAddresses((prev) => [...prev, saved]);
      setIsAddingAddress(false);
      setNewAddr({
        fullName: user.name,
        phone: user.phone || '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        isDefault: false,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile({ name, phone });
      setProfileMsg({ text: 'Profile information updated successfully.', success: true });
    } catch (err: any) {
      setProfileMsg({ text: err.message, success: false });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setProfileMsg({ text: 'Password updated securely.', success: true });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setProfileMsg({ text: err.message, success: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Customer Account Portal</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'addresses'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Security</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {ordersLoading ? (
                <p className="text-xs text-slate-500 text-center py-8">Loading order history...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">No orders placed yet</p>
                  <p className="text-xs text-slate-500">Your future purchases will appear here.</p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Top Order Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 font-mono">
                          {ord.orderNumber}
                        </span>
                        <span className="text-slate-400 mx-2">·</span>
                        <span className="text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
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

                        <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                          ${ord.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl">
                          <img
                            src={getCleanImageUrl(it.image)}
                            alt={it.name}
                            onError={handleImageError}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{it.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {it.quantity}x @ ${it.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tracking & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                      <div>
                        {ord.trackingNumber ? (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            {ord.trackingCarrier}: {ord.trackingNumber}
                          </span>
                        ) : (
                          <span>Payment: {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})</span>
                        )}
                      </div>

                      {/* Cancel order button if pending or confirmed */}
                      {(ord.orderStatus === 'Pending' || ord.orderStatus === 'Confirmed') && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          disabled={cancellingId === ord.id}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-rose-200"
                        >
                          {cancellingId === ord.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Saved Delivery Addresses
                </h3>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {isAddingAddress && (
                <form
                  onSubmit={handleCreateAddress}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"
                >
                  <h4 className="font-bold text-xs text-slate-900">New Address Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newAddr.fullName}
                        onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={newAddr.phone}
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-1">Street Address</label>
                      <input
                        type="text"
                        required
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">State & ZIP</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="State"
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                        />
                        <input
                          type="text"
                          required
                          placeholder="ZIP"
                          value={newAddr.zipCode}
                          onChange={(e) => setNewAddr({ ...newAddr, zipCode: e.target.value })}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save Address
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{addr.street}</p>
                      <p className="text-xs text-slate-600">
                        {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">{addr.phone}</p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE & SECURITY TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-8">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMsg.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Profile details */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Profile Information
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </form>

              {/* Change Password */}
              <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-900" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Change Password
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
