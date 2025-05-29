
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar, 
  Shield, 
  AlertTriangle, 
  Activity,
  Search,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity, trackPotentialAttack } from '@/utils/sessionTracker';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    activeSessions: 0,
    suspiciousActivities: 0
  });
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackUserActivity({
      action: 'admin_dashboard_access',
      userId: user?.id,
      timestamp: new Date(),
      page: '/admin'
    });

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage for now (in real app, would be from backend)
      const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      const suspiciousLogs = activityLogs.filter((log: any) => 
        log.action.includes('suspicious') || log.action.includes('attack')
      );

      setStats({
        totalUsers: 25,
        totalBookings: 150,
        activeSessions: activityLogs.length,
        suspiciousActivities: suspiciousLogs.length
      });
      
      setLogs(activityLogs.slice(-50));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // INTENTIONAL VULNERABILITY: XSS in search functionality
  const handleSearch = async () => {
    try {
      await trackUserActivity({
        action: 'admin_search',
        query: searchQuery,
        userId: user?.id,
        timestamp: new Date()
      });

      // VULNERABILITY: Rendering unsanitized HTML
      const searchResults = document.getElementById('searchResults');
      if (searchResults) {
        searchResults.innerHTML = `<p>Search results for: ${searchQuery}</p>`;
      }
      
      // Track potential XSS attempt
      if (searchQuery.includes('<script>') || searchQuery.includes('javascript:')) {
        await trackPotentialAttack('xss_attempt', {
          payload: searchQuery,
          location: 'admin_search',
          userId: user?.id
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // INTENTIONAL VULNERABILITY: SQL Injection in user management
  const handleUserLookup = async (userId: string) => {
    try {
      // Track potential SQL injection attempt
      if (userId.includes("'") || userId.includes(';') || userId.includes('--')) {
        await trackPotentialAttack('sql_injection_attempt', {
          payload: userId,
          location: 'user_lookup',
          userId: user?.id
        });
      }

      console.log('User lookup attempted with:', userId);
    } catch (error) {
      console.error('User lookup error:', error);
    }
  };

  const exportLogs = async () => {
    try {
      await trackUserActivity({
        action: 'logs_export',
        userId: user?.id,
        timestamp: new Date()
      });

      const logs = localStorage.getItem('activityLogs') || '[]';
      const blob = new Blob([logs], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aiims_security_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">AIIMS Admin Dashboard</h1>
          <p className="text-gray-600">Security Monitoring & System Management</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Security Alert */}
      <Alert className="mb-6 border-orange-500">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> This is a honeypot monitoring system. All activities are logged for security analysis.
          Unauthorized access attempts will be tracked and reported.
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Total bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Current users online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspiciousActivities}</div>
            <p className="text-xs text-muted-foreground">Potential threats</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Security Monitoring</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="bookings">Appointment Management</TabsTrigger>
          <TabsTrigger value="system">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Security Monitoring</CardTitle>
              <CardDescription>
                Monitor suspicious activities and potential security threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* VULNERABLE SEARCH - Intentional XSS vulnerability */}
              <div className="mb-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search logs (supports HTML queries)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Advanced search supports HTML tags for detailed filtering
                </p>
              </div>

              {/* Search Results - VULNERABLE to XSS */}
              <div id="searchResults" className="mb-6 p-4 border rounded bg-gray-50">
                <p className="text-gray-500">Search results will appear here...</p>
              </div>

              {/* Recent Security Events */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log: any, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-gray-500">
                          Session: {log.sessionId} | IP: {log.ipAddress || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage registered users and monitor account activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* VULNERABLE USER LOOKUP - SQL Injection vulnerability */}
              <div className="mb-4">
                <Input
                  placeholder="Enter User ID for direct database lookup..."
                  onChange={(e) => {
                    if (e.target.value) {
                      handleUserLookup(e.target.value);
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Direct database query - supports advanced SQL syntax for admin users
                </p>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                User management interface will be displayed here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Management</CardTitle>
              <CardDescription>
                View and manage patient appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Appointment management interface will be displayed here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Comprehensive system and security logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                System logs interface will be displayed here...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
