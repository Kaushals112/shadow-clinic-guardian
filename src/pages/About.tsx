
import React from 'react';
import Header from '@/components/Layout/Header';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-900 mb-6">About AIIMS</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">All India Institute of Medical Sciences</h2>
            <p className="text-gray-700 mb-4">
              AIIMS New Delhi is a public medical university based in New Delhi, India. 
              It was established in 1956 and is governed by the AIIMS Act, 1956.
            </p>
            <p className="text-gray-700 mb-4">
              AIIMS has been declared as an Institute of National Importance by an Act of Parliament 
              and is one of India's premier medical institutions.
            </p>
            <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
            <p className="text-gray-700 mb-4">
              To provide excellent patient care, advance medical knowledge through research, 
              and train future healthcare professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
