import axios from 'axios';

const API_BASE_URL = 'http://localhost:7788';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (formData) => apiClient.post('/signup', {
    FirstName: formData.firstName,
    LastName: formData.lastName,
    Email: formData.email,
    Password: formData.password,
    PhoneNumber: formData.phone
  }),
  
  login: (formData) => apiClient.post('/login', {
    Email: formData.email,
    Password: formData.password
  }),
  
  adminLogin: (formData) => apiClient.post('/admin-login', {
    Email: formData.email,
    Password: formData.password
  }),
  
  forgotPassword: (email) => apiClient.post('/forgot-password', {
    Email: email
  }),
  
  resetPassword: (email, newPassword) => apiClient.post('/reset-password', {
    Email: email,
    NewPassword: newPassword
  })
};

// Products APIs
export const productsAPI = {
  getAll: () => apiClient.get('/products'),
  
  getById: (id) => apiClient.get(`/products/${id}`),
  
  getByCategory: (category) => apiClient.get(`/products/category/${category}`),
  
  create: (productData) => apiClient.post('/products', productData),
  
  update: (id, productData) => apiClient.put(`/products/${id}`, productData),
  
  delete: (id) => apiClient.delete(`/products/${id}`)
};

// Categories APIs
export const categoriesAPI = {
  getAll: () => apiClient.get('/categories')
};

// Orders APIs
export const ordersAPI = {
  create: (orderData) => apiClient.post('/orders', orderData),
  
  getAll: () => apiClient.get('/orders'),
  
  getById: (id) => apiClient.get(`/orders/${id}`),
  
  getByUser: () => apiClient.get('/orders/user/mine')
};

// Chat API
export const chatAPI = {
  sendMessage: (message) => apiClient.post('/chat', {
    message: message
  })
};

export default apiClient;
