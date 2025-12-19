'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { toast as useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/lib/config';

interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
    companyCode?: string;
    companyName?: string;
    phone?: string;
    department?: string;
  } | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (formData: {
    name: string;
    email: string;
    password: string;
    userType: 'user' | 'company' | 'admin';
    companyCode?: string;
    companyName?: string;
    phone?: string;
    department?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token available');
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      toast.error('Session expired. Please log in again.');
      if (!['/', '/auth/login', '/auth/register'].includes(pathname)) {
        router.push('/auth/login');
      }
      return false;
    }
    try {
      console.log('Attempting to refresh token...');
      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      console.log('Refresh token response:', data);
      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setAccessToken(data.accessToken);
        // Keep existing user data - don't re-fetch profile
        console.log('Token refreshed successfully');
        return true;
      } else {
        throw new Error(data.error || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      toast.error('Session expired. Please log in again.');
      if (!['/', '/auth/login', '/auth/register'].includes(pathname)) {
        router.push('/auth/login');
      }
      return false;
    }
  };

  const initializeAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No access token found');
      setIsLoading(false);
      // Only redirect for protected routes
      if (pathname.startsWith('/user') || pathname.startsWith('/admin') || pathname.startsWith('/company')) {
        console.log(`No token, redirecting to /auth/login from ${pathname}`);
        router.push('/auth/login');
      }
      return;
    }
    try {
      setIsLoading(true);
      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded token:', decoded);
      // Use AUTH.PROFILE instead of USER.PROFILE to support all user types (admin, company, user)
      const response = await fetch(`${API_ENDPOINTS.AUTH.PROFILE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.error.includes('expired')) {
          console.log('Access token expired, attempting refresh...');
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            throw new Error('Token refresh failed');
          }
          // After successful refresh, retry with new token
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            const retryResponse = await fetch(`${API_ENDPOINTS.AUTH.PROFILE}`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              setUser({
                id: retryData.user.id,
                name: retryData.user.profile?.name || 'User',
                email: retryData.user.email || decoded.email || '',
                userType: retryData.user.userType || 'user',
                companyName: retryData.user.profile?.companyName || '',
                phone: retryData.user.profile?.phone || '',
                department: retryData.user.profile?.department || '',
              });
              setAccessToken(newToken);
              console.log('User authenticated after token refresh:', retryData);
              return;
            }
          }
          throw new Error('Failed to fetch profile after token refresh');
        }
        throw new Error(errorData.error || `Profile fetch failed: ${response.status}`);
      }
      const data = await response.json();
      setUser({
        id: data.user.id,
        name: data.user.profile?.name || 'User',
        email: data.user.email || decoded.email || '',
        userType: data.user.userType || 'user',
        companyCode: data.user.companyCode || '',
        companyName: data.user.profile?.companyName || '',
        phone: data.user.profile?.phone || '',
        department: data.user.profile?.department || '',
      });
      setAccessToken(token);
      console.log('User authenticated:', data);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (pathname.startsWith('/user') || pathname.startsWith('/admin') || pathname.startsWith('/company')) {
        console.log(`Auth error, redirecting to /auth/login from ${pathname}`);
        router.push('/auth/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password}),
      });
      const data = await response.json();
      console.log('Login response:', data);
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      setUser({
        id: data.user.id,
        name: data.user.profile?.name || 'User',
        email: data.user.email,
        userType: data.user.userType,
        companyCode: data.user.companyCode || '',
        companyName: data.user.profile?.companyName || '',
        phone: data.user.profile?.phone || '',
        department: data.user.profile?.department || '',
      });
      setAccessToken(data.accessToken);
      
      const userTypeName = data.user.userType.charAt(0).toUpperCase() + data.user.userType.slice(1);
      const userName = data.user.profile?.name || 'User';
      
      useToast({
        title: `Login as ${userTypeName} Successful! 🎉`,
        description: `Welcome back, ${userName}! You are logged in as ${userTypeName}.`,
      });

       return {
        userType: data.user.userType,
        name: data.user.profile?.name || 'User',
        ...data.user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    userType: 'user' | 'company' | 'admin';
    companyName?: string;
    companyCode?: string;
    phone?: string;
    department?: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      console.log('Register response:', data);
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(() => console.log('Logout request sent'));
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, isLoading, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}