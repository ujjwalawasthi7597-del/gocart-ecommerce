import React, { useState, useEffect } from 'react';
import { Star, Trash2, CheckCircle2 } from 'lucide-react';
import { Review } from '../../types';
import { api } from '../../services/api';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this review? Product aggregate rating will be recalculated.')) {
      return;
    }
    try {
      await api.deleteAdminReview(id);
      loadReviews();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Customer Reviews & Reputation Moderation
        </h2>
        <p className="text-xs text-slate-500">
          Moderate community feedback, verify purchase authenticity, and purge inappropriate submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-xs text-slate-400 py-8">Loading customer reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-xs text-slate-400 py-8">No customer reviews to display.</p>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{r.productName}</h3>
                    <p className="text-[11px] text-slate-400">By {r.userName}</p>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {r.isVerifiedPurchase && (
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                      Verified Buyer
                    </span>
                  )}
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
