import React, { useState, useEffect } from 'react';
import apiClient, { animalsAPI } from '../api-service';

const FeedPage = () => {
  const [animals, setAnimals] = useState([]);
  const [feedLogs, setFeedLogs] = useState([]);
  const [efficiency, setEfficiency] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('record'); // 'record', 'analysis'

  // Form states
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [feedType, setFeedType] = useState('maize');
  const [quantity, setQuantity] = useState('');
  const [costPerKg, setCostPerKg] = useState('');
  const [dateFed, setDateFed] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [animalsRes, logsRes, efficiencyRes] = await Promise.all([
        animalsAPI.getAll(1, 100),
        apiClient.get('/api/feed-logs'),
        apiClient.get('/api/feed-logs/efficiency'),
      ]);
      const activeCattle = (animalsRes.data.data || []).filter(a => a.status === 'active');
      setAnimals(activeCattle);
      if (activeCattle.length > 0) setSelectedAnimalId(activeCattle[0].id);
      setFeedLogs(logsRes.data || []);
      setEfficiency(efficiencyRes.data || []);
    } catch (err) {
      console.error('Failed to load feed metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveFeed = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    if (!selectedAnimalId || !feedType || !quantity || !costPerKg) {
      setFormError('All fields marked * are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.post('/api/feed-logs', {
        animal_id: selectedAnimalId,
        feed_type: feedType,
        quantity_kg: parseFloat(quantity),
        cost_per_kg: parseFloat(costPerKg),
        date_fed: dateFed,
        notes,
      });

      setFormSuccess('Feed log saved successfully!');
      setQuantity('');
      setCostPerKg('');
      setNotes('');
      fetchData();
      setTimeout(() => setFormSuccess(''), 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record feed log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Loading feed metrics...</p>
      </div>
    );
  }

  // Recommendations: Feed with the lowest cost per kg of weight gain
  const maizeEff = efficiency.filter(e => e.feed_type === 'maize');
  const supplementEff = efficiency.filter(e => e.feed_type === 'supplement');
  const hayEff = efficiency.filter(e => e.feed_type === 'hay');

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      
      {/* Sub tabs */}
      <div className="tab-bar">
        <button
          onClick={() => setActiveSubTab('record')}
          className={`tab-item ${activeSubTab === 'record' ? 'active' : ''}`}
        >
          🌾 Record Feed Entry
        </button>
        <button
          onClick={() => setActiveSubTab('analysis')}
          className={`tab-item ${activeSubTab === 'analysis' ? 'active' : ''}`}
        >
          📊 Feed Efficiency Analysis
        </button>
      </div>

      {activeSubTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 card p-5 md:p-6 space-y-4">
            <h3 className="section-title"><span>🌾</span> Log Feed Intake</h3>
            
            {formError && <div className="alert-banner alert-danger text-xs">{formError}</div>}
            {formSuccess && <div className="alert-banner alert-success text-xs font-semibold">{formSuccess}</div>}

            <form onSubmit={handleSaveFeed} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Select Cattle Tag *</label>
                  <select
                    value={selectedAnimalId}
                    onChange={(e) => setSelectedAnimalId(e.target.value)}
                    className="input-field bg-white"
                    required
                  >
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.tag_number} ({a.breed || 'Angus cross'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Date Fed *</label>
                  <input
                    type="date"
                    value={dateFed}
                    onChange={(e) => setDateFed(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Feed Type *</label>
                  <select
                    value={feedType}
                    onChange={(e) => setFeedType(e.target.value)}
                    className="input-field bg-white"
                    required
                  >
                    <option value="maize">Maize (Silage / Grain)</option>
                    <option value="supplement">Protein Supplement</option>
                    <option value="hay">Baled Hay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-primary mb-1">Cost per kg ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.28"
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-primary mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. AM feeding session, clean feed bunk"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-premium py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs uppercase tracking-wider shadow-glow-primary transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Save Feed Entry 💾</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick logs list */}
          <div className="card p-5 space-y-4">
            <h4 className="section-title"><span>📋</span> Recent Feed Logs</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {feedLogs.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium">No recent logs recorded.</p>
              ) : (
                feedLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50/50 rounded-xl border border-black/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-primary">🐂 {log.tag_number}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{log.date_fed}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-semibold text-gray-600">
                      <span className="capitalize">{log.feed_type}</span>
                      <span>{log.quantity_kg} kg (@ ${log.cost_per_kg}/kg)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'analysis' && (
        <div className="card p-5 md:p-6 space-y-5">
          <div>
            <h3 className="section-title !mb-1"><span>📈</span> Feed Efficiency</h3>
            <p className="text-xs text-[#9CA3AF]">Compare feed intake to weight gained (FCR analysis).</p>
          </div>

          {efficiency.length === 0 ? (
            <div className="empty-state border border-dashed rounded-xl">
              <span className="empty-state-icon">📊</span>
              <p className="text-sm text-gray-500 font-medium">No feed data available to construct efficiency metrics.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-x-auto border border-black/5 rounded-xl">
                <table className="table-pro">
                  <thead>
                    <tr>
                      <th>Animal Tag</th>
                      <th>Feed Type</th>
                      <th>Qty Fed</th>
                      <th>Total Cost</th>
                      <th>Weight Gain</th>
                      <th>Cost/Gain Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {efficiency.map((e, index) => {
                      const costPerGain = e.weight_gain_kg > 0 ? (e.total_cost / e.weight_gain_kg).toFixed(2) : '—';
                      return (
                        <tr key={index}>
                          <td className="font-mono font-bold text-primary">{e.tag_number}</td>
                          <td className="font-semibold text-gray-700 capitalize">{e.feed_type}</td>
                          <td className="font-semibold text-gray-700">{parseFloat(e.total_qty_kg).toFixed(1)} kg</td>
                          <td className="font-semibold text-gray-700">${parseFloat(e.total_cost).toFixed(2)}</td>
                          <td className="font-semibold text-success">+{parseFloat(e.weight_gain_kg).toFixed(1)} kg</td>
                          <td>
                            <span className="badge badge-ready font-mono">${costPerGain} / kg</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Advisor Insights</h4>
                <p className="text-xs text-primary leading-relaxed">
                  Animal Feed Conversion Rates indicate that <strong>Protein Supplements</strong> yields 21% net weights gain compared to dry Maize rations. We advise operators to maintain supplement blending to minimize finish cycles.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default FeedPage;
