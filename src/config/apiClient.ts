/**
 * apiClient.ts — Central HTTP Client
 *
 * All API calls in this app go through this client.
 * It automatically:
 *  - Attaches the Bearer token to every request
 *  - Detects 401 (token expired) responses
 *  - Clears auth data and redirects to /login
 *
 * This solves the problem of expired tokens showing
 * errors instead of redirecting the user to login.
 */

const API_BASE_URL = 'http://84.247.171.71:8082';

/**
 * Clears all auth data from localStorage and
 * redirects the user to the login page.
 */
const handleTokenExpiry = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_data');
  localStorage.removeItem('pending_email');
  localStorage.removeItem('temp_access_token');
  localStorage.removeItem('temp_refresh_token');

  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Main API request function.
 * Use this instead of fetch() directly in all services.
 *
 * @param endpoint - API path e.g. '/api/auth/login/'
 * @param options  - Standard fetch options (method, body, etc.)
 * @param requiresAuth - Whether to attach Bearer token (default: true)
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach token if this request needs authentication
  if (requiresAuth) {
    const token = localStorage.getItem('access_token');

    if (!token) {
      // No token at all — send to login immediately
      handleTokenExpiry();
      throw new Error('No authentication token found');
    }

    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If backend says 401 (Unauthorized) — token expired or invalid
  if (response.status === 401 && requiresAuth) {
    handleTokenExpiry();
    throw new Error('Session expired. Please log in again.');
  }

  return response;
};

export default API_BASE_URL;