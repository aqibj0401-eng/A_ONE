import { useState, useEffect } from 'react';
import { useFeedbackStore } from '../store/feedbackStore';
import { trackEvent } from '../utils/behaviorTracker';
import { X, Star } from 'lucide-react';

const CATEGORIES = [
  'Product Quality',
  'Price',
  'Delivery',
  'Customer Service',
  'Website Experience',
  'Other'
];

const FeedbackModal = ({ isOpen, onClose, productId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const { submitFeedback, isLoading, error, successMessage, clearMessages } = useFeedbackStore();

  useEffect(() => {
    if (isOpen) {
      clearMessages();
      setRating(0);
      setComment('');
      setCategory(CATEGORIES[0]);
    }
  }, [isOpen, clearMessages]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    const success = await submitFeedback(productId, rating, comment, category);
    if (success) {
      trackEvent('feedback_submitted', { productId, rating, category });
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-[#fcfcfc] opacity-90" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 inline-block align-bottom bg-[#fcfcfc] border border-gray-400 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 py-6 md:p-8">
            <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
              <h3 className="text-3xl font-serif font-medium tracking-tight text-[#111111]">
                Leave Feedback
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {successMessage ? (
              <div className="border border-black text-[#111111] px-6 py-12 text-center">
                <h4 className="text-xl font-serif font-medium mb-2">Thank You.</h4>
                <p className="text-sm">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 border border-red-500 bg-red-50 text-red-600 px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-8 text-center">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`h-8 w-8 transition-colors ${
                            (hoverRating || rating) >= star ? 'text-[#111111] fill-current' : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-widest text-gray-900 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-400 bg-transparent rounded-none focus:outline-none focus:border-[#111111] text-sm text-gray-900 transition-colors cursor-pointer appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-8">
                  <label className="block text-xs uppercase tracking-widest text-gray-900 mb-2">Your Comment</label>
                  <textarea
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-400 bg-transparent rounded-none focus:outline-none focus:border-[#111111] text-sm text-gray-900 transition-colors resize-none"
                    placeholder="Tell us what you think..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-400 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-8 py-3 border border-[#111111] text-sm font-medium text-white bg-[#111111] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
