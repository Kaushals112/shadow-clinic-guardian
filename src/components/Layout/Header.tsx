import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Shield, Calendar, Phone, Mail, MapPin, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity } from '@/utils/sessionTracker';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Track page visits for honeypot analysis
    trackUserActivity({
      action: 'page_visit',
      page: location.pathname,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    await trackUserActivity({
      action: 'logout',
      page: location.pathname,
      timestamp: new Date()
    });
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-lg">
      {/* Top Bar */}
      <div className="bg-blue-900 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Emergency: +91-11-2659-3756</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>info@aiims.edu</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Ansari Nagar, New Delhi - 110029</span>
            </div>
          </div>
          <div className="text-sm">
            {currentTime.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">AIIMS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">
                All India Institute of Medical Sciences
              </h1>
              <p className="text-sm text-gray-600">अखिल भारतीय आयुर्विज्ञान संस्थान</p>
              <p className="text-xs text-gray-500">New Delhi - An Institution of National Importance</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Welcome, {user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex space-x-2">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="flex items-center space-x-1"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 border-t pt-4">
          <ul className="flex space-x-8">
            <li>
              <Button variant="link" onClick={() => navigate('/')} className="text-blue-700 hover:text-blue-900 font-medium p-0">
                Home
              </Button>
            </li>
            <li>
              <Button variant="link" onClick={() => navigate('/about')} className="text-blue-700 hover:text-blue-900 font-medium p-0">
                About AIIMS
              </Button>
            </li>
            <li>
              <Button variant="link" onClick={() => navigate('/departments')} className="text-blue-700 hover:text-blue-900 font-medium p-0">
                Departments
              </Button>
            </li>
            <li>
              <Button variant="link" onClick={() => navigate('/doctors')} className="text-blue-700 hover:text-blue-900 font-medium p-0">
                Our Doctors
              </Button>
            </li>
            <li>
              <Button variant="link" onClick={() => navigate('/appointments')} className="text-blue-700 hover:text-blue-900 font-medium p-0">
                Book Appointment
              </Button>
            </li>
            <li>
              <Button variant="link" onClick={() => navigate('/contact')} className="text-blue-700 hover:text-blue-900 font-medium p-0">
                Contact Us
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
