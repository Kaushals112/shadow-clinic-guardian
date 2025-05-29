
import React from 'react';
import Header from '@/components/Layout/Header';

const Doctors = () => {
  const doctors = [
    { name: 'Dr. Rajesh Kumar', specialization: 'Cardiology', experience: '15 years' },
    { name: 'Dr. Priya Sharma', specialization: 'Neurology', experience: '12 years' },
    { name: 'Dr. Amit Singh', specialization: 'Orthopedics', experience: '18 years' },
    { name: 'Dr. Sunita Gupta', specialization: 'Pediatrics', experience: '10 years' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-900 mb-6">Our Doctors</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.name} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">{doctor.name}</h3>
                <p className="text-gray-600 mb-1">Specialization: {doctor.specialization}</p>
                <p className="text-gray-600">Experience: {doctor.experience}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
