import { create } from 'zustand';
import api from '../services/api';

export const useFeedbackStore = create((set) => ({
  feedbackList: [],
  isLoading: false,
  error: null,
  successMessage: null,

  submitFeedback: async (productId, rating, comment, category) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/feedback', { productId, rating, comment, category });
      set({ 
        isLoading: false, 
        successMessage: 'Thank you for your feedback!' 
      });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to submit feedback',
        isLoading: false,
      });
      return false;
    }
  },

  clearMessages: () => set({ error: null, successMessage: null }),
}));
