import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Standard API Client for BizFlow Web
 * - Auto-attaches JWT Bearer token
 * - Handles 401/403 errors with auto-logout
 * - Uses environment variable for baseURL
 */

const baseURL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '') + '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirecting = false;

// Response Interceptor: Handle Auth Errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only handle auth errors if we have a response
    if (error.response?.status === 401) {
      // 401 means token is invalid or missing - this is a real auth failure
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        if (isRedirecting) return Promise.reject(error);

        isRedirecting = true;
        console.warn('Token không hợp lệ hoặc đã hết hạn. Đang đăng xuất...');

        // Dispatch event for UI to show toast if needed
        window.dispatchEvent(new CustomEvent('bizflow:auth-error', {
          detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
        }));

        // Access store and logout
        try {
          const { useAuthStore } = await import('@/store/useAuthStore');
          useAuthStore.getState().logout();
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('bizflow-auth');
        }

        // Redirect to login
        setTimeout(() => {
          isRedirecting = false;
          window.location.href = '/login?error=session_expired';
        }, 500);
      }
    }
    else if (error.response?.status === 403) {
      // 403 means user is authenticated but not authorized for this resource
      // This is NOT a session expiry - just show error, don't logout
      console.warn('Không có quyền truy cập tài nguyên này:', error.config.url);

      // Dispatch event for UI to show permission error
      window.dispatchEvent(new CustomEvent('bizflow:permission-error', {
        detail: { message: 'Bạn không có quyền thực hiện thao tác này.' }
      }));
    } else if (!error.response) {
      // Network error - no response from server
      console.error('Lỗi kết nối mạng:', error.message);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bizflow:network-error', {
          detail: { message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.' }
        }));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
