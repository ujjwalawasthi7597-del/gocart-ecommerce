import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Product, Review } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getCleanImageUrl, handleImageError } from '../../utils/image';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onInstantBuy: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onInstantBuy,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, openAuthModal } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Review form states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.images[0]);
      setQuantity(1);
      setReviewError('');
      setReviewSuccess(false);
      // Fetch fresh reviews
      api.getReviews(product.id)
        .then(setReviews)
        .catch(console.error);
    }
  }, [product]);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      onInstantBuy(product, quantity);
      onClose();
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!newComment.trim()) {
      setReviewError('Please provide review text.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const created = await api.submitReview({
        productId: product.id,
        rating: newRating,
        comment: newComment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setNewComment('');
      setReviewSuccess(true);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={getCleanImageUrl(selectedImage || product.images?.[0])}
                  alt={product.name}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                {product.discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-brand-accent text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                    Save {product.discountPercent}%
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        selectedImage === img
                          ? 'border-slate-900 ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={getCleanImageUrl(img)}
                        alt={`Thumbnail ${idx + 1}`}
                        onError={handleImageError}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Contiguous Purchase Module */}
            <div className="flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-brand-primary">
                    {product.brand} · {product.category}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">SKU: {product.sku}</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
                  {product.name}
                </h1>

                {/* Rating & Review Counter */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(product.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-900">{product.rating.toFixed(1)}</span>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs text-slate-500 hover:text-slate-900 underline transition-colors cursor-pointer"
                  >
                    {product.reviewCount} verified reviews
                  </button>
                </div>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    ${product.price}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-base text-slate-400 line-through tabular-nums">
                      ${product.originalPrice}
                    </span>
                  )}
                  {product.discountPercent > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      You save ${(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Stock status indicator */}
                <div className="mt-4">
                  {isOutOfStock ? (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      Currently Out of Stock
                    </span>
                  ) : product.stock < 10 ? (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      Low stock: Only {product.stock} items remaining
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      In Stock · Ready to dispatch
                    </span>
                  )}
                </div>
              </div>

              {/* Purchase Actions (Quantity + Add to Cart + Buy Now + Wishlist) */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-900 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      isFavorited
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="py-3 px-4 bg-brand-primary text-white font-semibold text-xs rounded-xl hover:bg-brand-primary-hover transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="py-3 px-4 bg-brand-accent text-white font-bold text-xs rounded-xl hover:bg-brand-accent-hover transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Instant Checkout</span>
                  </button>
                </div>

                {/* Assurance icons */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Free Shipping &gt;$50</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>30-Day Returns</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>2-Yr Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Reviews Tabs */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex gap-6 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab('details')}
                className={`text-sm font-bold pb-2 transition-colors cursor-pointer ${
                  activeTab === 'details'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Specifications & Craftsmanship
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`text-sm font-bold pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span>Customer Reviews</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                  {reviews.length}
                </span>
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="pt-4 space-y-4">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                  {product.details?.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="pt-4 space-y-6">
                {/* Submit Review Box */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Write a Product Review
                  </h4>
                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Your Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewRating(star)}
                              className="p-1 cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= newRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <textarea
                          placeholder="Share your experience with build quality, acoustics, or durability..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      {reviewError && <p className="text-xs text-rose-600">{reviewError}</p>}
                      {reviewSuccess && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Review posted successfully!
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Posting...' : 'Post Review'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-xs text-slate-600">
                      <span>Please </span>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="font-bold text-slate-900 underline cursor-pointer"
                      >
                        Sign in
                      </button>
                      <span> to leave a verified rating and review.</span>
                    </div>
                  )}
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No reviews yet for this product. Be the first to share your thoughts!
                    </p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="border-b border-slate-100 pb-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{r.userName}</span>
                            {r.isVerifiedPurchase && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating ? 'fill-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
