// src/types/auth.ts

export interface LoginRequest {
  email: string;
  password: string;
  otp_type: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  place_of_residence: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export interface AuthResponse {
  access?: string;
  refresh?: string;
  message?: string;
  detail?: string;
  user?: UserData;
}

export interface UserData {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  place_of_residence: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
}