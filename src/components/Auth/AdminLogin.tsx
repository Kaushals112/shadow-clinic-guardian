
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { trackUserActivity, trackSuspiciousActivity } from '@/utils/sessionTracker';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Track admin login attempt (high value target for attackers)
    await trackUserActivity({
      action: 'admin_login_attempt',
      email,
      page: '/admin/login',
      timestamp: new Date(),
      data: {
        attempt: attempts + 1,
        userAgent: navigator.userAgent,
        isDirectAdminAccess: true
      }
    });

    // Intentional vulnerability: Log admin credentials for honeypot analysis
    console.log('Admin login attempt:', { email, passwordLength: password.length });

    try {
      const success = await login({ email, password });
      
      if (success) {
        navigate('/admin');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Track failed admin login (critical security event)
        await trackSuspiciousActivity('admin_login_failed', {
          email,
          attempts: newAttempts,
          page: '/admin/login'
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 border-red-200">
        <CardHeader className="text-center bg-red-50">
          <div className="mx-auto mb-4">
            <Shield className="h-16 w-16 text-red-600 mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            AIIMS Admin Portal
          </CardTitle>
          <CardDescription className="text-red-600">
            Restricted Access - Authorized Personnel Only
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Alert className="mb-6 border-red-200 bg-red-50">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              This is a secure administrative interface. All access attempts are monitored and logged.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Administrator Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aiims.edu"
                className="border-red-200 focus:border-red-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="border-red-200 focus:border-red-400"
                  required
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
            </div>

            {attempts > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertDescription className="text-orange-700">
                  Failed attempt {attempts}/3. Account will be locked and security will be notified.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Admin Sign In'}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <Button 
              variant="outline" 
              className="w-full border-gray-300"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Site
            </Button>
          </div>

          <Alert className="mt-4 border-gray-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs text-gray-600">
              Security Notice: This system employs advanced intrusion detection. 
              Unauthorized access attempts will be prosecuted to the full extent of the law.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
