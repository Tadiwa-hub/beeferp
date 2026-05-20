import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../auth-store';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    setFormError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setFormError('Please enter both your username and password.');
      return;
    }

    const success = await login(cleanUsername, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        {/* Compact Branding Header */}
        <div className="text-center mb-6">
          <span className="text-4xl block mb-1">🐂</span>
          <h1 className="text-2xl font-bold font-serif text-primary m-0 tracking-tight">BeefERP</h1>
          <p className="text-accent font-medium mt-0.5 uppercase tracking-widest text-[10px]">Livestock ERP Suite</p>
        </div>

        {/* Compact Form Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 card-glass">
          <h2 className="text-lg font-bold font-serif text-primary mb-4">Sign In</h2>

          {/* Friendly Error Alert Banner */}
          {(formError || error) && (
            <div className="bg-red-50 text-danger border border-red-100 rounded-lg px-3 py-2 mb-4 text-xs font-semibold flex items-start gap-2 animate-pulse">
              <span className="text-sm">⚠️</span>
              <p className="m-0 leading-relaxed">
                {formError || (error === 'Invalid username or password' ? 'Incorrect username/email or password. Please try again.' : error)}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1" htmlFor="username">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs text-primary font-medium"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-primary" htmlFor="password">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-background-dark/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs text-primary font-medium"
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
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Access Dashboard 🚀</span>
              )}
            </button>
          </form>

          {/* Inline Link for Registration */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs">
            <span className="text-gray-400">New? </span>
            <Link to="/register" className="text-primary font-bold hover:underline transition-colors">
              Create a Staff Account
            </Link>
          </div>
        </div>

        {/* Super Unobtrusive Compact Badges for Demo Credentials */}
        <div className="bg-yellow-50/50 border border-yellow-100/60 rounded-xl p-3.5 mt-4 text-center">
          <p className="text-[10px] text-yellow-800 font-bold mb-1.5 flex items-center justify-center gap-1">
            🔑 Quick Demo Access
          </p>
          <div className="flex justify-center gap-2 font-mono text-[9px] text-yellow-800">
            <span className="bg-white px-2 py-1 rounded border border-yellow-100">User: <strong className="text-yellow-900 selection:bg-yellow-200">admin</strong></span>
            <span className="bg-white px-2 py-1 rounded border border-yellow-100">Pass: <strong className="text-yellow-900 selection:bg-yellow-200">Admin@123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
