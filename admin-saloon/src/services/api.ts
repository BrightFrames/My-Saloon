import { API_BASE_URL } from "./apiBase";

const API_URL = API_BASE_URL;

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

async function request(method: string, path: string, body?: any) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Auto logout on 401 Unauthorized or 403 Forbidden
    if (res.status === 401 || res.status === 403) {
      console.warn("Session expired or invalid token. Auto logging out...");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        `Request failed (${res.status})`;
      throw new Error(message);
    }

    return data;
  } catch (err: any) {
    if (err.message === "Session expired") throw err;
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => request("GET", "/admin/dashboard-stats"),

  // Bookings
  getBookings: (filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
      params.append("status", filters.status);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }
    if (filters?.page) {
      params.append("page", String(filters.page));
    }
    if (filters?.limit) {
      params.append("limit", String(filters.limit));
    }
    return request("GET", `/admin/bookings?${params.toString()}`);
  },

  confirmBooking: (id: string) =>
    request("PUT", `/admin/bookings/${id}`, { booking_status: "confirmed" }),

  cancelBooking: (id: string) =>
    request("PUT", `/admin/bookings/${id}`, { booking_status: "cancelled" }),

  completeBooking: (id: string) =>
    request("PUT", `/admin/bookings/${id}`, {
      booking_status: "completed",
      payment_status: "paid",
    }),

  deleteBooking: (id: string) => request("DELETE", `/admin/bookings/${id}`),

  allocateBarber: (bookingId: string, stylist: string) =>
    request("PUT", `/admin/bookings/${bookingId}`, { stylist }),

  // Services
  getServices: () => request("GET", "/admin/services"),
  createService: (data: { name: string; price?: number; originalPrice?: number; discountedPrice?: number; duration: string; homeServiceAvailable?: boolean; homeServicePrice?: number }) =>
    request("POST", "/admin/services", data),
  updateService: (
    id: string,
    data: { name: string; price?: number; originalPrice?: number; discountedPrice?: number; duration: string; homeServiceAvailable?: boolean; homeServicePrice?: number },
  ) => request("PUT", `/admin/services/${id}`, data),
  deleteService: (id: string) => request("DELETE", `/admin/services/${id}`),

  // Team
  getTeam: () => request("GET", "/admin/team"),
  createTeamMember: (data: {
    name: string;
    role: string;
    experience?: string;
    image_url?: string;
    service_ids?: string[];
  }) => request("POST", "/admin/team", data),
  updateTeamMember: (
    id: string,
    data: {
      name: string;
      role: string;
      experience?: string;
      image_url?: string;
      service_ids?: string[];
    },
  ) => request("PUT", `/admin/team/${id}`, data),
  deleteTeamMember: (id: string) => request("DELETE", `/admin/team/${id}`),

  // Salon Profile
  getSalonProfile: async () => {
    return request("GET", "/admin/salon-profile");
  },

  updateSalonProfile: async (data: {
    name: string;
    city: string;
    starting_price: number;
    rating?: number;
    latitude?: number;
    longitude?: number;
    image?: string;
    video?: string;
    home_service_charge?: number;
    about?: string;
    gallery?: string[];
  }) => {
    return request("PUT", "/admin/salon-profile", data);
  },

  createSalonProfile: (data: {
    name: string;
    city: string;
    starting_price: number;
    rating?: number;
    latitude?: number;
    longitude?: number;
  }) => request("POST", "/admin/salon-profile", data),

  uploadFile: (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<{ success: boolean; data: { url: string; filename: string } }> => {
    return new Promise((resolve, reject) => {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/upload`);

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      const fallbackToDataUrl = () => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
        reader.onload = () => {
          if (onProgress) onProgress(100);
          resolve({
            success: true,
            data: {
              url: reader.result as string,
              filename: file.name,
            },
          });
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file. Please try another file."));
        };
        reader.readAsDataURL(file);
      };

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status === 401 || xhr.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/login";
          return reject(new Error("Session expired"));
        }

        if (xhr.status === 413) {
          console.warn(
            "[upload] Server returned 413 Payload Too Large. Encoded client-side for seamless save.",
          );
          return fallbackToDataUrl();
        }

        let data: any = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = null;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          // If server error or unsupported limit, try fallback
          if (file.type.startsWith("video/") || file.type.startsWith("image/")) {
            return fallbackToDataUrl();
          }
          const message =
            data?.message ||
            data?.error?.message ||
            `Upload failed (${xhr.status})`;
          reject(new Error(message));
        }
      };

      xhr.onerror = () => {
        console.warn(
          "[upload] Server network connection dropped. Using local client-side video encoding fallback.",
        );
        fallbackToDataUrl();
      };

      xhr.send(formData);
    });
  },
};
