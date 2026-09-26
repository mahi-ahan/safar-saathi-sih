import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Truck, Package, Phone, CheckCircle, ArrowRight, UserCheck, AlertCircle, Lock } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from './AuthModal';

const API_BASE = "http://127.0.0.1:8000";

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Helper to determine intent ('driver' for offer trip/vehicle owner, 'sender' for find vehicle)
  const resolveIntent = () => {
    const raw = (
      searchParams.get('intent') ||
      searchParams.get('role') ||
      location.state?.intent ||
      localStorage.getItem('login_intent') ||
      'find'
    ).toLowerCase();

    return (raw === 'offer' || raw === 'driver') ? 'driver' : 'sender';
  };

  const [userType, setUserType] = useState(resolveIntent);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Other');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const initialRole = resolveIntent();
    setUserType(initialRole);
    localStorage.setItem('login_intent', initialRole === 'driver' ? 'offer' : 'find');

    const checkUserStatus = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setIsLoggedIn(false);
        setLoadingInitial(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/status`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.authenticated !== false) {
          setIsLoggedIn(true);
          if (data.phone_number) setPhoneNumber(data.phone_number);
          if (data.user_type) {
            setUserType(data.user_type);
            localStorage.setItem('login_intent', data.user_type === 'driver' ? 'offer' : 'find');
          }
          if (data.full_name) setFullName(data.full_name);
          if (data.gender) setGender(data.gender);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem("access_token");
        }
      } catch (err) {
        console.error("Failed to load status in ProfileSetupPage", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    checkUserStatus();
  }, [location.state, searchParams]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setSubmitting(true);
    setUploadStatus('Signing in with Google...');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_token: credentialResponse.credential
        })
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        setIsLoggedIn(true);
        if (data.full_name) setFullName(data.full_name);
        if (data.user_type) {
          setUserType(data.user_type);
        }

        if (data.is_profile_complete) {
          const destination = (data.user_type || userType) === 'driver' ? '/offer' : '/find';
          navigate(destination);
        }
      } else {
        setErrorMessage(data.detail || "Google sign in failed.");
      }
    } catch (err) {
      console.error("Google sign in error", err);
      setErrorMessage("Could not connect to authentication backend.");
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    setUploadStatus('Saving profile details...');
    const token = localStorage.getItem("access_token");

    if (!token) {
      setErrorMessage("Please sign in with Google first before saving profile.");
      setSubmitting(false);
      return;
    }

    if (userType === 'driver' && (!aadhaarFile || !licenseFile)) {
      setErrorMessage("Please upload both Aadhaar and Driving License for vehicle verification.");
      setSubmitting(false);
      return;
    }

    try {
      // 1. Save profile
      const res = await fetch(`${API_BASE}/auth/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          phone_number: phoneNumber, 
          user_type: userType,
          full_name: fullName || undefined,
          gender: gender || "Other"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.detail || "Failed to save profile.");
        setSubmitting(false);
        return;
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      // 2. If driver uploaded documents, upload them to verify
      if (userType === 'driver') {
        if (aadhaarFile) {
          setUploadStatus('Uploading Aadhaar Card...');
          const fd1 = new FormData();
          fd1.append('file', aadhaarFile);
          fd1.append('doc_type', 'aadhaar');
          await fetch(`${API_BASE}/auth/upload-document`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: fd1
          });
        }

        if (licenseFile) {
          setUploadStatus('Uploading Driving License...');
          const fd2 = new FormData();
          fd2.append('file', licenseFile);
          fd2.append('doc_type', 'license');
          await fetch(`${API_BASE}/auth/upload-document`, {
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
      setErrorMessage("Could not connect to backend server.");
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  const isDriver = userType === 'driver';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-[#fbf8f1] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-[#e6dec9]">
          
          {/* HEADER ICON & ROLE TITLE */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner ${
              isDriver 
                ? 'bg-emerald-900 text-white' 
                : 'bg-amber-800 text-white'
            }`}>
              {isDriver ? '🚚' : '📦'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1b3323] font-display">
                {isDriver ? 'Transporter Profile Setup' : 'Cargo Shipper Profile Setup'}
              </h2>
              <p className="text-gray-600 text-xs">
                {isDriver 
                  ? 'Verify your vehicle documents to offer trips & earn.' 
                  : 'Fast profile completion to search & book cargo space.'}
              </p>
            </div>
          </div>

          {/* DEDICATED LOCKED ROLE BADGE */}
          <div className={`mb-5 p-3 rounded-xl border flex items-center justify-between gap-2 ${
            isDriver 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              {isDriver ? (
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <Package className="w-4 h-4 text-amber-700 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  {isDriver ? 'Role: Vehicle Owner / Driver' : 'Role: Cargo Shipper / Sender'}
                </span>
                <span className="text-[10.5px] text-gray-500">
                  {isDriver ? 'Dedicated to offering trips & freight transport' : 'Dedicated to finding transport & booking shared cargo'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              isDriver ? 'bg-emerald-700 text-white' : 'bg-amber-700 text-white'
            }`}>
              {isDriver ? 'Offer Trip' : 'Find Space'}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium animate-[fadeIn_0.2s_ease]">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isLoggedIn ? (
            <div className="my-6 p-6 rounded-2xl bg-[#f7f5ed] border border-[#e6dec9] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#1b3323]/10 text-[#1b3323] flex items-center justify-center mx-auto text-xl font-bold">
                🔐
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b3323]">Sign In Required</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Please authenticate with your Google account to set up your Safar-Saathi {isDriver ? 'Driver' : 'Shipper'} profile.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrorMessage("Google Login Failed. Please try again.")}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Google Account Authenticated. Please confirm details below.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Your full name" 
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1b3323] outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">10-Digit Mobile Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">+91</span>
                  <input 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    placeholder="9876543210" 
                    className="w-full pl-12 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1b3323] outline-none text-sm font-medium"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#1b3323] outline-none text-sm bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* ONLY SHOWN FOR DRIVERS */}
              {isDriver && (
                <div className="my-3 p-4 rounded-xl bg-[#f7f5ed] border border-[#e6dec9] space-y-3 animate-[fadeIn_0.3s_ease]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1b3323]">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Driver Verification Documents</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Upload your Aadhaar & Driving License to receive instant verified badges and shipper requests.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Aadhaar Card (PDF / Image) *</label>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setAadhaarFile(e.target.files[0])}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1b3323] file:text-white hover:file:bg-[#2c4f37] cursor-pointer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Driving License (PDF / Image) *</label>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setLicenseFile(e.target.files[0])}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1b3323] file:text-white hover:file:bg-[#2c4f37] cursor-pointer"
                      required
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting}
                className={`w-full text-white py-3 rounded-xl font-semibold transition shadow-md text-sm mt-4 flex items-center justify-center gap-2 cursor-pointer ${
                  isDriver 
                    ? 'bg-emerald-800 hover:bg-emerald-900' 
                    : 'bg-[#1b3323] hover:bg-[#2c4f37]'
                }`}
              >
                {submitting ? (
                  <span>{uploadStatus || "Saving..."}</span>
                ) : (
                  <>
                    <span>
                      {isDriver ? "Verify Documents & Proceed to Driver Hub" : "Complete Profile & Find Vehicles"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

