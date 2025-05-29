
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Users, 
  Award, 
  Phone, 
  Calendar,
  MapPin,
  Clock,
  Stethoscope,
  Shield,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackUserActivity } from '@/utils/sessionTracker';
import Header from '@/components/Layout/Header';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    trackUserActivity({
      action: 'homepage_visit',
      page: '/',
      timestamp: new Date()
    });
  }, []);

  const departments = [
    { name: 'Cardiology', patients: '2,500+', icon: Heart, color: 'bg-red-100 text-red-600' },
    { name: 'Neurology', patients: '1,800+', icon: Activity, color: 'bg-blue-100 text-blue-600' },
    { name: 'Orthopedics', patients: '3,200+', icon: Shield, color: 'bg-green-100 text-green-600' },
    { name: 'Pediatrics', patients: '2,100+', icon: Users, color: 'bg-yellow-100 text-yellow-600' },
  ];

  const newsItems = [
    {
      title: "AIIMS Delhi introduces new AI-powered diagnostic center",
      date: "Dec 15, 2024",
      category: "Technology"
    },
    {
      title: "Free health checkup camp for senior citizens",
      date: "Dec 12, 2024", 
      category: "Community"
    },
    {
      title: "Research breakthrough in cancer treatment at AIIMS",
      date: "Dec 10, 2024",
      category: "Research"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Excellence in Healthcare
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                AIIMS Delhi - Providing world-class medical care with cutting-edge technology
                and compassionate service for over 65 years.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-900 hover:bg-gray-100"
                  onClick={() => navigate('/appointments')}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-900"
                  onClick={() => navigate('/emergency')}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Emergency: 102
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/api/placeholder/600/400" 
                alt="AIIMS Hospital Building" 
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Stethoscope className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">24/7 Emergency</p>
                    <p className="text-sm text-gray-600">Always available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
            Quick Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/appointments')}>
              <CardHeader>
                <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Book Appointment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Schedule your consultation with our expert doctors</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/reports')}>
              <CardHeader>
                <Activity className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>View Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Access your medical reports and test results</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/doctors')}>
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Find Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Search and connect with our specialist doctors</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/emergency')}>
              <CardHeader>
                <Phone className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">24/7 emergency services and ambulance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
            Our Departments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${dept.color} flex items-center justify-center mb-4`}>
                    <dept.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-2">Patients served annually</p>
                  <Badge variant="outline" className="font-semibold">
                    {dept.patients}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">65+</div>
              <p className="text-blue-200">Years of Excellence</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,500+</div>
              <p className="text-blue-200">Expert Doctors</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <p className="text-blue-200">Monthly Patients</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <p className="text-blue-200">Patient Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* News & Updates */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-900">
            Latest News & Updates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((news, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    {news.category}
                  </Badge>
                  <CardTitle className="text-lg leading-tight">{news.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {news.date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Emergency Services</h3>
              <div className="space-y-2">
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Ambulance: 102
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency: +91-11-2659-3756
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">Location</h3>
              <p className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1" />
                Ansari Nagar East, New Delhi, Delhi 110029
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4">OPD Hours</h3>
              <div className="space-y-1">
                <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p>Saturday: 8:00 AM - 2:00 PM</p>
                <p>Sunday: Emergency Only</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
