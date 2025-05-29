
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity, trackSuspiciousActivity } from '@/utils/sessionTracker';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string}>({});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Track page visit
    trackUserActivity({
      action: 'login_page_visit',
      page: '/login',
      timestamp: new Date(),
      referrer: document.referrer
    });

    // Check for suspicious rapid attempts
    const storedAttempts = localStorage.getItem('loginAttempts');
    if (storedAttempts) {
      const attemptData = JSON.parse(storedAttempts);
      const timeDiff = Date.now() - attemptData.timestamp;
      
      if (timeDiff < 300000 && attemptData.count > 5) { // 5 minutes
        setLocked(true);
        trackSuspiciousActivity('rapid_login_attempts', {
          attempts: attemptData.count,
          timespan: timeDiff
        });
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors: {email?: string, password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (locked) {
      trackSuspiciousActivity('login_attempt_while_locked', { email });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Track login attempt with detailed info
      await trackUserActivity({
        action: 'login_form_submit',
        email,
        timestamp: new Date(),
        page: '/login',
        data: {
          attempt: attempts + 1,
          formData: { email, passwordLength: password.length }
        }
      });

      const success = await login({ email, password });
      
      if (success) {
        // Reset attempts on success
        localStorage.removeItem('loginAttempts');
        
        // Redirect to intended page or dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from);
      } else {
        // Track failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Store attempts for rate limiting
        localStorage.setItem('loginAttempts', JSON.stringify({
          count: newAttempts,
          timestamp: Date.now()
        }));

        // Lock after 5 attempts
        if (newAttempts >= 5) {
          setLocked(true);
          await trackSuspiciousActivity('account_lockout', {
            email,
            attempts: newAttempts
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await trackUserActivity({
        action: 'google_login_attempt',
        timestamp: new Date(),
        page: '/login'
      });

      // Simulate Google OAuth (in real implementation, integrate with Google OAuth)
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  if (locked) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-600">Account Temporarily Locked</CardTitle>
          <CardDescription>
            Your account has been temporarily locked due to multiple failed login attempts.
            Please try again after 5 minutes or contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              For security purposes, this account has been temporarily suspended.
              If you are the legitimate user, please contact AIIMS IT Support at +91-11-2659-3756.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <img src="/api/placeholder/80/80" alt="AIIMS Logo" className="h-20 w-20 mx-auto" />
        </div>
        <CardTitle className="text-2xl font-bold text-blue-900">
          AIIMS Patient Portal
        </CardTitle>
        <CardDescription>
          Sign in to access your medical records and book appointments
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className={errors.email ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={errors.password ? 'border-red-500' : ''}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {attempts > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Login attempt {attempts}/5. Account will be temporarily locked after 5 failed attempts.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/register')}>
              Register here
            </Button>
          </p>
          <p className="text-sm">
            <Button variant="link" className="p-0" onClick={() => navigate('/forgot-password')}>
              Forgot your password?
            </Button>
          </p>
        </div>

        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your session is secured with 256-bit encryption. All medical data is protected under HIPAA compliance.
            Suspicious activities are monitored for your security.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
