/**
 * authService.ts — Authentication Service
 *
 * Handles all authentication-related API calls:
 * - Login (issues tokens immediately — backend has NO OTP step)
 * - Signup (creates an admin account pending approval)
 * - Forgot / Change Password
 * - Logout
 *
 * ⚠️ IMPORTANT: The backend does NOT have /api/auth/verify-otp/ or
 * /api/auth/resend-otp/ endpoints. Login returns final access/refresh
 * tokens directly in the response body under `tokens.access` /
 * `tokens.refresh`. Any page that navigates to a "/verify-otp" route
 * after login needs to be updated to go straight to the dashboard.
 *
 * Tokens are stored in localStorage and managed centrally via apiClient.ts.
 */

import { apiRequest } from '../config/apiClient';
import type {
  SignupRequest,
  ChangePasswordRequest,
  AuthResponse,
} from '../types/auth';

class AuthService {

  /**
   * LOGIN
   * Sends credentials to backend. Backend responds immediately with
   * { user, message, tokens: { access, refresh } } — no OTP involved.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false); // false = no token required for login

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.detail || data.message || data.error ||
        (data.non_field_errors && data.non_field_errors[0]) ||
        'Login failed';

      if (errorMessage.toLowerCase().includes('not approved') ||
          errorMessage.toLowerCase().includes('pending approval')) {
        throw new Error('Your account is pending approval. Please wait for an administrator to approve your account.');
      }

      if (errorMessage.toLowerCase().includes('inactive') ||
          errorMessage.toLowerCase().includes('disabled')) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      if (errorMessage.toLowerCase().includes('invalid')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }

      throw new Error(errorMessage);
    }

    // Tokens are nested under `tokens`, NOT top-level.
    const accessToken = data.tokens?.access;
    const refreshToken = data.tokens?.refresh;

    if (!accessToken) {
      throw new Error('Login succeeded but no access token was returned. Contact support.');
    }

    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    if (data.user) localStorage.setItem('user_data', JSON.stringify(data.user));
    localStorage.setItem('user_email', email);

    return data;
  }

  /**
   * SIGNUP
   * Creates a new admin account. Account is pending approval until
   * an existing admin approves it (via emailed link / approve-user endpoint).
   * No OTP or tokens are issued at signup.
   */
  async signup(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/signup/', {
      method: 'POST',
      body: JSON.stringify({
        email, username, password,
        first_name: firstName,
        last_name: lastName,
      } as SignupRequest),
    }, false);

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.detail || data.message || data.error ||
        (data.email && data.email[0]) ||
        (data.username && data.username[0]) ||
        (data.password && data.password[0]) ||
        (data.non_field_errors && data.non_field_errors[0]) ||
        'Signup failed';

      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * FORGOT PASSWORD
   * Sends a password reset link to the user's email.
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await apiRequest('/api/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.detail || 'Failed to send reset link.');
    }
  }

  /**
   * CHANGE PASSWORD
   * Requires a valid access token.
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: confirmPassword,
      } as ChangePasswordRequest),
    }); // requiresAuth defaults to true

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.detail || data.message || data.error ||
        (data.old_password && data.old_password[0]) ||
        (data.new_password && data.new_password[0]) ||
        'Password change failed';

      throw new Error(errorMessage);
    }

    return data;
  }

  /**
   * LOGOUT
   * Clears all auth data from localStorage.
   * (Optionally also call POST /api/auth/logout/ to blacklist the refresh token server-side.)
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_data');
  }

  /** Returns true if an access token exists in localStorage */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /** Returns the logged-in user's email */
  getCurrentUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }

  /** Returns the raw access token string */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /** Returns the parsed user data object or null */
  getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}

export const authService = new AuthService();
export default authService;