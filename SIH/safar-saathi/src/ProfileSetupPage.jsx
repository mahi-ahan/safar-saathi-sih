import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('sender');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadStatus('Saving profile details...');
    const token = localStorage.getItem("access_token");

    try {
      // 1. Save profile
      const res = await fetch("http://localhost:8000/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ phone_number: phoneNumber, user_type: userType })
      });

      if (!res.ok) {
        alert("Failed to save profile.");
        setSubmitting(false);
        return;
      }

      // 2. If driver uploaded documents, upload them to verify
      if (userType === 'driver') {
        if (aadhaarFile) {
          setUploadStatus('Verifying Aadhaar Card...');
          const fd1 = new FormData();
          fd1.append('file', aadhaarFile);
          fd1.append('doc_type', 'aadhaar');
          await fetch("http://localhost:8000/auth/upload-document", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: fd1
          });
        }

        if (licenseFile) {
          setUploadStatus('Verifying Driving License...');
          const fd2 = new FormData();
          fd2.append('file', licenseFile);
          fd2.append('doc_type', 'license');
          await fetch("http://localhost:8000/auth/upload-document", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: fd2
          });
        }
      }

      if (userType === 'driver') {
        navigate('/offer');
      } else {
        navigate('/find');
      }
    } catch (err) {
      console.error("Profile update failed", err);
      alert("Could not connect to backend server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f1] flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-[#e6dec9]">
        <h2 className="text-2xl font-bold text-[#1b3323] mb-2 font-display">Complete Your Profile</h2>
        <p className="text-gray-600 mb-6 text-sm">Please provide your details to continue to Safar-Saathi.</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input 
            type="text" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            placeholder="Enter 10-digit mobile number" 
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1b3323] outline-none text-sm"
            required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">I want to:</label>
          <select 
            value={userType} 
            onChange={(e) => setUserType(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1b3323] outline-none text-sm bg-white"
          >
            <option value="sender">Send Goods (Find Vehicle)</option>
            <option value="driver">Offer Trip / Space (Driver)</option>
          </select>
        </div>

        {userType === 'driver' && (
          <div className="my-5 p-4 rounded-xl bg-[#f7f5ed] border border-[#e6dec9] space-y-3 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b3323]">
              <span>🛡️</span>
              <span>Driver Government Verification (Recommended)</span>
            </div>
            <p className="text-xs text-gray-600">
              Upload your Aadhaar and Driving License to get verified and gain instant trust from senders.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Aadhaar Card (PDF / Image)</label>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setAadhaarFile(e.target.files[0])}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1b3323] file:text-white hover:file:bg-[#2c4f37] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Driving License (PDF / Image)</label>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setLicenseFile(e.target.files[0])}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1b3323] file:text-white hover:file:bg-[#2c4f37] cursor-pointer"
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full bg-[#1b3323] text-white py-3 rounded-xl font-semibold hover:bg-[#2c4f37] transition shadow-md text-sm mt-2"
        >
          {submitting ? (uploadStatus || "Saving...") : "Save & Continue to Dashboard"}
        </button>
      </form>
    </div>
  );
}