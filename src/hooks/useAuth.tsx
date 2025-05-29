
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '@/utils/apiClient';
import { trackUserActivity } from '@/utils/sessionTracker';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
  sessionId: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
  sessionId: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  gender: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Initialize session tracking
    const session = localStorage.getItem('sessionId') || generateSessionId();
    setSessionId(session);
    localStorage.setItem('sessionId', session);

    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.userId,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            sessionId: session
          });
          
          // Track session restoration
          trackUserActivity({
            action: 'session_restored',
            sessionId: session,
            timestamp: new Date()
          });
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const generateSessionId = (): string => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Track login attempt
      await trackUserActivity({
        action: 'login_attempt',
        email: credentials.email,
        sessionId,
        timestamp: new Date(),
        ipAddress: await getClientIP()
      });

      const response = await apiClient.post('/auth/login', {
        ...credentials,
        sessionId
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('authToken', token);
        
        const userWithSession = { ...userData, sessionId };
        setUser(userWithSession);

        // Track successful login
        await trackUserActivity({
          action: 'login_success',
          userId: userData.id,
          sessionId,
          timestamp: new Date(),
          ipAddress: await getClientIP()
        });

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userData.name}!`,
        });

        return true;
      } else {
        // Track failed login
        await trackUserActivity({
          action: 'login_failed',
          email: credentials.email,
          sessionId,
          reason: response.data.message,
          timestamp: new Date(),
          ipAddress: await getClientIP()
        });

        toast({
          title: "Login Failed",
          description: response.data.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      // Track login error
      await trackUserActivity({
        action: 'login_error',
        email: credentials.email,
        sessionId,
        error: error.message,
        timestamp: new Date(),
        ipAddress: await getClientIP()
      });

      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);

      // Track registration attempt
      await trackUserActivity({
        action: 'registration_attempt',
        email: userData.email,
        sessionId,
        timestamp: new Date(),
        ipAddress: await getClientIP()
      });

      const response = await apiClient.post('/auth/register', {
        ...userData,
        sessionId
      });

      if (response.data.success) {
        // Track successful registration
        await trackUserActivity({
          action: 'registration_success',
          email: userData.email,
          sessionId,
          timestamp: new Date(),
          ipAddress: await getClientIP()
        });

        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully. Please login.",
        });
        return true;
      } else {
        // Track failed registration
        await trackUserActivity({
          action: 'registration_failed',
          email: userData.email,
          sessionId,
          reason: response.data.message,
          timestamp: new Date(),
          ipAddress: await getClientIP()
        });

        toast({
          title: "Registration Failed",
          description: response.data.message,
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Track logout
      await trackUserActivity({
        action: 'logout',
        userId: user?.id,
        sessionId,
        timestamp: new Date(),
        ipAddress: await getClientIP()
      });

      await apiClient.post('/auth/logout', { sessionId });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('authToken');
    setUser(null);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAdmin,
      loading,
      sessionId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
