import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('sender');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch("http://localhost:8000/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ phone_number: phoneNumber, user_type: userType })
      });

      if (res.ok) {
        navigate('/find-vehicle'); // Proceed to vehicle search map dashboard
      }
    } catch (err) {
      console.error("Profile update failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f1] flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-[#e6dec9]">
        <h2 className="text-2xl font-bold text-[#1b3323] mb-2">Complete Your Profile</h2>
        <p className="text-gray-600 mb-6 text-sm">Please provide your details to continue to Safar-Saathi.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input 
            type="text" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            placeholder="Enter 10-digit mobile number" 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b3323] outline-none"
            required 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">I want to:</label>
          <select 
            value={userType} 
            onChange={(e) => setUserType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1b3323] outline-none"
          >
            <option value="sender">Send Goods (Find Vehicle)</option>
            <option value="driver">Offer Trip / Space (Driver)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full bg-[#1b3323] text-white py-3 rounded-lg font-medium hover:bg-[#2c4f37] transition"
        >
          {submitting ? "Saving..." : "Save and Continue"}
        </button>
      </form>
    </div>
  );
}