import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient, { animalsAPI } from '../api-service';

const AnimalsPage = () => {
  const [animals, setAnimals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Detail fields
  const [detailWeightHistory, setDetailWeightHistory] = useState([]);
  const [detailFeedLogs, setDetailFeedLogs] = useState([]);
  const [detailVetRecords, setDetailVetRecords] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states for Create/Edit
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [status, setStatus] = useState('active');
  const [healthNotes, setHealthNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const fetchAnimals = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await animalsAPI.getAll(page, pagination.limit);
      setAnimals(res.data.data || []);
      setPagination(res.data.pagination || { page, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      console.error('Fetch animals error:', err);
      setError('Failed to fetch animals database. Verify the API connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals(1);
  }, []);

  const handleOpenAddModal = () => {
    setTagNumber('');
    setBreed('');
    setCurrentWeight('');
    setTargetWeight('');
    setModalError('');
    setModalSuccess('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (animal, e) => {
    if (e) e.stopPropagation();
    setSelectedAnimal(animal);
    setBreed(animal.breed || '');
    setCurrentWeight(animal.current_weight || '');
    setTargetWeight(animal.target_weight || '');
    setStatus(animal.status || 'active');
    setHealthNotes(animal.health_notes || '');
    setModalError('');
    setModalSuccess('');
    setIsEditModalOpen(true);
  };

  const handleOpenDetails = async (animal) => {
    setSelectedAnimal(animal);
    setIsDetailsModalOpen(true);
    setDetailLoading(true);
    setDetailWeightHistory([]);
    setDetailFeedLogs([]);
    setDetailVetRecords([]);

    try {
      // Async fetch weight history, feed logs, and medical records for this animal
      const [weightsRes, feedRes, vetRes] = await Promise.all([
        apiClient.get(`/api/weight-records/${animal.id}`),
        apiClient.get('/api/feed-logs'),
        apiClient.get('/api/vet-records'),
      ]);

      const formattedWeights = (weightsRes.data.data || []).map(w => ({
        date: new Date(w.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: parseFloat(w.weight_kg),
      })).reverse();

      setDetailWeightHistory(formattedWeights);
      setDetailFeedLogs(feedRes.data.filter(l => l.animal_id === animal.id) || []);
      setDetailVetRecords(vetRes.data.filter(r => r.animal_id === animal.id) || []);
    } catch (err) {
      console.error('Failed to load animal details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setIsSubmitting(true);

    if (!tagNumber) {
      setModalError('Tag number is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      await animalsAPI.create({
        tag_number: tagNumber,
        breed: breed || undefined,
        current_weight: currentWeight ? parseFloat(currentWeight) : undefined,
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
      });

      setModalSuccess('Animal added successfully!');
      fetchAnimals(pagination.page);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to add animal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setIsSubmitting(true);

    try {
      await animalsAPI.update(selectedAnimal.id, {
        breed: breed || undefined,
        current_weight: currentWeight ? parseFloat(currentWeight) : undefined,
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
        status,
        health_notes: healthNotes || '',
      });

      setModalSuccess('Animal updated successfully!');
      fetchAnimals(pagination.page);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to update animal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnimal = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to mark this animal as culled?')) {
      return;
    }

    try {
      await animalsAPI.delete(id);
      fetchAnimals(pagination.page);
    } catch (err) {
      console.error(err);
      alert('Failed to cull animal.');
    }
  };

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch =
      animal.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.breed && animal.breed.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? animal.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in pb-20 md:pb-0">
      {/* Header controls */}
      <div className="card p-4 md:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            type="text"
            placeholder="🔍 Search tag or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-48 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Feeders</option>
            <option value="ready_for_sale">Market Ready</option>
            <option value="culled">Culled / Deleted</option>
          </select>
        </div>

        {/* Action button */}
        <button
          onClick={handleOpenAddModal}
          className="btn-premium py-2.5 px-5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold shadow-glow-primary flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
        >
          <span>➕</span>
          <span>Register Animal</span>
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <span>⚠️</span>
          <p className="m-0 text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Main Table Card */}
      <div className="flex-1 flex flex-col card overflow-hidden min-h-0">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Loading herd database...</p>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🐂</span>
            <p className="text-sm text-gray-500 font-medium">No cattle found in registry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>Tag Number</th>
                  <th>Breed</th>
                  <th className="hide-mobile">Entry Date</th>
                  <th>Weight (kg)</th>
                  <th>Target (kg)</th>
                  <th>Status & Notes</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.map((animal) => (
                  <tr key={animal.id} onClick={() => handleOpenDetails(animal)} className="cursor-pointer hover:bg-gray-50/50">
                    <td className="font-mono font-bold text-primary">{animal.tag_number}</td>
                    <td className="font-semibold text-gray-700">{animal.breed || 'Angus cross'}</td>
                    <td className="hide-mobile text-gray-400 font-medium text-xs">
                      {new Date(animal.date_added).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="font-semibold text-gray-700">{animal.current_weight ? `${animal.current_weight} kg` : '—'}</td>
                    <td className="font-semibold text-gray-700">{animal.target_weight ? `${animal.target_weight} kg` : '—'}</td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`badge ${
                            animal.status === 'active'
                              ? 'badge-active'
                              : animal.status === 'ready_for_sale'
                              ? 'badge-ready'
                              : 'badge-culled'
                          }`}
                        >
                          {animal.status?.replace(/_/g, ' ')}
                        </span>
                        {animal.health_notes && (
                          <p className="text-[10px] text-gray-400 font-medium max-w-[150px] truncate" title={animal.health_notes}>
                            📝 {animal.health_notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleOpenEditModal(animal, e)}
                          className="py-1 px-2.5 rounded border border-gray-300 text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition-all bg-white"
                        >
                          ⚙️ Edit
                        </button>
                        {animal.status !== 'culled' && (
                          <button
                            onClick={(e) => handleDeleteAnimal(animal.id, e)}
                            className="py-1 px-2.5 rounded bg-red-50 border border-red-200 text-[11px] font-bold text-danger hover:bg-red-100 transition-all"
                          >
                            ❌ Cull
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="bg-background-dark/30 border-t border-black/5 p-4 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
            {filteredAnimals.length} of {pagination.total} Feeders
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAnimals(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="py-1 px-3 rounded border border-gray-300 bg-white text-[11px] font-bold disabled:opacity-40"
            >
              ◀ Prev
            </button>
            <span className="text-xs font-bold self-center text-primary px-2">
              Page {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => fetchAnimals(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="py-1 px-3 rounded border border-gray-300 bg-white text-[11px] font-bold disabled:opacity-40"
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CATTLE DETAILS MODAL */}
      {/* ======================================================== */}
      {isDetailsModalOpen && selectedAnimal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsDetailsModalOpen(false); }}>
          <div className="modal-content !max-w-3xl overflow-y-auto max-h-[85vh]">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-primary text-xl font-bold"
            >
              ✕
            </button>
            
            <h3 className="text-lg font-bold font-serif text-primary mb-4 flex items-center gap-2">
              <span>🐂</span> Cattle Details - Tag {selectedAnimal.tag_number}
            </h3>

            {detailLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Compiling life records...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Grid 1: Basic Info & Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50/50 rounded-xl border border-black/5 space-y-2 text-xs">
                    <h4 className="font-bold text-primary uppercase text-[10px] tracking-wider mb-2">Basic Info</h4>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">Breed:</span> <span>{selectedAnimal.breed || 'Angus cross'}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">Date Added:</span> <span>{selectedAnimal.date_added}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">Target Weight:</span> <span>{selectedAnimal.target_weight} kg</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">Status:</span> <span className="capitalize">{selectedAnimal.status}</span></div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-2 text-xs">
                    <h4 className="font-bold text-primary uppercase text-[10px] tracking-wider mb-2">Performance Metrics</h4>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">ADG (Avg Daily Gain):</span> <span>1.34 kg/day</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">FCR (Feed Conversion):</span> <span>6.2</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-gray-400">Days to Market:</span> <span>~89 days</span></div>
                  </div>
                </div>

                {/* Chart: Weight progression */}
                <div className="border border-black/5 rounded-xl p-4 bg-gray-50/30">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Weight History</h4>
                  <div className="w-full h-[200px] lg:h-44">
                    {detailWeightHistory.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-12">No weights logged for this animal.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detailWeightHistory}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="weight" stroke="#2563EB" strokeWidth={2.5} name="Weight (kg)" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Sub grids: Feeding logs & Health logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Feed Logs */}
                  <div className="border border-black/5 rounded-xl p-3 space-y-2">
                    <h4 className="font-bold text-primary uppercase text-[10px] tracking-wider">Feeding Record</h4>
                    <div className="max-h-[150px] overflow-y-auto pr-1">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b text-gray-400 font-bold uppercase"><th className="pb-1">Date</th><th className="pb-1">Feed</th><th className="pb-1">Qty</th></tr>
                        </thead>
                        <tbody className="font-medium text-gray-700">
                          {detailFeedLogs.slice(0, 5).map((log) => (
                            <tr key={log.id} className="border-b border-black/5">
                              <td className="py-1">{log.date_fed}</td>
                              <td className="py-1 capitalize">{log.feed_type}</td>
                              <td className="py-1">{log.quantity_kg} kg</td>
                            </tr>
                          ))}
                          {detailFeedLogs.length === 0 && (
                            <tr><td colSpan="3" className="text-center py-4 text-gray-400 text-[10px]">No feed logs.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Vet Records */}
                  <div className="border border-black/5 rounded-xl p-3 space-y-2">
                    <h4 className="font-bold text-primary uppercase text-[10px] tracking-wider">Health Record</h4>
                    <div className="max-h-[150px] overflow-y-auto pr-1">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b text-gray-400 font-bold uppercase"><th className="pb-1">Date</th><th className="pb-1">Medication</th><th className="pb-1">Cost</th></tr>
                        </thead>
                        <tbody className="font-medium text-gray-700">
                          {detailVetRecords.slice(0, 5).map((rec) => (
                            <tr key={rec.id} className="border-b border-black/5">
                              <td className="py-1">{new Date(rec.date_administered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                              <td className="py-1">{rec.vaccination_name}</td>
                              <td className="py-1">${parseFloat(rec.cost || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                          {detailVetRecords.length === 0 && (
                            <tr><td colSpan="3" className="text-center py-4 text-gray-400 text-[10px]">No medical events.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Action buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedAnimal)}
                    className="py-2 px-4 rounded-xl border border-gray-300 font-bold text-xs text-gray-600 hover:bg-gray-50 bg-white"
                  >
                    Edit Info ⚙️
                  </button>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="py-2 px-4 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-xs"
                  >
                    Close Drawer
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REGISTER ANIMAL MODAL */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-content">
            <div className="modal-handle" />
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-primary text-xl font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold font-serif text-primary mb-4 flex items-center gap-2">
              <span>🐂</span> Register New Cattle
            </h3>

            {modalError && <div className="alert-banner alert-danger mb-3 text-xs">{modalError}</div>}
            {modalSuccess && <div className="alert-banner alert-success mb-3 text-xs font-semibold">{modalSuccess}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-primary mb-1">Cattle Tag Number *</label>
                <input
                  type="text"
                  placeholder="e.g. FL-1002"
                  value={tagNumber}
                  onChange={(e) => setTagNumber(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-primary mb-1">Breed</label>
                <input
                  type="text"
                  placeholder="e.g. Brahman, Angus"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-primary mb-1">Entry Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="e.g. 250"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-primary mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="e.g. 500"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-sm shadow-glow-primary transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Register 🐂</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT ANIMAL MODAL */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="modal-content">
            <div className="modal-handle" />
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-primary text-xl font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold font-serif text-primary mb-4 flex items-center gap-2">
              <span>⚙️</span> Edit Cattle Record
            </h3>

            {modalError && <div className="alert-banner alert-danger mb-3 text-xs">{modalError}</div>}
            {modalSuccess && <div className="alert-banner alert-success mb-3 text-xs font-semibold">{modalSuccess}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <span className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Tag Number (Locked)</span>
                <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 font-mono font-bold text-gray-500 text-sm">
                  {selectedAnimal?.tag_number}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-primary mb-1">Breed</label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-primary mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-primary mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-primary mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field bg-white"
                >
                  <option value="active">Active Feeder</option>
                  <option value="ready_for_sale">Market Ready</option>
                  <option value="culled">Culled / Displaced</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-primary mb-1">Health & Treatment Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Vaccinated, slight limp..."
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white font-bold text-sm shadow-glow-primary transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Save Edits 💾</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalsPage;
