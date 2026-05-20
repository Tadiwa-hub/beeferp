import React, { useState, useEffect } from 'react';
import apiClient from '../api-service';

const FinancialsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const res = await apiClient.get('/api/analytics/overview');
        setMetrics(res.data.metrics || {});
      } catch (err) {
        console.error('Failed to load financial analysis:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Loading financial metrics...</p>
      </div>
    );
  }

  // Cost summaries
  const feedCost = metrics.total_feed_costs || 0;
  const vetCost = metrics.total_vet_costs || 0;
  const otherCost = metrics.fixed_overhead || 0;
  const totalCost = feedCost + vetCost + otherCost;
  const potentialRev = metrics.total_revenue_projection || 0;
  const profit = potentialRev - totalCost;
  const margin = potentialRev > 0 ? ((profit / potentialRev) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-fade-in pb-20 md:pb-0 h-full">
      
      {/* Cost Summary Box */}
      <div className="card p-5 md:p-6 space-y-4">
        <h3 className="section-title">
          <span>💰</span> Operational Costs - {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold border-b pb-2">
              <span className="text-gray-400">Total Feed Cost:</span>
              <span className="text-primary">${feedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold border-b pb-2">
              <span className="text-gray-400">Total Veterinary Cost:</span>
              <span className="text-primary">${vetCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold border-b pb-2">
              <span className="text-gray-400">Total Other Costs (Overhead / Utility):</span>
              <span className="text-primary">${otherCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-extrabold border-b pb-2 text-primary pt-1">
              <span>Total Operational Cost:</span>
              <span>${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-black/5 flex flex-col justify-between">
            <div>
              <span className="block text-[10px] font-bold uppercase text-gray-400">Projected Cash revenue</span>
              <h3 className="text-3xl font-bold font-serif text-primary mt-1">
                ${potentialRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-black/5">
              <span className="text-gray-500">Projected Margin:</span>
              <span className="text-success font-black text-sm">+{margin}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost per head box */}
      <div className="card p-5 md:p-6 space-y-4">
        <h3 className="section-title"><span>🐄</span> Per Head Operational Costs (Average)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-background-dark/20 rounded-xl border border-black/5 text-center">
            <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Feed Cost / kg Gain</span>
            <span className="text-lg font-bold text-gray-700">${metrics.avg_cost_per_kg_gained || '0.00'}</span>
          </div>
          <div className="p-4 bg-background-dark/20 rounded-xl border border-black/5 text-center">
            <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Avg cost / head</span>
            <span className="text-lg font-bold text-gray-700">${metrics.avg_cost_per_head || '0.00'}</span>
          </div>
          <div className="p-4 bg-background-dark/20 rounded-xl border border-black/5 text-center">
            <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Projected revenue / head</span>
            <span className="text-lg font-bold text-gray-700">${metrics.avg_rev_per_head || '0.00'}</span>
          </div>
          <div className="p-4 bg-background-dark/20 rounded-xl border border-black/5 text-center">
            <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Profit margin / head</span>
            <span className={`text-lg font-bold ${metrics.avg_profit_per_head >= 0 ? 'text-success' : 'text-danger'}`}>
              {metrics.avg_profit_per_head >= 0 ? '+' : ''}${metrics.avg_profit_per_head || '0.00'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FinancialsPage;
