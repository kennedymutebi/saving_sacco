// src/services/authService.ts
import type { 
  LoginRequest, 
  SignupRequest, 
  VerifyOtpRequest, 
  ChangePasswordRequest, 
  AuthResponse 
} from '../types/auth';

const API_BASE_URL = 'http://84.247.171.71:8082';

interface ResendOtpRequest {
  email: string;
}

class AuthService {
  // Login - sends OTP to email
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        otp_type: email,
      } as LoginRequest),
    });

    const data = await response.json();

    console.log('Login API response:', response.status, data); // Debug log

    if (!response.ok) {
      // Extract the actual error message from the API response
      const errorMessage = data.detail || data.message || data.error || 
                          (data.non_field_errors && data.non_field_errors[0]) ||
                          'Login failed';
      
      // Check for specific error patterns
      if (errorMessage.toLowerCase().includes('not approved') || 
          errorMessage.toLowerCase().includes('pending approval') ||
          errorMessage.toLowerCase().includes('awaiting approval')) {
        throw new Error('Your account is pending approval. Please wait for an administrator to approve your account.');
      }
      
      if (errorMessage.toLowerCase().includes('inactive') || 
          errorMessage.toLowerCase().includes('disabled')) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }
      
      if (errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('incorrect password') ||
          errorMessage.toLowerCase().includes('wrong password')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      
      throw new Error(errorMessage);
    }

    // Some APIs return tokens immediately on login (before OTP)
    const tokensObj = data.tokens || data;
    const accessToken = tokensObj.access || tokensObj.access_token || tokensObj.token || tokensObj.accessToken || tokensObj.jwt || data.access || data.access_token;
    const refreshToken = tokensObj.refresh || tokensObj.refresh_token || tokensObj.refreshToken || data.refresh || data.refresh_token;

    if (accessToken) {
      console.log('Tokens received from login endpoint (storing temporarily)');
      localStorage.setItem('temp_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('temp_refresh_token', refreshToken);
      }
    }

    // Save email for OTP verification
    localStorage.setItem('pending_email', email);
    
    return data;
  }

  // Signup - creates new user account
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
    const response = await fetch(`${API_BASE_URL}/api/auth/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        place_of_residence: placeOfResidence,
      } as SignupRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract specific error messages from signup response
      const errorMessage = data.detail || data.message || data.error ||
                          (data.email && data.email[0]) ||
                          (data.username && data.username[0]) ||
                          (data.password && data.password[0]) ||
                          (data.non_field_errors && data.non_field_errors[0]) ||
                          'Signup failed';
      
      throw new Error(errorMessage);
    }

    // Save email for OTP verification
    localStorage.setItem('pending_email', email);
    
    return data;
  }

  // Verify OTP - completes authentication
  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
      } as VerifyOtpRequest),
    });

    const data = await response.json();

    console.log('Raw API response:', response.status, data); // Debug log
    console.log('Response keys:', Object.keys(data)); // Show all keys in response
    console.log('Full response structure:', JSON.stringify(data, null, 2)); // Pretty print

    if (!response.ok) {
      // Extract specific OTP error messages
      const errorMessage = data.detail || data.message || data.error ||
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

    // Handle different possible response formats
    // Check if tokens are nested in a 'tokens' object
    const tokensObj = data.tokens || data;
    const accessToken = tokensObj.access || tokensObj.access_token || tokensObj.token || tokensObj.accessToken || tokensObj.jwt || data.access || data.access_token;
    const refreshToken = tokensObj.refresh || tokensObj.refresh_token || tokensObj.refreshToken || data.refresh || data.refresh_token;

    console.log('Extracted tokens:', { accessToken: accessToken ? 'found' : 'missing', refreshToken: refreshToken ? 'found' : 'missing' }); // Debug log

    // Save tokens if provided
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      console.log('Access token saved to localStorage'); // Debug log
    } else {
      console.warn('No access token found in response. Available fields:', Object.keys(data)); // Debug warning
      
      // Check if tokens were provided during login
      const tempAccessToken = localStorage.getItem('temp_access_token');
      if (tempAccessToken) {
        console.log('Using tokens from login endpoint');
        localStorage.setItem('access_token', tempAccessToken);
        localStorage.removeItem('temp_access_token');
        
        const tempRefreshToken = localStorage.getItem('temp_refresh_token');
        if (tempRefreshToken) {
          localStorage.setItem('refresh_token', tempRefreshToken);
          localStorage.removeItem('temp_refresh_token');
        }
      } else {
        // If there's a message but no token, the API might use a different flow
        if (data.message && !data.error) {
          console.warn('API returned success message but no token. Response:', data);
        }
      }
    }

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
      console.log('Refresh token saved to localStorage'); // Debug log
    }

    // Save user email
    localStorage.setItem('user_email', email);
    
    // Save user data if provided
    if (data.user) {
      localStorage.setItem('user_data', JSON.stringify(data.user));
      console.log('User data saved to localStorage'); // Debug log
    }
    
    // Clear pending email
    localStorage.removeItem('pending_email');

    // Final check - log what we have in localStorage
    console.log('Final localStorage state:', {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
      user_email: localStorage.getItem('user_email'),
      has_user_data: !!localStorage.getItem('user_data'),
    });

    return data;
  }

  // Resend OTP - sends a new OTP to the user's email
  async resendOtp(email: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/resend-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      } as ResendOtpRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || data.message || data.error || 'Failed to resend OTP';
      throw new Error(errorMessage);
    }

    return data;
  }

  // Change Password
  async changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: confirmPassword,
      } as ChangePasswordRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.detail || data.message || data.error ||
                          (data.old_password && data.old_password[0]) ||
                          (data.new_password && data.new_password[0]) ||
                          'Password change failed';
      throw new Error(errorMessage);
    }

    return data;
  }

  // Logout
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_data');
    localStorage.removeItem('pending_email');
    localStorage.removeItem('temp_access_token');
    localStorage.removeItem('temp_refresh_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    console.log('Checking authentication, token:', token ? 'exists' : 'missing'); // Debug log
    return !!token;
  }

  // Get current user email
  getCurrentUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Get user data
  getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}

export const authService = new AuthService();
export default authService;