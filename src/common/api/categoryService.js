import api from './axiosConfig';

export const categoryService = {



  getAllCategories: () => api.get('/api/categories'),
  addCategory: (categoryData) => api.post('/api/categories', categoryData),
  updateCategory: (categoryData) => api.put('/api/categories', categoryData),
  deleteCategory: (categoryId) => api.delete('/api/categories', { 
    data: { id: categoryId } 
  }),
  

  
  getCategoryProducts: (categoryId) => 
    api.get(`/api/categories/${categoryId}/products`)
};