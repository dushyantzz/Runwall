import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../hooks/supabaseClient';
import { Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Direct navigation to bypass "verify email" page screen
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during Google Sign-In.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)',
      background: '#000000',
      padding: '24px',
      position: 'relative',
    }}>
      {/* Background glow elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255, 218, 98, 0.04) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--card-bg, #141414)',
        border: '1px solid var(--border, #262626)',
        borderRadius: '12px',
        padding: '32px',
        zIndex: 1,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      }}>
        <>
          {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--heading, #ffffff)',
                marginBottom: '8px',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
              }}>
                Create Account
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'var(--muted, #777777)',
                fontFamily: 'var(--font-body)',
              }}>
                Get started with your Runwall gateway
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: '#ef4444',
                fontSize: '13px',
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="email" style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--body, #b4b4b4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted, #777777)',
                  }} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@company.com"
                    style={{
                      width: '100%',
                      background: '#0a0a0a',
                      border: '1px solid var(--border, #262626)',
                      borderRadius: '6px',
                      padding: '10px 12px 10px 38px',
                      color: 'var(--heading, #ffffff)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent, #FFDA62)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border, #262626)')}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="password" style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--body, #b4b4b4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted, #777777)',
                  }} />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      background: '#0a0a0a',
                      border: '1px solid var(--border, #262626)',
                      borderRadius: '6px',
                      padding: '10px 12px 10px 38px',
                      color: 'var(--heading, #ffffff)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent, #FFDA62)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border, #262626)')}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="confirmPassword" style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--body, #b4b4b4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--muted, #777777)',
                  }} />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      background: '#0a0a0a',
                      border: '1px solid var(--border, #262626)',
                      borderRadius: '6px',
                      padding: '10px 12px 10px 38px',
                      color: 'var(--heading, #ffffff)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent, #FFDA62)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border, #262626)')}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'var(--accent, #FFDA62)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: loading ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => { if(!loading) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { if(!loading) e.currentTarget.style.opacity = '1'; }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
              color: 'var(--muted, #777777)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-body)',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#262626' }} />
              <span>or</span>
              <div style={{ flex: 1, height: '1px', background: '#262626' }} />
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                background: '#0a0a0a',
                color: '#ffffff',
                border: '1px solid #262626',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background-color 0.2s, border-color 0.2s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#111111';
                e.currentTarget.style.borderColor = '#444444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0a0a0a';
                e.currentTarget.style.borderColor = '#262626';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.63 0 3.09.56 4.24 1.66L19.39 3.5C17.38 1.63 14.88.5 12 .5 7.42.5 3.52 3.12 1.65 6.94l3.96 3.07C6.54 7.07 9.04 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.15z"/>
                <path fill="#FBBC05" d="M5.61 14.73a7.22 7.22 0 010-4.46L1.65 7.2a11.96 11.96 0 000 9.6l3.96-3.07z"/>
                <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-2.96 0-5.46-2.03-6.36-4.97L1.69 16.9a11.96 11.96 0 0010.31 6.6z"/>
              </svg>
              Continue with Google
            </button>

            {/* Login Redirect */}
            <div style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '13px',
              color: 'var(--muted, #777777)',
              fontFamily: 'var(--font-body)',
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: 'var(--accent, #FFDA62)',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Sign In
              </Link>
            </div>
          </>
      </div>
    </div>
  );
}
