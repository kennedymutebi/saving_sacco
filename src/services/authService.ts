/**
 * authService.ts — Authentication Service
 *
 * Handles all authentication-related API calls:
 * - Login (triggers OTP flow)
 * - Signup
 * - OTP Verification (issues final tokens)
 * - Resend OTP
 * - Forgot Password
 * - Change Password
 * - Logout
 *
 * Tokens are stored in localStorage and managed
 * centrally via apiClient.ts.
 */


import { apiRequest } from '../config/apiClient';
import type {
  LoginRequest,
  SignupRequest,
  VerifyOtpRequest,
  ChangePasswordRequest,
  AuthResponse,
} from '../types/auth';

interface ResendOtpRequest {
  email: string;
}

class AuthService {

  /**
   * LOGIN
   * Sends credentials to backend.
   * Backend responds by sending an OTP to the user's email.
   * Tokens are NOT issued yet — they come after OTP verification.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password, otp_type: email } as LoginRequest),
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

      if (errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('incorrect password')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }

      throw new Error(errorMessage);
    }

    // Some backends return tokens at login before OTP — store temporarily
    const tokensObj = data.tokens || data;
    const accessToken = tokensObj.access || tokensObj.access_token || tokensObj.token;
    const refreshToken = tokensObj.refresh || tokensObj.refresh_token;

    if (accessToken) {
      localStorage.setItem('temp_access_token', accessToken);
      if (refreshToken) localStorage.setItem('temp_refresh_token', refreshToken);
    }

    // Save email for OTP verification step
    localStorage.setItem('pending_email', email);

    return data;
  }

  /**
   * SIGNUP
   * Creates a new saver account.
   * After signup, user must verify OTP before accessing the system.
   */
  async signup(
    email: string,
    username: string,
    password: string,
    password2: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    placeOfResidence: string
  ): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/signup/', {
      method: 'POST',
      body: JSON.stringify({
        email, username, password, password2,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        place_of_residence: placeOfResidence,
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

    localStorage.setItem('pending_email', email);
    return data;
  }

  /**
   * VERIFY OTP
   * Completes the authentication flow.
   * Backend returns the final access + refresh tokens here.
   */
  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp } as VerifyOtpRequest),
    }, false);

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.detail || data.message || data.error ||
        (data.otp && data.otp[0]) ||
        (data.non_field_errors && data.non_field_errors[0]) ||
        'OTP verification failed';

      if (errorMessage.toLowerCase().includes('invalid') ||
          errorMessage.toLowerCase().includes('incorrect')) {
        throw new Error('Invalid OTP. Please check the code and try again.');
      }

      if (errorMessage.toLowerCase().includes('expired')) {
        throw new Error('OTP has expired. Please request a new code.');
      }

      throw new Error(errorMessage);
    }

    // Extract tokens from response
    const tokensObj = data.tokens || data;
    const accessToken = tokensObj.access || tokensObj.access_token || tokensObj.token;
    const refreshToken = tokensObj.refresh || tokensObj.refresh_token;

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    } else {
      // Fallback: use tokens stored during login step
      const tempToken = localStorage.getItem('temp_access_token');
      if (tempToken) {
        localStorage.setItem('access_token', tempToken);
        localStorage.removeItem('temp_access_token');

        const tempRefresh = localStorage.getItem('temp_refresh_token');
        if (tempRefresh) {
          localStorage.setItem('refresh_token', tempRefresh);
          localStorage.removeItem('temp_refresh_token');
        }
      }
    }

    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    if (data.user) localStorage.setItem('user_data', JSON.stringify(data.user));

    localStorage.setItem('user_email', email);
    localStorage.removeItem('pending_email');

    return data;
  }

  /**
   * RESEND OTP
   * Triggers a new OTP to be sent to the user's email.
   */
  async resendOtp(email: string): Promise<AuthResponse> {
    const response = await apiRequest('/api/auth/resend-otp/', {
      method: 'POST',
      body: JSON.stringify({ email } as ResendOtpRequest),
    }, false);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || data.error || 'Failed to resend OTP');
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
   * If token is expired, apiClient automatically redirects to login.
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
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_data');
    localStorage.removeItem('pending_email');
    localStorage.removeItem('temp_access_token');
    localStorage.removeItem('temp_refresh_token');
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