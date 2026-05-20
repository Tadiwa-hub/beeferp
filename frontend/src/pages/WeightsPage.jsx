import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient, { animalsAPI, weightsAPI } from '../api-service';

const WeightsPage = () => {
  const [animals, setAnimals] = useState([]);
  const [activeTab, setActiveTab] = useState('bulk');
  
  // History tab states
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [adgStats, setAdgStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adgDays, setAdgDays] = useState(7);

  // Bulk tab states
  const [bulkWeights, setBulkWeights] = useState({});
  const [bulkNotes, setBulkNotes] = useState({});
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  const fetchActiveAnimals = async () => {
    try {
      const res = await animalsAPI.getAll(1, 100);
      const activeList = (res.data.data || []).filter(a => a.status === 'active');
      setAnimals(activeList);
      if (activeList.length > 0 && !selectedAnimalId) {
        setSelectedAnimalId(activeList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch active animals:', err);
    }
  };

  useEffect(() => {
    fetchActiveAnimals();
  }, []);

  const fetchAnimalWeightHistory = async () => {
    if (!selectedAnimalId) return;
    setHistoryLoading(true);
    setHistoryData([]);
    setAdgStats(null);
    try {
      const histRes = await weightsAPI.getByAnimal(selectedAnimalId);
      const formatted = (histRes.data.data || []).map(r => ({
        ...r,
        date: new Date(r.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: parseFloat(r.weight_kg),
      }));
      setHistoryData(formatted);

      const adgRes = await apiClient.get(`/api/weight-records/${selectedAnimalId}/adg?days=${adgDays}`);
      setAdgStats(adgRes.data);
    } catch (err) {
      console.error('Fetch weight history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimalWeightHistory();
  }, [selectedAnimalId, adgDays]);

  const handleBulkWeightChange = (animalId, val) => {
    setBulkWeights(prev => ({ ...prev, [animalId]: val }));
  };

  const handleBulkNoteChange = (animalId, val) => {
    setBulkNotes(prev => ({ ...prev, [animalId]: val }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkError('');
    setBulkSuccess('');
    setIsSubmittingBulk(true);

    const records = Object.keys(bulkWeights)
      .filter(id => bulkWeights[id] !== '')
      .map(id => ({
        animal_id: id,
        weight_kg: parseFloat(bulkWeights[id]),
        notes: bulkNotes[id] || '',
      }));

    if (records.length === 0) {
      setBulkError('Please enter at least one animal weight to submit.');
      setIsSubmittingBulk(false);
      return;
    }

    try {
      const res = await weightsAPI.createBulk({ records });
      setBulkSuccess(res.data.message || 'Bulk weight records logged successfully!');
      setBulkWeights({});
      setBulkNotes({});
      fetchActiveAnimals();
    } catch (err) {
      console.error('Bulk upload error:', err);
      setBulkError(err.response?.data?.message || 'Failed to log weight records.');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-fade-in pb-20 md:pb-0 h-full">
      
      {/* Navigation tabs */}
      <div className="tab-bar">
        <button
          onClick={() => setActiveTab('bulk')}
          className={`tab-item ${activeTab === 'bulk' ? 'active' : ''}`}
        >
          ⚖️ Daily Bulk Weighing Session
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
        >
          📈 Animal Weight & ADG History
        </button>
      </div>

      {/* ======================================================== */}
      {/* BULK TAB CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'bulk' && (
        <div className="card p-4 md:p-6 space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="section-title !mb-1"><span>⚖️</span> Daily Herd Weighing</h3>
              <p className="text-xs text-gray-500">Enter today's weights for active feeders. System updates current weights automatically.</p>
            </div>
            <span className="badge badge-active text-[10px]">
              📅 {new Date().toISOString().split('T')[0]}
            </span>
          </div>

          {bulkError && <div className="alert-banner alert-danger text-xs">{bulkError}</div>}
          {bulkSuccess && <div className="alert-banner alert-success text-xs font-semibold">{bulkSuccess}</div>}

          {animals.length === 0 ? (
            <div className="empty-state border border-dashed rounded-xl">
              <span className="empty-state-icon">⚖️</span>
              <p className="text-sm text-gray-500 font-medium">No active feeders registered to weigh.</p>
            </div>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-5">
              <div className="overflow-x-auto border border-black/5 rounded-xl">
                <table className="table-pro">
                  <thead>
                    <tr>
                      <th>Tag Number</th>
                      <th>Breed</th>
                      <th>Previous Weight</th>
                      <th className="w-44 md:w-56">New Weight (kg) *</th>
                      <th>Weight Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((animal) => (
                      <tr key={animal.id}>
                        <td className="font-mono font-bold text-primary">{animal.tag_number}</td>
                        <td className="font-semibold text-gray-700">{animal.breed || 'Angus cross'}</td>
                        <td className="text-gray-400 font-medium">
                          {animal.current_weight ? `${animal.current_weight} kg` : '—'}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="Enter kg..."
                            value={bulkWeights[animal.id] || ''}
                            onChange={(e) => handleBulkWeightChange(animal.id, e.target.value)}
                            className="input-field !py-1.5 text-xs font-semibold"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Good gain, bloated..."
                            value={bulkNotes[animal.id] || ''}
                            onChange={(e) => handleBulkNoteChange(animal.id, e.target.value)}
                            className="input-field !py-1.5 text-xs bg-gray-50/50 focus:bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => { if(window.confirm('Clear all unsaved weights?')) { setBulkWeights({}); setBulkNotes({}); } }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-danger transition-colors flex items-center gap-1.5"
                >
                  <span>🔄</span> Reset Table
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk}
                  className="btn-premium py-2.5 px-8 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-sm shadow-glow-primary transition-all flex items-center gap-2"
                >
                  {isSubmittingBulk ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting logs...</span>
                    </>
                  ) : (
                    <span>Save Weight Logs 💾</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* HISTORY & CHART TAB CONTENT */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col min-h-0 card p-3 md:p-4 space-y-3 overflow-hidden">
          {/* Filters Bar */}
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3 bg-background p-3 rounded-xl border border-black/5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-primary mb-1.5">Select Animal Tag</label>
              <select
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="input-field bg-white font-bold"
              >
                {animals.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    🐂 {animal.tag_number} ({animal.breed || 'Angus cross'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-primary mb-1.5">ADG Interval Period</label>
              <select
                value={adgDays}
                onChange={(e) => setAdgDays(parseInt(e.target.value))}
                className="input-field bg-white font-bold"
              >
                <option value="7">Last 7 Days</option>
                <option value="15">Last 15 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="60">Last 60 Days</option>
              </select>
            </div>
          </div>

          {historyLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 flex-1">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Fetching historical analytics...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
              {/* Chart */}
              <div className="flex-[2] border border-black/5 rounded-xl p-3 bg-gray-50/50 flex flex-col min-h-0">
                <h4 className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider flex-shrink-0">Weight Gain Curve (kg)</h4>
                <div className="w-full h-[250px] lg:h-auto lg:flex-1 lg:min-h-0">
                  {historyData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold border border-dashed rounded-xl">
                      No historical weight data logged for this animal.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 9, fontWeight: 600 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 9, fontWeight: 600 }} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#2563EB"
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }}
                          name="Weight (kg)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ADG Stat Panel */}
              <div className="flex-[1] flex flex-col gap-3 min-h-0 overflow-auto pr-1">
                {/* ADG stats card */}
                <div className="card-gradient-primary rounded-xl p-5 shadow-glow-primary flex flex-col justify-between h-40">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-accent-light">Average Daily Gain</span>
                    <h3 className="text-3xl font-black font-serif mt-1">
                      {adgStats?.adg !== null && adgStats?.adg !== undefined ? `${adgStats.adg} kg/day` : 'N/A'}
                    </h3>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed m-0">
                    Calculated over the last <strong>{adgDays} days</strong> interval. 
                    Target daily gain: 1.2 kg - 1.8 kg.
                  </p>
                </div>

                {/* Performance details card */}
                <div className="border border-black/5 rounded-xl p-4 bg-white space-y-3">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b pb-1.5 m-0">Performance Specs</h4>
                  
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-400">Starting Weight:</span>
                    <span className="text-primary">{adgStats?.weight_start ? `${adgStats.weight_start} kg` : 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-400">Latest Weight:</span>
                    <span className="text-primary">{adgStats?.weight_current ? `${adgStats.weight_current} kg` : 'N/A'}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold border-t pt-2">
                    <span className="text-gray-400">Total Net Gain:</span>
                    <span className="text-success">
                      {adgStats?.total_gain ? `+${adgStats.total_gain} kg` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeightsPage;
