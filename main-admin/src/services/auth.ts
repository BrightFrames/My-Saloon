import { API_BASE_URL } from "./apiBase";

const API_URL = API_BASE_URL;

export const auth = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/superadmin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("superadmin_token", data.token);
        localStorage.setItem("superadmin_user", data.user.email);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Super Admin Login error", err);
      return false;
    }
  },
  getCurrent: (): string | null => {
    return localStorage.getItem("superadmin_user");
  },
  getToken: (): string | null => {
    return localStorage.getItem("superadmin_token");
  },
  logout: () => {
    localStorage.removeItem("superadmin_user");
    localStorage.removeItem("superadmin_token");
  },
};
