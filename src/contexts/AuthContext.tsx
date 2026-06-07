import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/integrations/api/client';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data.user);
        } catch (err) {
          console.error('Session check error:', err);
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Note: The backend register endpoint doesn't accept fullName yet
      // But we can store it in localStorage or update the profile later
      const response = await apiClient.post('/auth/register', {
        email,
        password
      });
      
      // Store the JWT token
      localStorage.setItem('access_token', response.data.access_token);
      setUser({ id: response.data.user_id, email });
      return { error: null };
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Signup failed';
      return { error: new Error(errorMessage) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      // Store the JWT token
      localStorage.setItem('access_token', response.data.access_token);
      setUser({ id: response.data.user_id, email });
      return { error: null };
    } catch (err: any) {
      console.error('Signin error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Invalid credentials';
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
