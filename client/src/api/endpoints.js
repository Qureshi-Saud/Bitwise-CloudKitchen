import api from './client';

export const configApi = {
  storefront: () => api.get('/config'),
};

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  google: (idToken) => api.post('/auth/google', { idToken }),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  me: () => api.get('/auth/me'),
  sessions: () => api.get('/auth/sessions'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.patch('/auth/change-password', payload),
};

export const catalogueApi = {
  categories: () => api.get('/categories'),
  products: (params) => api.get('/products', { params }),
  popular: (limit = 8) => api.get('/products/popular', { params: { limit } }),
  suggestions: (q) => api.get('/products/search-suggestions', { params: { q } }),
  product: (slug) => api.get('/products/' + slug),
  customizePreview: (id, payload) => api.post('/products/' + id + '/customize-preview', payload),
};

export const nutritionApi = {
  guide: () => api.get('/nutrition/guide'),
  table: (params) => api.get('/nutrition/products', { params }),
};

export const snackBoxApi = {
  config: () => api.get('/snack-box/config'),
  quote: (payload) => api.post('/snack-box/quote', payload),
};

export const orderApi = {
  quote: (payload) => api.post('/orders/quote', payload),
  create: (payload) => api.post('/orders', payload),
  mine: (params) => api.get('/orders/my', { params }),
  track: (orderNumber) => api.get('/orders/track/' + orderNumber),
  cancel: (id, reason) => api.patch('/orders/' + id + '/cancel', { reason }),
};

export const paymentApi = {
  methods: () => api.get('/payments/methods'),
  verify: (payload) => api.post('/payments/verify', payload),
};

export const deliveryApi = {
  slots: (date) => api.get('/delivery/slots', { params: { date } }),
};

export const couponApi = {
  available: () => api.get('/coupons/available'),
};

export const reviewApi = {
  pending: () => api.get('/reviews/pending'),
  mine: () => api.get('/reviews/my'),
  create: (payload) => api.post('/reviews', payload),
  update: (id, payload) => api.put('/reviews/' + id, payload),
  remove: (id) => api.delete('/reviews/' + id),
};

export const userApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.patch('/users/profile', payload),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addAddress: (payload) => api.post('/users/addresses', payload),
  updateAddress: (id, payload) => api.put('/users/addresses/' + id, payload),
  deleteAddress: (id) => api.delete('/users/addresses/' + id),
  toggleFavourite: (productId) => api.post('/users/favourites/' + productId),
  notifications: (params) => api.get('/users/notifications', { params }),
  readAllNotifications: () => api.patch('/users/notifications/read-all'),
  rewards: () => api.get('/users/rewards'),
};

export const chatbotApi = {
  welcome: () => api.get('/chatbot/welcome'),
  send: (text, sessionId) => api.post('/chatbot/message', { text, sessionId }),
};

export const contactApi = {
  submit: (payload) => api.post('/contact', payload),
};
