import React, { useState } from 'react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('monthly_summary');
  const [period, setPeriod] = useState('2026-05-01 to 2026-05-31');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  // Checklist states
  const [checklist, setChecklist] = useState({
    weight: true,
    feed: true,
    financial: true,
    health: true,
    performance: true,
    recommendations: true,
  });

  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setToastMessage('');

    setTimeout(() => {
      setIsGenerating(false);
      setToastMessage('Success: Report generated and downloaded to folder successfully!');
      
      // Automatic browser CSV/text download simulation
      const content = `FeedLot Pro ERP - ${reportType.toUpperCase()} REPORT\nPeriod: ${period}\nGenerated on: ${new Date().toISOString()}\nOptions: ${JSON.stringify(checklist)}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => setToastMessage(''), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-success text-white px-5 py-3 rounded-xl shadow-lg z-50 text-xs font-bold transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Report Form */}
      <div className="card p-5 md:p-6 space-y-4 max-w-xl mx-auto">
        <h3 className="section-title"><span>📄</span> Generate Report</h3>
        
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-primary mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field bg-white"
            >
              <option value="monthly_summary">Monthly Summary</option>
              <option value="quarterly_performance">Quarterly Performance Analysis</option>
              <option value="annual_financial">Annual Financial Audits</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-primary mb-1.5">Period</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input-field"
              placeholder="e.g. May 1 - May 31, 2026"
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase text-primary mb-1">Include Content</label>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist.weight} onChange={() => toggleCheck('weight')} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span>Weight Progression</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist.feed} onChange={() => toggleCheck('feed')} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span>Feed Analysis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist.financial} onChange={() => toggleCheck('financial')} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span>Financial Summary</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist.health} onChange={() => toggleCheck('health')} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span>Health Records</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist.performance} onChange={() => toggleCheck('performance')} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span>Performance Metrics</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={checklist.recommendations} onChange={() => toggleCheck('recommendations')} className="rounded text-primary focus:ring-primary w-4 h-4" />
                <span>Advisor Recommendations</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-primary mb-1.5">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="input-field bg-white"
            >
              <option value="pdf">PDF File</option>
              <option value="csv">CSV Sheet</option>
              <option value="excel">Excel Document</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full btn-premium py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Compiling metrics...</span>
              </>
            ) : (
              <span>Generate Report 📄</span>
            )}
          </button>
        </form>
      </div>

    </div>
  );
};

export default ReportsPage;
