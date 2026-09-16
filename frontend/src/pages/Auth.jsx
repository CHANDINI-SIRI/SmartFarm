import { useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      const result =
        mode === 'login'
          ? await api.login({
              email: email.trim(),
              password
            })
          : await api.register({
              email: email.trim(),
              password,
              full_name: fullName.trim()
            });

      if (!result?.token) {
        throw new Error(
          'Authentication succeeded, but no login token was returned.'
        );
      }

      localStorage.setItem('sf_token', result.token);

      if (onLogin) {
        onLogin(result);
      }

      window.location.reload();
    } catch (err) {
      console.error('AUTH ERROR:', err);

      setError(
        err?.message ||
          'Unable to connect to SmartFarm AI. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-auth-page">
      <div className="smart-auth-background">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
      </div>

      <div className="smart-auth-card">

        {/* LEFT PANEL */}
        <section className="smart-auth-info">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <span>🌱</span>
            </div>

            <div>
              <div className="auth-brand-name">
                SmartFarm <strong>AI</strong>
              </div>

              <div className="auth-brand-subtitle">
                Intelligent farming decisions
              </div>
            </div>
          </div>

          <div className="auth-info-content">
            <span className="auth-eyebrow">
              SMART FARMING PLATFORM
            </span>

            <h1>
              Make better
              <br />
              farming decisions.
            </h1>

            <p>
              Bring weather, crop health, irrigation,
              market information and AI-assisted
              recommendations together in one place.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <span className="feature-icon">☁️</span>
                <div>
                  <strong>Live weather insights</strong>
                  <small>
                    Monitor weather conditions for your farm.
                  </small>
                </div>
              </div>

              <div className="auth-feature">
                <span className="feature-icon">🌿</span>
                <div>
                  <strong>Crop health support</strong>
                  <small>
                    Identify possible plant disease symptoms.
                  </small>
                </div>
              </div>

              <div className="auth-feature">
                <span className="feature-icon">🤖</span>
                <div>
                  <strong>AI-assisted decisions</strong>
                  <small>
                    Get explainable recommendations while
                    keeping the farmer in control.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-info-footer">
            <span>🌾</span>
            Built for smarter, more informed farming.
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="smart-auth-form-panel">

          <div className="auth-mobile-brand">
            <div className="auth-brand-mark">
              <span>🌱</span>
            </div>

            <div className="auth-brand-name">
              SmartFarm <strong>AI</strong>
            </div>
          </div>

          <div className="auth-form-header">
            <h2>
              {mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </h2>

            <p>
              {mode === 'login'
                ? 'Sign in to access your SmartFarm dashboard.'
                : 'Set up your account and start managing your farm.'}
            </p>
          </div>

          {/* TABS */}
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Create account
            </button>
          </div>

          <form
            className="smart-auth-form"
            onSubmit={submit}
          >

            {mode === 'register' && (
              <div className="auth-field">
                <label htmlFor="fullName">
                  Full name
                </label>

                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    👤
                  </span>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">
                Email address
              </label>

              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  ✉️
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="farmer@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">
                  Password
                </label>

                {mode === 'login' && (
                  <span className="auth-help-text">
                    Secure login
                  </span>
                )}
              </div>

              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    mode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              <span>
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </span>

              {!loading && (
                <span className="submit-arrow">
                  →
                </span>
              )}
            </button>
          </form>

          <div className="auth-security-note">
            <span>🔐</span>
            Your account information is protected
            with authenticated access.
          </div>

        </section>
      </div>
    </div>
  );
}