
import { supabase } from '@/integrations/supabase/client';
import { trackPotentialAttack } from './sessionTracker';

// Simulate API client for honeypot functionality
export const apiClient = {
  async post(endpoint: string, data: any) {
    // Track API calls for honeypot analysis
    const requestData = {
      method: 'POST',
      url: endpoint,
      timestamp: new Date(),
      data: data
    };

    // Store request for potential analysis
    const apiLogs = JSON.parse(localStorage.getItem('apiLogs') || '[]');
    apiLogs.push(requestData);
    if (apiLogs.length > 50) {
      apiLogs.splice(0, apiLogs.length - 50);
    }
    localStorage.setItem('apiLogs', JSON.stringify(apiLogs));

    // Simulate API responses for different endpoints
    try {
      if (endpoint === '/auth/login') {
        return this.handleLogin(data);
      } else if (endpoint === '/auth/register') {
        return this.handleRegister(data);
      } else if (endpoint === '/auth/logout') {
        return this.handleLogout(data);
      } else {
        // Default response for other endpoints
        return {
          data: {
            success: true,
            message: 'Request processed'
          }
        };
      }
    } catch (error) {
      await trackPotentialAttack('api_error', {
        endpoint,
        error: error,
        timestamp: new Date()
      });
      throw error;
    }
  },

  async get(endpoint: string) {
    // Track GET requests
    const requestData = {
      method: 'GET',
      url: endpoint,
      timestamp: new Date()
    };

    const apiLogs = JSON.parse(localStorage.getItem('apiLogs') || '[]');
    apiLogs.push(requestData);
    localStorage.setItem('apiLogs', JSON.stringify(apiLogs));

    // Simulate responses
    if (endpoint.includes('/admin/stats')) {
      return {
        data: {
          totalUsers: 25,
          totalBookings: 150,
          activeSessions: 10,
          suspiciousActivities: 3
        }
      };
    } else if (endpoint.includes('/admin/logs')) {
      const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      return { data: logs.slice(-50) };
    }

    return { data: [] };
  },

  async handleLogin(credentials: any) {
    // Simulate authentication with Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        return {
          data: {
            success: false,
            message: error.message
          }
        };
      }

      return {
        data: {
          success: true,
          token: data.session?.access_token,
          user: {
            id: data.user?.id,
            name: data.user?.user_metadata?.name || 'User',
            email: data.user?.email,
            role: data.user?.user_metadata?.role || 'patient'
          }
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          message: 'Authentication failed'
        }
      };
    }
  },

  async handleRegister(userData: any) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            age: userData.age,
            gender: userData.gender,
            role: 'patient'
          }
        }
      });

      if (error) {
        return {
          data: {
            success: false,
            message: error.message
          }
        };
      }

      return {
        data: {
          success: true,
          message: 'Registration successful'
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          message: 'Registration failed'
        }
      };
    }
  },

  async handleLogout(data: any) {
    try {
      await supabase.auth.signOut();
      return {
        data: {
          success: true,
          message: 'Logged out successfully'
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          message: 'Logout failed'
        }
      };
    }
  }
};
