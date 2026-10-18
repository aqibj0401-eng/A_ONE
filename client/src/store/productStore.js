import { create } from 'zustand';
import api from '../services/api';

export const useProductStore = create((set) => ({
  products: [],
  product: null,
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/products');
      set({ products: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  fetchProductById: async (id) => {
    set({ isLoading: true, error: null, product: null });
    try {
      const response = await api.get(`/products/${id}`);
      set({ product: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to fetch product',
        isLoading: false,
      });
    }
  },
  
  clearError: () => set({ error: null })
}));
