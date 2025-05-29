
import React from 'react';
import Header from '@/components/Layout/Header';

const Departments = () => {
  const departments = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 
    'Pediatrics', 'Emergency Medicine', 'Radiology', 'Psychiatry'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-900 mb-6">Departments</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <div key={dept} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">{dept}</h3>
                <p className="text-gray-600">
                  Comprehensive medical care and treatment in {dept.toLowerCase()}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
