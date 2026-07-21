import axios from 'axios';

// Use Vite proxy during development when VITE_API_BASE_URL is not set.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    config.headers = config.headers || {};
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
  
  adminLogin: (formData) => apiClient.post('/admin/login', {
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
  resetPasswordWithToken: (token, newPassword) => apiClient.post('/reset-password', {
    Token: token,
    NewPassword: newPassword
  }),

  updateProfile: (profileData) => apiClient.post('/profile', profileData)
};

// OTP endpoints removed — OTP flow deprecated

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
  
  getByUser: (identifier) => apiClient.get(`/orders/${identifier}`),

  getAdminOrders: () => apiClient.get('/admin/orders'),

  updateStatus: (orderId, status, note) => apiClient.post('/admin/orders/status', {
    OrderId: orderId,
    Status: status,
    Note: note
  })
};

// User APIs
export const userAPI = {
  getByIdentifier: (identifier) => apiClient.get(`/users/${identifier}`)
};

// Payments API
export const paymentsAPI = {
  createRazorpayOrder: (paymentData) => apiClient.post('/razorpay/create-order', {
    Amount: paymentData.amount,
    Currency: paymentData.currency || 'INR',
    Receipt: paymentData.receipt
  }),

  verifyRazorpayPayment: (paymentData) => apiClient.post('/razorpay/verify-payment', {
    RazorpayOrderId: paymentData.orderId,
    RazorpayPaymentId: paymentData.paymentId,
    RazorpaySignature: paymentData.signature
  })
};

// Chat API
export const chatAPI = {
  sendMessage: (message) => apiClient.post('/chat-bot', {
    message: message
  })
};

export default apiClient;
