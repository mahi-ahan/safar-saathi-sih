import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(location.state?.error || '')

  useEffect(() => {
    setLoginError(location.state?.error || '')
    if (location.state?.intent) {
      localStorage.setItem('login_intent', location.state.intent)
    }
  }, [location.state])

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setLoginError('')
    try {
      const res = await fetch('http://localhost:8000/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_token: credentialResponse.credential })
      })

      const data = await res.json()

      if (res.ok) {
        const intent = location.state?.intent || localStorage.getItem('login_intent')

        if (!data.is_profile_complete) {
          localStorage.setItem('access_token', data.access_token)
          navigate('/complete-profile')
          return
        }

        // Strict intent-based checks
        if (intent === 'find' && data.user_type === 'driver') {
          localStorage.removeItem('access_token')
          setLoginError('This account belongs to Offer a Trip (Driver). Please use a Sender account for Find a Vehicle.')
          return
        }

        if (intent === 'offer' && data.user_type !== 'driver') {
          localStorage.removeItem('access_token')
          setLoginError('This account belongs to Find a Vehicle (Sender). Please use a Driver account for Offer a Trip.')
          return
        }

        localStorage.removeItem('login_intent')
        localStorage.setItem('access_token', data.access_token)

        if (data.user_type === 'driver') {
          navigate('/offer')
        } else {
          navigate('/find')
        }
      } else {
        setLoginError(data.detail || 'Google authentication failed on backend.')
      }
    } catch (err) {
      console.error('Backend error:', err)
      setLoginError('Could not connect to FastAPI backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <> {/* <--- Opening fragment */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>

  
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-paper p-8 rounded-2xl shadow-lg border border-gold/30 text-center">
          <h2 className="text-2xl font-display font-bold text-green-deep mb-2">Sign in to Safar-Saathi</h2>
          <p className="text-green-soft mb-4 text-sm">Choose any Google account to sign in.</p>

          {loginError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loginError}
            </div>
          )}

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setLoginError('Google Sign In Failed')}
              useOneTap={false}
              prompt="select_account"
            />
          </div>

          {loading && <p className="mt-4 text-sm text-green-soft">Logging in...</p>}
        </div>
      </div>
    </GoogleOAuthProvider>
    </> 
    );
}