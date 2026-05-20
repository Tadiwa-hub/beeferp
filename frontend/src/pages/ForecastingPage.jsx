import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api-service';

const ForecastingPage = () => {
  const [data, setData] = useState([]);
  const [assumptions, setAssumptions] = useState({ adg: 1.35 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const res = await apiClient.get('/api/analytics/financials');
        setData(res.data.forecast || []);
        if (res.data.assumptions) setAssumptions(res.data.assumptions);
      } catch (err) {
        console.error('Failed to load forecast projection:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchForecasts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Calculating future growth forecasts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 h-full flex flex-col min-h-0">
      
      {/* 6-Month Chart */}
      <div className="flex-1 flex flex-col min-h-0 card p-4 md:p-5 space-y-3">
        <div className="flex-shrink-0">
          <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-0.5"><span>📈</span> 6-Month Financial Projection</h3>
          <p className="text-[10px] text-gray-500">Predictive modeling of feed investment vs live market revenue curves.</p>
        </div>

        <div className="w-full h-[250px] lg:h-auto lg:flex-1 lg:min-h-0">
          {data.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold border border-dashed rounded-xl">
              Unable to generate projection. Ensure animals are registered in herd.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFeed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip />
                <Area type="monotone" dataKey="projected_revenue" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Projected Revenue" />
                <Area type="monotone" dataKey="projected_feed_costs" stroke="#94A3B8" strokeWidth={2} fillOpacity={1} fill="url(#colorFeed)" name="Projected Feed Costs" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model Parameters Box */}
      <div className="flex-shrink-0 card p-4 md:p-5 space-y-2 mt-4">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Predictive Parameters Summary</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          The BeefERP Predictive model estimates cumulative feed demands utilizing your herd's current <strong>{assumptions.adg} kg/day</strong> growth gain coefficient with a dynamically adjusted Feed Conversion Ratio (FCR) over a 180-day cycle. Costs are projected using the current utility price matrix ($0.28 per feed kilogram).
        </p>
      </div>

    </div>
  );
};

export default ForecastingPage;
