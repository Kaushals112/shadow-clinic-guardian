import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="h-12 w-12 bg-white rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="text-blue-900 font-bold text-sm">AIIMS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">All India Institute of Medical Sciences</h1>
              <p className="text-blue-200 text-sm">Excellence in Healthcare</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/')}>
              Home
            </Button>
            <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/about')}>
              About
            </Button>
            <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/departments')}>
              Departments
            </Button>
            <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/doctors')}>
              Doctors
            </Button>
            <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/contact')}>
              Contact
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/appointments')}>
                  Book Appointment
                </Button>
                {user.role === 'admin' && (
                  <Button variant="ghost" className="text-white hover:text-blue-200" onClick={() => navigate('/admin')}>
                    Admin Dashboard
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Welcome, {user.name}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-900 border-white hover:bg-white"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="text-blue-900 border-white hover:bg-white" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="default" className="bg-white text-blue-900 hover:bg-blue-50" onClick={() => navigate('/register')}>
                  Register
                </Button>
                <Button variant="ghost" className="text-red-300 hover:text-red-100 text-xs" onClick={() => navigate('/admin/login')}>
                  Admin
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
