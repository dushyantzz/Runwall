import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../hooks/supabaseClient';
import { useAuth } from '../hooks/AuthContext';
import { Lock, Mail, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Extract redirect URL from query string or router state, default to /docs
  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || (location.state as any)?.from?.pathname || '/docs';

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const cleanRedirect = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${cleanRedirect}`,
        }
      });

      if (error) {
        setError(error.message);
      } else {
        navigate(redirectTarget, { replace: true });
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
      const cleanRedirect = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${cleanRedirect}`,
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
      minHeight: '100vh',
      background: '#000000',
      padding: '110px 24px 60px',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Background ambient radial glow */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(255, 218, 98, 0.05) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Pricing-style Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#08080a',
        border: '1px solid var(--accent)',
        borderRadius: 12,
        padding: '36px 32px',
        boxShadow: '0 0 40px rgba(255,218,98,0.06), 0 20px 40px rgba(0,0,0,0.8)',
        zIndex: 1,
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Card Header matching Pricing Tier info */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 400,
            color: '#ffffff',
            marginBottom: 8,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}>
            Create an Account
          </h2>
          <p style={{
            fontSize: 13,
            color: '#888888',
            lineHeight: 1.5,
            fontFamily: 'var(--font-body)',
          }}>
            Get instant access to Runwall Gateway & Documentation
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
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
            color: '#ef4444',
            fontSize: '13px',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666666',
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
                  background: '#030304',
                  border: '1px solid #1c1c1c',
                  borderRadius: '8px',
                  padding: '12px 14px 12px 42px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 12px rgba(255,218,98,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#1c1c1c';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666666',
              }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 characters)"
                style={{
                  width: '100%',
                  background: '#030304',
                  border: '1px solid #1c1c1c',
                  borderRadius: '8px',
                  padding: '12px 42px 12px 42px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 12px rgba(255,218,98,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#1c1c1c';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="confirmPassword" style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#888888',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono)',
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666666',
              }} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: '#030304',
                  border: '1px solid #1c1c1c',
                  borderRadius: '8px',
                  padding: '12px 14px 12px 42px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 12px rgba(255,218,98,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#1c1c1c';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Pricing-style Primary CTA Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 0',
              background: 'var(--accent)',
              color: '#000000',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              fontFamily: 'var(--font-display)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              marginTop: 4,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.92';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span>{loading ? 'Creating account...' : 'Create Free Account'}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Divider matching Pricing Card style */}
        <div style={{
          position: 'relative',
          borderTop: '1px solid #161616',
          margin: '28px 0 24px',
          textAlign: 'center',
        }}>
          <span style={{
            position: 'relative',
            top: '-9px',
            background: '#08080a',
            padding: '0 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#666666',
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-mono)',
          }}>
            OR
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            background: '#040405',
            color: '#ffffff',
            border: '1px solid #1c1c1c',
            borderRadius: 8,
            padding: '12px 0',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0e0e11';
            e.currentTarget.style.borderColor = '#333333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#040405';
            e.currentTarget.style.borderColor = '#1c1c1c';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.63 0 3.09.56 4.24 1.66L19.39 3.5C17.38 1.63 14.88.5 12 .5 7.42.5 3.52 3.12 1.65 6.94l3.96 3.07C6.54 7.07 9.04 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.15z"/>
            <path fill="#FBBC05" d="M5.61 14.73a7.22 7.22 0 010-4.46L1.65 7.2a11.96 11.96 0 000 9.6l3.96-3.07z"/>
            <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-2.96 0-5.46-2.03-6.36-4.97L1.69 16.9a11.96 11.96 0 0010.31 6.6z"/>
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* Login Redirect Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          fontSize: '13px',
          color: '#888888',
          fontFamily: 'var(--font-body)',
        }}>
          Already have an account?{' '}
          <Link
            to={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'}
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
