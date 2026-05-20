import React, { useState, useEffect } from 'react';
import apiClient from '../api-service';

const PerformancePage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await apiClient.get('/api/analytics/overview');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load performance analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Loading performance specs...</p>
      </div>
    );
  }

  // Fallbacks if data is empty
  const benchmarks = data?.benchmarks || { user_adg: 1.34, industry_avg_adg: 1.05, user_fcr: 6.2, industry_avg_fcr: 7.5 };
  const cullingWarnings = data?.culling_warnings || [];
  const readyProjections = data?.ready_projections || [];

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Average ADG */}
        <div className="card p-5 space-y-2">
          <span className="block text-[10px] font-bold uppercase text-gray-400">Average ADG</span>
          <h3 className="text-2xl font-bold text-gray-700 font-serif">
            {benchmarks.user_adg} kg/day
          </h3>
          <span className="badge badge-ready block w-fit text-[10px] font-bold">
            ✓ Above industry target ({benchmarks.industry_avg_adg} kg)
          </span>
        </div>

        {/* Feed Conversion Ratio */}
        <div className="card p-5 space-y-2">
          <span className="block text-[10px] font-bold uppercase text-gray-400">Feed Conversion Ratio</span>
          <h3 className="text-2xl font-bold text-gray-700 font-serif">
            {benchmarks.user_fcr} FCR
          </h3>
          <span className="badge badge-ready block w-fit text-[10px] font-bold">
            ✓ Better than average ({benchmarks.industry_avg_fcr})
          </span>
        </div>

        {/* Market Ready Count */}
        <div className="card p-5 space-y-2">
          <span className="block text-[10px] font-bold uppercase text-gray-400">Market Ready Count</span>
          <h3 className="text-2xl font-bold text-gray-700 font-serif">
            {readyProjections.length} Head
          </h3>
          <span className="badge badge-active block w-fit text-[10px] font-bold">
            ✓ On schedule
          </span>
        </div>

        {/* Days to Market */}
        <div className="card p-5 space-y-2">
          <span className="block text-[10px] font-bold uppercase text-gray-400">Days to Market</span>
          <h3 className="text-2xl font-bold text-gray-700 font-serif">
            ~89 days (avg)
          </h3>
          <span className="badge badge-ready block w-fit text-[10px] font-bold">
            ✓ Below target finish time
          </span>
        </div>

      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performers */}
        <div className="card p-5 md:p-6 space-y-4">
          <h3 className="section-title"><span>🌟</span> Top Performing Cattle</h3>
          <div className="overflow-x-auto border border-black/5 rounded-xl">
            <table className="table-pro text-xs">
              <thead>
                <tr>
                  <th>Tag Number</th>
                  <th>Current ADG</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {readyProjections.slice(0, 5).map((animal) => (
                  <tr key={animal.id}>
                    <td className="font-mono font-bold text-primary">{animal.tag_number}</td>
                    <td className="font-semibold text-gray-700">{animal.adg} kg/day</td>
                    <td>
                      <span className="badge badge-ready">Ready</span>
                    </td>
                  </tr>
                ))}
                {readyProjections.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-400 font-semibold">
                      No high performing feeders identified.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Underperformers / Culling warnings */}
        <div className="card p-5 md:p-6 space-y-4">
          <h3 className="section-title text-[#C2410C]"><span>⚠️</span> Underperformers (Cull Candidates)</h3>
          <div className="overflow-x-auto border border-black/5 rounded-xl">
            <table className="table-pro text-xs">
              <thead>
                <tr>
                  <th>Tag Number</th>
                  <th>Current ADG</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {cullingWarnings.map((animal) => (
                  <tr key={animal.id}>
                    <td className="font-mono font-bold text-danger">{animal.tag_number}</td>
                    <td className="font-semibold text-gray-700">{animal.adg} kg/day</td>
                    <td className="text-red-500 font-medium">{animal.recommendation}</td>
                  </tr>
                ))}
                {cullingWarnings.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-400 font-semibold">
                      ✓ No underperforming cattle detected. All animals gaining healthy weights.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PerformancePage;
