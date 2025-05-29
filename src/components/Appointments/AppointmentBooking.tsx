
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, User, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity } from '@/utils/sessionTracker';

const AppointmentBooking = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [patientName, setPatientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Cardiology',
    'Neurology', 
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'General Medicine'
  ];

  const doctors = {
    'Cardiology': ['Dr. Sharma', 'Dr. Patel', 'Dr. Kumar'],
    'Neurology': ['Dr. Singh', 'Dr. Gupta', 'Dr. Reddy'],
    'Orthopedics': ['Dr. Verma', 'Dr. Agarwal', 'Dr. Jain'],
    'Pediatrics': ['Dr. Rao', 'Dr. Mehta', 'Dr. Shah'],
    'Dermatology': ['Dr. Chopra', 'Dr. Malhotra', 'Dr. Bansal'],
    'General Medicine': ['Dr. Saxena', 'Dr. Mishra', 'Dr. Trivedi']
  };

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  useEffect(() => {
    trackUserActivity({
      action: 'appointment_booking_access',
      userId: user?.id,
      timestamp: new Date(),
      page: '/appointments'
    });
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await trackUserActivity({
        action: 'appointment_booking_attempt',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          department: selectedDepartment,
          doctor: selectedDoctor,
          date: selectedDate?.toISOString(),
          time: selectedTime
        }
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      await trackUserActivity({
        action: 'appointment_booking_success',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          department: selectedDepartment,
          doctor: selectedDoctor,
          date: selectedDate?.toISOString(),
          time: selectedTime
        }
      });

      alert('Appointment booked successfully!');
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedDoctor('');
      setSelectedDepartment('');
      setPatientName('');
      setContactNumber('');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-blue-900">
              <Stethoscope className="h-6 w-6 mr-2" />
              Book Appointment
            </CardTitle>
            <CardDescription>
              Schedule your consultation with our expert doctors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Patient Name</Label>
                  <Input
                    id="name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="Enter contact number"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDepartment && (
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors[selectedDepartment as keyof typeof doctors]?.map((doctor) => (
                        <SelectItem key={doctor} value={doctor}>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {doctor}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Appointment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Time Slot</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || !selectedDate || !selectedTime || !selectedDoctor || !patientName || !contactNumber}
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentBooking;
