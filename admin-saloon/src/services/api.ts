const API_URL = 'http://localhost:3000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

async function request(method: string, path: string, body?: any) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Auto logout on 401 Unauthorized or 403 Forbidden
    if (res.status === 401 || res.status === 403) {
      console.warn('Session expired or invalid token. Auto logging out...');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (err: any) {
    if (err.message === 'Session expired') throw err;
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('GET', '/admin/dashboard-stats'),

  // Bookings
  getBookings: (filters?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }
    return request('GET', `/admin/bookings?${params.toString()}`);
  },
  
  confirmBooking: (id: string) =>
    request('PUT', `/admin/bookings/${id}`, { booking_status: 'confirmed' }),
    
  cancelBooking: (id: string) =>
    request('PUT', `/admin/bookings/${id}`, { booking_status: 'cancelled' }),
    
  completeBooking: (id: string) =>
    request('PUT', `/admin/bookings/${id}`, { booking_status: 'completed', payment_status: 'paid' }),

  deleteBooking: (id: string) =>
    request('DELETE', `/admin/bookings/${id}`),

  allocateBarber: (bookingId: string, stylist: string) =>
    request('PUT', `/admin/bookings/${bookingId}`, { stylist }),

  // Services
  getServices: () => request('GET', '/admin/services'),
  createService: (data: { name: string; price: number; duration: string }) =>
    request('POST', '/admin/services', data),
  updateService: (id: string, data: { name: string; price: number; duration: string }) =>
    request('PUT', `/admin/services/${id}`, data),
  deleteService: (id: string) => request('DELETE', `/admin/services/${id}`),

  // Team
  getTeam: () => request('GET', '/admin/team'),

  // Salon Profile
  getSalonProfile: () => request('GET', '/admin/salon-profile'),
  updateSalonProfile: (data: { name: string; city: string; starting_price: number; latitude?: number; longitude?: number }) =>
    request('PUT', '/admin/salon-profile', data),
};
