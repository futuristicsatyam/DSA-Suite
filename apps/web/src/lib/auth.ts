import { api } from './utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post<AuthResponse>('/auth/signup', data),

  login: (identifier: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { identifier, password }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<AuthUser>('/auth/me'),

  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),

  sendEmailOtp: (email: string) =>
    api.post('/auth/send-email-otp', { email }),

  verifyEmailOtp: (target: string, code: string) =>
    api.post('/auth/verify-email-otp', { target, code }),

  sendPhoneOtp: (phone: string) =>
    api.post('/auth/send-phone-otp', { phone }),

  verifyPhoneOtp: (target: string, code: string) =>
    api.post('/auth/verify-phone-otp', { target, code }),

  forgotPassword: (identifier: string) =>
    api.post('/auth/forgot-password', { identifier }),

  resetPassword: (target: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { target, code, newPassword }),
};
