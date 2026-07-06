import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../hooks/supabaseClient';
import { Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
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
            Welcome Back
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted, #777777)',
            fontFamily: 'var(--font-body)',
          }}>
            Access your secure execution dashboard
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

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--body, #b4b4b4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Password
              </label>
            </div>
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
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Signup Redirect */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '13px',
          color: 'var(--muted, #777777)',
          fontFamily: 'var(--font-body)',
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{
            color: 'var(--accent, #FFDA62)',
            textDecoration: 'none',
            fontWeight: 500,
          }}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
