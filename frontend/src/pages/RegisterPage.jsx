import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../auth-store';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    setFormError('');
  }, []);

  // Client-side password validation helper
  const checkPasswordRequirements = (pass) => {
    return {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
    };
  };

  const reqs = checkPasswordRequirements(password);
  const isPasswordValid = reqs.length && reqs.upper && reqs.lower && reqs.number;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanUsername || !password || !confirmPassword) {
      setFormError('Name, username, password, and confirmation are required.');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setFormError('Username must be 3-30 characters (letters, numbers, or underscores only, no spaces).');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setFormError('Password does not meet complexity requirements.');
      return;
    }

    const success = await register(cleanName, cleanUsername, cleanEmail || null, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm my-6">
        {/* Compact Branding Header */}
        <div className="text-center mb-6">
          <span className="text-4xl block mb-1">🐂</span>
          <h1 className="text-2xl font-bold font-serif text-primary m-0 tracking-tight">BeefERP</h1>
          <p className="text-accent font-medium mt-0.5 uppercase tracking-widest text-[10px]">Livestock ERP Suite</p>
        </div>

        {/* Compact Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 card-glass">
          <h2 className="text-lg font-bold font-serif text-primary mb-4">Create Account</h2>

          {/* Friendly Error Alert Banner */}
          {(formError || error) && (
            <div className="bg-red-50 text-danger border border-red-100 rounded-lg px-3 py-2 mb-4 text-xs font-semibold flex items-start gap-2 animate-pulse">
              <span className="text-sm">⚠️</span>
              <p className="m-0 leading-relaxed">
                {formError || (error === 'Username is already taken' ? 'This username is already taken. Please choose another one.' : error)}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-primary font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. john_doe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-primary font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1" htmlFor="email">
                Email Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@feedlotpro.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-primary font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-primary font-medium"
                required
              />
            </div>

            {/* Compact requirements checklist inline overlay */}
            {password.length > 0 && !isPasswordValid && (
              <div className="bg-background rounded-lg p-2.5 text-[10px] space-y-1 border border-gray-150">
                <p className="font-bold text-primary text-opacity-80 mb-1">Requirements:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-medium">
                  <span className={reqs.length ? 'text-success' : 'text-gray-400'}>{reqs.length ? '✓' : '✗'} 8+ Chars</span>
                  <span className={reqs.upper ? 'text-success' : 'text-gray-400'}>{reqs.upper ? '✓' : '✗'} Uppercase</span>
                  <span className={reqs.lower ? 'text-success' : 'text-gray-400'}>{reqs.lower ? '✓' : '✗'} Lowercase</span>
                  <span className={reqs.number ? 'text-success' : 'text-gray-400'}>{reqs.number ? '✓' : '✗'} Number</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-primary mb-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-primary font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-premium py-2 px-3 rounded-lg bg-primary hover:bg-primary-light text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Account 🐂</span>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs">
            <span className="text-gray-400">Already registered? </span>
            <Link to="/login" className="text-primary font-bold hover:underline transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
