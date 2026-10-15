import {
  User,
  Address,
  Category,
  Product,
  Review,
  Order,
  Coupon,
  AdminMetrics,
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('gocart_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; password: string; phone?: string }) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ token: string; user: User; message: string }>(res);
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ token: string; user: User; message: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  async updateProfile(data: { name?: string; phone?: string; avatar?: string }) {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; user: User }>(res);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Addresses
  async getAddresses() {
    const res = await fetch(`${BASE_URL}/addresses`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Address[]>(res);
  },

  async createAddress(address: Omit<Address, 'id' | 'userId'>) {
    const res = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(address),
    });
    return handleResponse<Address>(res);
  },

  async updateAddress(id: string, address: Partial<Address>) {
    const res = await fetch(`${BASE_URL}/addresses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(address),
    });
    return handleResponse<Address>(res);
  },

  async deleteAddress(id: string) {
    const res = await fetch(`${BASE_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Categories
  async getCategories() {
    const res = await fetch(`${BASE_URL}/categories`);
    return handleResponse<Category[]>(res);
  },

  // Products
  async getProducts(params?: {
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    inStock?: boolean;
    featured?: boolean;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const res = await fetch(`${BASE_URL}/products?${query.toString()}`);
    return handleResponse<{
      products: Product[];
      total: number;
      page: number;
      totalPages: number;
      hasMore: boolean;
    }>(res);
  },

  async getProduct(idOrSlug: string) {
    const res = await fetch(`${BASE_URL}/products/${idOrSlug}`);
    return handleResponse<{ product: Product; related: Product[]; reviews: Review[] }>(res);
  },

  // Reviews
  async getReviews(productId: string) {
    const res = await fetch(`${BASE_URL}/reviews/${productId}`);
    return handleResponse<Review[]>(res);
  },

  async submitReview(data: { productId: string; rating: number; comment: string }) {
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Review>(res);
  },

  // Cart
  async getCart() {
    const res = await fetch(`${BASE_URL}/cart`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      userId: string;
      items: Array<{ productId: string; quantity: number; product: Product }>;
    }>(res);
  },

  async syncCart(items: Array<{ productId: string; quantity: number }>) {
    const res = await fetch(`${BASE_URL}/cart/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items }),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Wishlist
  async getWishlist() {
    const res = await fetch(`${BASE_URL}/wishlist`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ userId: string; products: Product[] }>(res);
  },

  async toggleWishlist(productId: string) {
    const res = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId }),
    });
    return handleResponse<{ inWishlist: boolean; productIds: string[] }>(res);
  },

  // Coupons
  async validateCoupon(code: string, subtotal: number) {
    const res = await fetch(`${BASE_URL}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    return handleResponse<{
      valid: boolean;
      code: string;
      discount: number;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
    }>(res);
  },

  // Orders
  async createOrder(data: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: Omit<Address, 'id' | 'userId' | 'isDefault'>;
    couponCode?: string;
    paymentMethod: 'card' | 'cod';
  }) {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; order: Order }>(res);
  },

  async payOrder(
    orderId: string,
    cardData: { cardNumber: string; cardExp: string; cardCvc: string }
  ) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cardData),
    });
    return handleResponse<{ message: string; order: Order }>(res);
  },

  async getOrders() {
    const res = await fetch(`${BASE_URL}/orders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Order[]>(res);
  },

  async getOrder(id: string) {
    const res = await fetch(`${BASE_URL}/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Order>(res);
  },

  async cancelOrder(id: string) {
    const res = await fetch(`${BASE_URL}/orders/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; order: Order }>(res);
  },

  // Newsletter
  async subscribeNewsletter(email: string) {
    const res = await fetch(`${BASE_URL}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Admin APIs
  async getAdminMetrics() {
    const res = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminMetrics>(res);
  },

  async createAdminProduct(productData: Partial<Product>) {
    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse<Product>(res);
  },

  async updateAdminProduct(id: string, productData: Partial<Product>) {
    const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse<Product>(res);
  },

  async deleteAdminProduct(id: string) {
    const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async createAdminCategory(data: Partial<Category>) {
    const res = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Category>(res);
  },

  async updateAdminCategory(id: string, data: Partial<Category>) {
    const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Category>(res);
  },

  async deleteAdminCategory(id: string) {
    const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminOrders(params?: { status?: string; q?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.q) query.append('q', params.q);
    const res = await fetch(`${BASE_URL}/admin/orders?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Order[]>(res);
  },

  async updateAdminOrderStatus(
    orderId: string,
    data: {
      orderStatus?: string;
      paymentStatus?: string;
      trackingCarrier?: string;
      trackingNumber?: string;
    }
  ) {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Order>(res);
  },

  async getAdminCustomers() {
    const res = await fetch(`${BASE_URL}/admin/customers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<
      Array<{
        id: string;
        name: string;
        email: string;
        phone?: string;
        status: 'active' | 'suspended';
        createdAt: string;
        orderCount: number;
        totalSpent: number;
      }>
    >(res);
  },

  async updateAdminCustomerStatus(id: string, status: 'active' | 'suspended') {
    const res = await fetch(`${BASE_URL}/admin/customers/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminCoupons() {
    const res = await fetch(`${BASE_URL}/admin/coupons`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Coupon[]>(res);
  },

  async createAdminCoupon(coupon: Partial<Coupon>) {
    const res = await fetch(`${BASE_URL}/admin/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(coupon),
    });
    return handleResponse<Coupon>(res);
  },

  async updateAdminCoupon(id: string, coupon: Partial<Coupon>) {
    const res = await fetch(`${BASE_URL}/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(coupon),
    });
    return handleResponse<Coupon>(res);
  },

  async deleteAdminCoupon(id: string) {
    const res = await fetch(`${BASE_URL}/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminReviews() {
    const res = await fetch(`${BASE_URL}/admin/reviews`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Review[]>(res);
  },

  async deleteAdminReview(id: string) {
    const res = await fetch(`${BASE_URL}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('gocart_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<{ url: string }>(res);
  },
};
