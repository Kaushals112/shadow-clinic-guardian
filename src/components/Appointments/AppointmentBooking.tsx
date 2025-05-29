
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, User, Stethoscope, Upload, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity, trackPotentialAttack } from '@/utils/sessionTracker';
import { useNavigate } from 'react-router-dom';

const AppointmentBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [patientName, setPatientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState('');
  const [consultationType, setConsultationType] = useState('');
  const [previousReports, setPreviousReports] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const departments = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine'
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

  const urgencyLevels = ['Low', 'Medium', 'High', 'Emergency'];
  const consultationTypes = ['First Visit', 'Follow-up', 'Second Opinion', 'Emergency Consultation'];

  useEffect(() => {
    trackUserActivity({
      action: 'appointment_booking_access',
      userId: user?.id,
      timestamp: new Date(),
      page: '/appointments'
    });
  }, [user?.id]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Track file upload attempt for honeypot analysis
      trackUserActivity({
        action: 'file_upload_attempt',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified
        }
      });

      // Check for potentially malicious files
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'];
      const fileName = file.name.toLowerCase();
      
      if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
        trackPotentialAttack('malicious_file_upload', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          userId: user?.id
        });
      }

      setPreviousReports(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate JWT token for session tracking
      const sessionToken = btoa(JSON.stringify({
        userId: user?.id,
        timestamp: Date.now(),
        bookingData: {
          department: selectedDepartment,
          doctor: selectedDoctor,
          urgency: urgency
        }
      }));

      await trackUserActivity({
        action: 'appointment_booking_attempt',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          department: selectedDepartment,
          doctor: selectedDoctor,
          date: selectedDate?.toISOString(),
          time: selectedTime,
          urgency: urgency,
          hasReports: !!previousReports,
          sessionToken: sessionToken
        }
      });

      // Simulate API call with file upload
      const formData = new FormData();
      formData.append('userId', user?.id || '');
      formData.append('sessionId', user?.sessionId || '');
      formData.append('department', selectedDepartment);
      formData.append('doctor', selectedDoctor);
      formData.append('preferredDate', selectedDate?.toISOString() || '');
      formData.append('timeSlot', selectedTime);
      formData.append('symptoms', symptoms);
      formData.append('urgency', urgency);
      formData.append('consultationType', consultationType);
      formData.append('sessionToken', sessionToken);
      
      if (previousReports) {
        formData.append('previousReports', previousReports);
      }

      // Simulate API endpoint call
      await new Promise(resolve => setTimeout(resolve, 2000));

      await trackUserActivity({
        action: 'appointment_booking_success',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          department: selectedDepartment,
          doctor: selectedDoctor,
          date: selectedDate?.toISOString(),
          time: selectedTime,
          urgency: urgency,
          sessionToken: sessionToken
        }
      });

      alert('Appointment booked successfully! Your booking ID: AIIMS' + Date.now());
      
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedDoctor('');
      setSelectedDepartment('');
      setPatientName('');
      setContactNumber('');
      setSymptoms('');
      setUrgency('');
      setConsultationType('');
      setPreviousReports(null);
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
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

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

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms/Chief Complaint</Label>
                <Textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms or reason for consultation"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urgency Level</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Consultation Type</Label>
                  <Select value={consultationType} onValueChange={setConsultationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reports">Previous Medical Reports (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="reports"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label htmlFor="reports" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {previousReports ? (
                        <span className="flex items-center justify-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {previousReports.name}
                        </span>
                      ) : (
                        'Click to upload previous reports (PDF, DOC, Images)'
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
                  </label>
                </div>
              </div>

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
