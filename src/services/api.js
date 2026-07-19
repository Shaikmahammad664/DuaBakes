import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7788';

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
  }),

  updateProfile: (profileData) => apiClient.post('/profile', profileData)
};

// OTP endpoints (backend must support these routes)
authAPI.sendOtp = (phoneOrEmail) => apiClient.post('/send-otp', {
  to: phoneOrEmail
});

authAPI.verifyOtp = (identifier, otp) => apiClient.post('/verify-otp', {
  identifier,
  otp
});

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
  
  getByUser: (email) => apiClient.get(`/orders/${email}`)
};

// Chat API
export const chatAPI = {
  sendMessage: (message) => apiClient.post('/chat-bot', {
    message: message
  })
};

export default apiClient;
