import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, MessageSquare, Send, Star, Trash2 } from 'lucide-react';
import reviewApi from '@/api/reviewApi';
import { getApiErrorMessage } from '@/api/apiUtils';
import authService from '@/features/auth/services/authService';
import { showToast } from '@/utils/helpers';

const emptyForm = {
  rating: 5,
  title: '',
  comment: '',
};

const StarRating = ({ value = 0, onChange = null, size = 18 }) => {
  const interactive = typeof onChange === 'function';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = rating <= Number(value || 0);
        const Icon = (
          <Star
            size={size}
            className={filled ? 'fill-primary text-primary' : 'text-slate-300'}
          />
        );

        if (!interactive) {
          return <span key={rating}>{Icon}</span>;
        }

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
};

const formatReviewDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getCurrentUserId = () => {
  const user = authService.getCurrentUser();
  return user?.id ?? user?.pk ?? user?.user_id ?? user?.sub ?? null;
};

function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const isAuthenticated = authService.isAuthenticated();
  const currentUserId = getCurrentUserId();

  const loadReviews = useCallback(async () => {
    if (!productId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      setReviews(await reviewApi.getProductReviews(productId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load product reviews'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const summary = useMemo(() => {
    const count = reviews.length;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    const average = count ? total / count : 0;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => Number(review.rating) === rating).length,
    }));

    return {
      count,
      average,
      distribution,
    };
  }, [reviews]);

  const ownReview = useMemo(() => {
    if (!currentUserId) {
      return null;
    }

    return reviews.find((review) => String(review.userId) === String(currentUserId)) || null;
  }, [currentUserId, reviews]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) {
      setFormError('');
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingReviewId(null);
    setFormError('');
  };

  const validateForm = () => {
    if (!Number(form.rating) || Number(form.rating) < 1 || Number(form.rating) > 5) {
      return 'Choose a star rating between 1 and 5.';
    }

    if (!String(form.comment || '').trim()) {
      return 'Write a short review before submitting.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError('');

    const payload = {
      product: Number(productId) || productId,
      rating: Number(form.rating),
      title: form.title.trim(),
      comment: form.comment.trim(),
    };

    try {
      if (editingReviewId) {
        await reviewApi.updateReview(editingReviewId, payload);
        showToast({ title: 'Review updated', message: 'Your product review has been saved.' });
      } else {
        await reviewApi.createReview(payload);
        showToast({ title: 'Review submitted', message: 'Thanks for sharing your feedback.' });
      }
      resetForm();
      await loadReviews();
    } catch (err) {
      const apiMessage = getApiErrorMessage(err, 'Unable to save your review');
      const isDuplicate = 
        apiMessage.toLowerCase().includes('already exists') || 
        apiMessage.toLowerCase().includes('duplicate') ||
        String(err?.response?.data || '').toLowerCase().includes('unique_product_user_review');

      if (isDuplicate) {
        setFormError('You have already reviewed this product. Please edit your existing review below.');
        // If it's a duplicate, we should reload reviews to show the existing one
        await loadReviews();
      } else {
        setFormError(apiMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReviewId(review.id);
    setForm({
      rating: Number(review.rating || 5),
      title: review.title || '',
      comment: review.comment || '',
    });
    setFormError('');
  };

  const handleDelete = async (reviewId) => {
    setSubmitting(true);
    setFormError('');

    try {
      await reviewApi.deleteReview(reviewId);
      showToast({ title: 'Review deleted', message: 'Your review was removed.' });
      resetForm();
      await loadReviews();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to delete this review'));
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateReview = isAuthenticated && (!ownReview || editingReviewId === ownReview.id);

  return (
    <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Customer feedback</p>
        <div className="mt-5 flex items-end gap-3">
          <span className="text-5xl font-black tracking-tighter text-textMain">
            {summary.average ? summary.average.toFixed(1) : '0.0'}
          </span>
          <span className="pb-2 text-sm font-bold text-slate-400">/ 5</span>
        </div>
        <div className="mt-3">
          <StarRating value={Math.round(summary.average)} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          {summary.count} verified review{summary.count === 1 ? '' : 's'}
        </p>

        <div className="mt-6 space-y-3">
          {summary.distribution.map((row) => {
            const width = summary.count ? `${(row.count / summary.count) * 100}%` : '0%';
            return (
              <div key={row.rating} className="grid grid-cols-[38px_1fr_28px] items-center gap-3">
                <span className="text-xs font-black text-slate-500">{row.rating} star</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width }} />
                </div>
                <span className="text-right text-xs font-bold text-slate-400">{row.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {editingReviewId ? 'Edit review' : 'Add review'}
                </p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-textMain">
                  {ownReview && !editingReviewId ? 'You already reviewed this product' : 'Share your experience'}
                </h3>
              </div>
              {editingReviewId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-textMain"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            {canCreateReview ? (
              <div className="mt-6 space-y-4">
                <StarRating value={form.rating} onChange={(rating) => handleChange('rating', rating)} size={22} />
                <input
                  value={form.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  placeholder="Review title"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-textMain outline-none transition-colors focus:border-primary"
                />
                <textarea
                  value={form.comment}
                  onChange={(event) => handleChange('comment', event.target.value)}
                  placeholder="What should other buyers know?"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-textMain outline-none transition-colors focus:border-primary"
                />
                {formError ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {formError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-2xl bg-textMain px-6 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={15} className="text-primary" />
                  {submitting ? 'Saving' : editingReviewId ? 'Update review' : 'Submit review'}
                </button>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                Edit your existing review below to update your feedback.
              </p>
            )}
          </form>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
            <p className="text-sm font-semibold text-slate-600">
              Sign in to leave a verified product review.
            </p>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
            Loading reviews
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isOwnReview = currentUserId && String(review.userId) === String(currentUserId);
              return (
                <article key={review.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/30">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <StarRating value={review.rating} />
                      <h4 className="mt-3 text-lg font-black uppercase tracking-tight text-textMain">
                        {review.title || 'Product review'}
                      </h4>
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                        {review.userName} {formatReviewDate(review.createdAt) ? `- ${formatReviewDate(review.createdAt)}` : ''}
                      </p>
                    </div>
                    {isOwnReview ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(review)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-primary hover:text-textMain"
                          aria-label="Edit review"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 text-rose-500 transition-colors hover:bg-rose-50"
                          aria-label="Delete review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <MessageSquare size={34} className="mx-auto text-slate-300" />
            <p className="mt-4 text-lg font-black uppercase tracking-tight text-textMain">No reviews yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-500">
              Be the first verified buyer to review this product.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductReviews;
