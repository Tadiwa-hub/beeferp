import React, { useState } from 'react';
import useAuthStore from '../auth-store';

const SettingsPage = () => {
  const { user } = useAuthStore();
  const [targetWeight, setTargetWeight] = useState('500');
  const [adgLimit, setAdgLimit] = useState('0.8');
  const [success, setSuccess] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      {success && (
        <div className="alert-banner alert-success text-xs font-semibold max-w-xl mx-auto">
          {success}
        </div>
      )}

      <div className="card p-5 md:p-6 space-y-4 max-w-xl mx-auto">
        <h3 className="section-title"><span>⚙️</span> System Settings</h3>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-primary mb-1">Default Finisher target weight (kg)</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-primary mb-1">Culling Warning Threshold (ADG kg/day)</label>
            <input
              type="number"
              step="0.01"
              value={adgLimit}
              onChange={(e) => setAdgLimit(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Active User Role</span>
            <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 font-mono font-bold text-gray-500 text-sm capitalize">
              {user?.role || 'Staff'} Account
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-premium py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all"
          >
            Save Parameters 💾
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
