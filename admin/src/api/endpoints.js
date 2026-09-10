import api from './client';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  stats: () => api.get('/orders/stats'),
};

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get('/products/admin/' + id),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put('/products/' + id, payload),
  remove: (id) => api.delete('/products/' + id),
  toggle: (id) => api.patch('/products/' + id + '/availability'),
};

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (payload) => api.post('/categories', payload),
  update: (id, payload) => api.put('/categories/' + id, payload),
  remove: (id) => api.delete('/categories/' + id),
};

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get('/orders/' + id),
  updateStatus: (id, status, note) => api.patch('/orders/' + id + '/status', { status, ...(note ? { note } : {}) }),
};

export const customerApi = {
  list: (params) => api.get('/admin/customers', { params }),
  get: (id) => api.get('/admin/customers/' + id),
  toggleBlock: (id) => api.patch('/admin/customers/' + id + '/block'),
  changeRole: (id, role) => api.patch('/admin/customers/' + id + '/role', { role }),
};

export const couponApi = {
  list: (params) => api.get('/coupons', { params }),
  create: (payload) => api.post('/coupons', payload),
  update: (id, payload) => api.put('/coupons/' + id, payload),
  remove: (id) => api.delete('/coupons/' + id),
};

export const slotApi = {
  list: () => api.get('/delivery/admin/slots'),
  create: (payload) => api.post('/delivery/slots', payload),
  update: (id, payload) => api.put('/delivery/slots/' + id, payload),
  remove: (id) => api.delete('/delivery/slots/' + id),
};

export const reviewApi = {
  list: (params) => api.get('/reviews', { params }),
  moderate: (id, payload) => api.patch('/reviews/' + id + '/moderate', payload),
  remove: (id) => api.delete('/reviews/' + id),
};

export const contactApi = {
  list: (params) => api.get('/contact', { params }),
  update: (id, payload) => api.patch('/contact/' + id, payload),
};

export const settingsApi = {
  get: () => api.get('/settings/admin'),
  update: (payload) => api.put('/settings/admin', payload),
};

export const snackBoxApi = {
  config: () => api.get('/snack-box/admin/config'),
  update: (payload) => api.put('/snack-box/admin/config', payload),
};

export const paymentApi = {
  refund: (orderId, amount) => api.post('/payments/' + orderId + '/refund', { amount }),
};

export const uploadApi = {
  images: (files, folder = 'products') => {
    const form = new FormData();
    [...files].forEach((f) => form.append('images', f));
    form.append('folder', folder);
    return api.post('/admin/uploads/images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
