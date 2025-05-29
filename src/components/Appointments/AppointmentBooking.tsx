
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Upload, FileText, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trackUserActivity } from '@/utils/sessionTracker';
import { apiClient } from '@/utils/apiClient';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Layout/Header';

const AppointmentBooking = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    department: '',
    doctor: '',
    preferredDate: '',
    timeSlot: '',
    symptoms: '',
    previousReports: null as File | null,
    urgency: 'normal',
    consultationType: 'new'
  });

  const departments = [
    'Cardiology',
    'Neurology', 
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Psychiatry',
    'General Medicine',
    'ENT',
    'Ophthalmology',
    'Gynecology'
  ];

  useEffect(() => {
    trackUserActivity({
      action: 'appointment_booking_page_visit',
      userId: user?.id,
      page: '/appointments',
      timestamp: new Date()
    });

    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await apiClient.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadTimeSlots = async (doctorId: string, date: string) => {
    try {
      const response = await apiClient.get(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
      setTimeSlots(response.data);
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Track file upload activity
      trackUserActivity({
        action: 'report_file_upload',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });

      setUploadedFile(file);
      setFormData(prev => ({ ...prev, previousReports: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Track appointment booking attempt
      await trackUserActivity({
        action: 'appointment_booking_attempt',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          department: formData.department,
          doctor: formData.doctor,
          date: formData.preferredDate,
          urgency: formData.urgency
        }
      });

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value as string | Blob);
        }
      });
      
      formDataToSend.append('userId', user?.id || '');
      formDataToSend.append('sessionId', user?.sessionId || '');

      const response = await apiClient.post('/appointments/book', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: "Appointment Booked Successfully",
          description: `Your appointment has been scheduled. Booking ID: ${response.data.bookingId}`,
        });

        // Track successful booking
        await trackUserActivity({
          action: 'appointment_booking_success',
          userId: user?.id,
          timestamp: new Date(),
          data: {
            bookingId: response.data.bookingId,
            department: formData.department
          }
        });

        // Reset form
        setFormData({
          department: '',
          doctor: '',
          preferredDate: '',
          timeSlot: '',
          symptoms: '',
          previousReports: null,
          urgency: 'normal',
          consultationType: 'new'
        });
        setUploadedFile(null);
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.response?.data?.message || "Unable to book appointment. Please try again.",
        variant: "destructive"
      });

      // Track booking failure
      await trackUserActivity({
        action: 'appointment_booking_failed',
        userId: user?.id,
        timestamp: new Date(),
        data: {
          error: error.message,
          department: formData.department
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    setFormData(prev => ({ ...prev, doctor: doctorId, timeSlot: '' }));
    if (formData.preferredDate) {
      loadTimeSlots(doctorId, formData.preferredDate);
    }
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, preferredDate: date, timeSlot: '' }));
    if (formData.doctor) {
      loadTimeSlots(formData.doctor, date);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-900 flex items-center justify-center gap-2">
                <Calendar className="h-6 w-6" />
                Book Medical Appointment
              </CardTitle>
              <CardDescription>
                Schedule your consultation with our expert medical professionals
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {user?.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {user?.email}
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doctor">Preferred Doctor</Label>
                      <Select onValueChange={handleDoctorChange} disabled={!formData.department}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor: any) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              Dr. {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Preferred Date *</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.preferredDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeSlot">Time Slot</Label>
                      <Select 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
                        disabled={!formData.preferredDate}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot: any) => (
                            <SelectItem key={slot.time} value={slot.time}>
                              {slot.time} {slot.available ? '' : '(Not Available)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgency Level</Label>
                      <Select onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultationType">Consultation Type</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, consultationType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="New Consultation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Consultation</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="second_opinion">Second Opinion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Symptoms & Chief Complaints *</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Please describe your symptoms, duration, and any relevant medical history..."
                      value={formData.symptoms}
                      onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previousReports">Previous Medical Reports (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Upload previous reports, prescriptions, or lab results
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="fileUpload"
                        />
                        <Label htmlFor="fileUpload" className="cursor-pointer">
                          <Button type="button" variant="outline" className="mt-2">
                            <FileText className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        </Label>
                        {uploadedFile && (
                          <div className="mt-2 text-sm text-green-600">
                            ✓ {uploadedFile.name} uploaded
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Supported formats: PDF, JPG, PNG, DOC, DOCX (Max size: 10MB)
                    </p>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> By booking this appointment, you agree to AIIMS terms of service.
                    Your medical information is protected under HIPAA compliance. Appointment confirmations will be sent via SMS and email.
                    Please arrive 15 minutes early with valid ID and insurance documents.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={loading || !formData.department || !formData.preferredDate || !formData.symptoms}
                  >
                    {loading ? 'Booking Appointment...' : 'Book Appointment'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
